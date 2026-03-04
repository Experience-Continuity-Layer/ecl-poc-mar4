import type { AgentContext, ExtractedContext, SignalType } from "../agent-context/types";
import { extractedContextSchema } from "../agent-context/schema";

const VALID_SIGNAL_TYPES: SignalType[] = [
  "frustration",
  "urgency",
  "satisfaction",
  "confusion",
  "escalation_hint",
  "product_interest",
  "churn_risk",
  "loyalty_signal",
  "comparison_shopping",
  "repeat_issue",
  "action_detected",
  "channel_switch",
  "info_revealed",
];

export function buildExtractionPrompt(context: AgentContext, channel: string): string {
  const recentMessages = context.conversationHistory.slice(-6);
  const conversationBlock = recentMessages
    .map((m) => `[${m.channel}/${m.role}] ${m.content}`)
    .join("\n");

  const currentProfile = [
    `Name: ${context.customer.name ?? "unknown"}`,
    `Intent: ${context.customer.intent ?? "unknown"}`,
    `Emotional state: ${context.customer.emotionalState ?? "unknown"}`,
    `Language: ${context.customer.language ?? "unknown"}`,
    `Topics so far: ${context.topics.length > 0 ? context.topics.join(", ") : "none"}`,
    `Previous summary: ${context.contextSummary || "none"}`,
  ].join("\n");

  return `You are a context extraction engine for a customer service system. Analyze the recent conversation and extract structured signals.

Current known profile:
${currentProfile}

Active channel: ${channel}

Recent conversation:
${conversationBlock}

Extract the following as JSON. Only include fields where you have evidence — leave null/empty when uncertain.

{
  "inferredIntent": string or null — the customer's primary goal right now,
  "inferredEmotionalState": string or null — e.g. "frustrated", "neutral", "anxious", "satisfied", "confused",
  "inferredName": string or null — only if the customer explicitly stated their name,
  "inferredLanguage": string or null — only if clearly identifiable,
  "inferredPhoneNumber": string or null — only if the customer explicitly shared a phone number in the conversation,
  "signals": [
    {
      "type": one of [${VALID_SIGNAL_TYPES.map((t) => `"${t}"`).join(", ")}],
      "detail": string describing what was observed,
      "confidence": number 0-1
    }
  ],
  "topics": [string] — key topics/themes discussed this turn,
  "mentionedProducts": [string] — any products, SKUs, or items mentioned,
  "mentionedOrderIds": [string] — any order IDs referenced,
  "actions": [
    { "action": string — e.g. "start_return", "check_order_status", "request_refund",
      "detail": string }
  ],
  "contextSummary": string — a 1-2 sentence running summary of what you now understand about this customer's situation and needs
}

Rules:
- Be conservative with confidence scores. Only use >0.8 when evidence is explicit.
- Do NOT hallucinate signals. Only report what the conversation actually shows.
- The contextSummary should build on the previous summary, adding new information from this turn.
- For inferredIntent, capture the active goal, not historical ones.
- Return ONLY valid JSON. No markdown, no explanation.`;
}

const EMPTY_EXTRACTION: ExtractedContext = {
  inferredIntent: null,
  inferredEmotionalState: null,
  inferredName: null,
  inferredLanguage: null,
  inferredPhoneNumber: null,
  signals: [],
  topics: [],
  mentionedProducts: [],
  mentionedOrderIds: [],
  actions: [],
  contextSummary: "",
};

export function parseExtractionResponse(raw: string): ExtractedContext {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return EMPTY_EXTRACTION;

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = extractedContextSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("[context-extraction] Validation failed:", validated.error.issues);
      return EMPTY_EXTRACTION;
    }

    return validated.data as ExtractedContext;
  } catch (e) {
    console.warn("[context-extraction] Failed to parse extraction response:", e);
    return EMPTY_EXTRACTION;
  }
}
