import { NextResponse } from "next/server";
import { z } from "zod";
import { agentContextSchema, channelTypeSchema } from "@/core/agent-context/schema";
import { ProviderRequestError, requestAIReply } from "@/core/ai/client";
import { buildExtractionPrompt, parseExtractionResponse } from "@/core/ai/context-extraction";

const requestSchema = z.object({
  context: agentContextSchema,
  channel: channelTypeSchema,
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

    const extractionPrompt = buildExtractionPrompt(parsed.context, parsed.channel);

    const raw = await requestAIReply({
      provider,
      model: parsed.context.agentConfig.model,
      apiKey,
      systemPrompt: extractionPrompt,
      temperature: 0.1,
      maxOutputTokens: 600,
      topP: 1,
      conversationHistory: [],
    });

    const extracted = parseExtractionResponse(raw);

    return NextResponse.json({ extracted });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
