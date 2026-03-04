import { NextResponse } from "next/server";
import { z } from "zod";
import { agentContextSchema, channelTypeSchema } from "@/core/agent-context/schema";
import { ProviderRequestError, requestAIReply } from "@/core/ai/client";
import { buildExtractionPrompt, parseExtractionResponse } from "@/core/ai/context-extraction";

const requestSchema = z.object({
  context: agentContextSchema,
  channel: channelTypeSchema,
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = requestSchema.parse(json);

    const extractionPrompt = buildExtractionPrompt(parsed.context, parsed.channel);

    const raw = await requestAIReply({
      provider: parsed.context.agentConfig.provider,
      model: parsed.context.agentConfig.model,
      apiKey: parsed.context.agentConfig.apiKey,
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
