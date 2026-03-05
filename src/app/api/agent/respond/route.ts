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

const providerEnvKeys: Record<string, string> = {
  openai: process.env.OPENAI_API_KEY ?? "",
  anthropic: process.env.ANTHROPIC_API_KEY ?? "",
  google: process.env.GOOGLE_API_KEY ?? "",
  huggingface: process.env.HUGGINGFACE_API_KEY ?? "",
  deepseek: process.env.DEEPSEEK_API_KEY ?? "",
};

export async function POST(request: Request) {
  try {
    const headerApiKey = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const json = await request.json();
    const parsed = requestSchema.parse(json);
    const provider = parsed.context.agentConfig.provider;
    const apiKey = headerApiKey || providerEnvKeys[provider] || "";
    const systemPrompt = parsed.systemPrompt ?? buildSystemPrompt(parsed.context);

    const assistantReply = await requestAIReply({
      provider,
      model: parsed.context.agentConfig.model,
      apiKey,
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
