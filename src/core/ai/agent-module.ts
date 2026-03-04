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

/**
 * Generates a context-aware greeting on the target channel after a handoff.
 * Called automatically when the user confirms a channel switch from the web chat.
 */
export async function runHandoffGreeting(targetChannel: string): Promise<string> {
  const context = useAgentContextStore.getState().context;
  if (!context.agentConfig.channels.includes(targetChannel as AgentChannel)) {
    throw new Error(`Channel "${targetChannel}" is disabled in Agent Control Center.`);
  }

  const customerName = context.customer.name ?? "there";
  const previousChannel = context.activeChannel;
  const summary = context.contextSummary || "general inquiry";
  const lastTopic = context.topics.length > 0 ? context.topics[context.topics.length - 1] : null;

  const greetingPrompt = [
    "Generate a brief, warm greeting for a customer arriving on a new messaging channel after being handed off.",
    `Customer name: ${customerName}`,
    `Previous channel: ${previousChannel}`,
    `Context summary: ${summary}`,
    lastTopic ? `Most recent topic: ${lastTopic}` : "",
    "",
    "Rules:",
    "- 1-2 sentences maximum.",
    "- Acknowledge you're continuing from the previous channel.",
    "- Reference the specific topic or issue they were discussing.",
    "- Sound natural and human, not robotic.",
    "- Do NOT use rich UI markers (no {{...}} syntax).",
    "- Do NOT ask them to repeat anything.",
  ].filter(Boolean).join("\n");

  const scopedHistory = context.agentConfig.shareContextAcrossChannels
    ? context.conversationHistory
    : context.conversationHistory.filter((e) => e.channel === targetChannel);

  const requestContext = { ...context, conversationHistory: scopedHistory };

  const response = await fetch("/api/agent/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: requestContext,
      channel: targetChannel,
      systemPrompt: buildSystemPrompt(requestContext) + "\n\n" + greetingPrompt,
      conversationHistory: scopedHistory,
    }),
  });

  const data = (await response.json()) as { assistantReply?: string; error?: string };
  if (!response.ok || !data.assistantReply) {
    throw new Error(data.error ?? "Unable to generate handoff greeting.");
  }

  logMessage(targetChannel, "assistant", data.assistantReply);

  return data.assistantReply;
}
