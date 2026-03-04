import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/core/agent-context/prompt-builder";
import {
  agentContextSchema,
  channelTypeSchema,
  conversationEntrySchema,
} from "@/core/agent-context/schema";
import { ProviderRequestError, requestAIReply } from "@/core/ai/client";

const requestSchema = z.object({
  context: agentContextSchema,
  channel: channelTypeSchema,
  systemPrompt: z.string().min(1).optional(),
  conversationHistory: z.array(conversationEntrySchema).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.parse(json);
    const systemPrompt = parsed.systemPrompt ?? buildSystemPrompt(parsed.context);

    const assistantReply = await requestAIReply({
      provider: parsed.context.agentConfig.provider,
      model: parsed.context.agentConfig.model,
      apiKey: parsed.context.agentConfig.apiKey,
      systemPrompt,
      temperature: parsed.context.agentConfig.temperature,
      maxOutputTokens: parsed.context.agentConfig.maxOutputTokens,
      topP: parsed.context.agentConfig.topP,
      conversationHistory: parsed.conversationHistory ?? parsed.context.conversationHistory,
    });

    return NextResponse.json({
      channel: parsed.channel,
      assistantReply,
    });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
