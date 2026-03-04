"use client";

import {
  applyExtractedContext,
  logMessage,
  useAgentContextStore,
} from "@/core/agent-context/store";
import { buildSystemPrompt } from "@/core/agent-context/prompt-builder";
import type { AgentChannel, ExtractedContext } from "@/core/agent-context/types";

async function runContextExtraction(channel: string): Promise<void> {
  try {
    const context = useAgentContextStore.getState().context;
    const response = await fetch("/api/agent/extract-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, channel }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as { extracted?: ExtractedContext; error?: string };
    if (data.extracted) {
      applyExtractedContext(channel, data.extracted);
    }
  } catch {
    // Extraction is non-blocking — a failure here should never break the main flow
  }
}

export async function runAgentTurn(
  channel: string,
  userMessage: string,
  channelMetadata?: Record<string, string>,
): Promise<string> {
  const contextBeforeTurn = useAgentContextStore.getState().context;
  if (!contextBeforeTurn.agentConfig.channels.includes(channel as AgentChannel)) {
    throw new Error(`Channel "${channel}" is disabled in Agent Control Center.`);
  }

  logMessage(channel, "user", userMessage);

  const context = useAgentContextStore.getState().context;
  const scopedConversationHistory = context.agentConfig.shareContextAcrossChannels
    ? context.conversationHistory
    : context.conversationHistory.filter((entry) => entry.channel === channel);
  const requestContext = {
    ...context,
    conversationHistory: scopedConversationHistory,
  };

  const response = await fetch("/api/agent/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: requestContext,
      channel,
      systemPrompt: buildSystemPrompt(requestContext, channelMetadata),
      conversationHistory: scopedConversationHistory,
    }),
  });

  const data = (await response.json()) as { assistantReply?: string; error?: string };
  if (!response.ok || !data.assistantReply) {
    throw new Error(data.error ?? "Unable to get assistant response.");
  }

  logMessage(channel, "assistant", data.assistantReply);

  // Fire-and-forget: extract context from this turn to build the accumulating picture
  runContextExtraction(channel);

  return data.assistantReply;
}
