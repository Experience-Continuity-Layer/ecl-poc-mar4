import { z } from "zod";

export const channelTypeSchema = z.enum([
  "web",
  "ivr",
  "whatsapp",
  "kiosk",
  "email",
]);

export const roleSchema = z.enum(["user", "assistant", "system"]);
export const modeSchema = z.enum(["Observant", "Contextual", "Dedicated", "Autonomous"]);
export const toneSchema = z.enum(["empathetic", "professional", "friendly", "direct"]);
export const verbositySchema = z.enum(["concise", "balanced", "detailed"]);
export const providerSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "huggingface",
  "deepseek",
]);

export const customerSchema = z.object({
  name: z.string().min(1).nullable(),
  age: z.number().int().nonnegative().nullable(),
  language: z.string().min(1).nullable(),
  preferredChannel: channelTypeSchema.nullable(),
  tier: z.string().min(1).nullable(),
  phoneNumber: z.string().min(1).nullable().default(null),
  categories: z.array(z.string()),
  intent: z.string().min(1).nullable(),
  emotionalState: z.string().min(1).nullable(),
  device: z.string().min(1).nullable(),
  purchases: z.array(z.string()),
  issues: z.array(z.string()),
});

export const agentConfigSchema = z.object({
  provider: providerSchema,
  apiKey: z.string(),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxOutputTokens: z.number().int().min(64).max(4096),
  topP: z.number().min(0).max(1),
  modes: z.array(modeSchema),
  tone: toneSchema,
  verbosity: verbositySchema,
  proactivity: z.number().int().min(1).max(5),
  channels: z.array(channelTypeSchema),
  preferredEscalationChannel: channelTypeSchema,
  rememberCustomerAcrossSessions: z.boolean(),
  shareContextAcrossChannels: z.boolean(),
  paused: z.boolean(),
});

export const conversationEntrySchema = z.object({
  channel: z.string().min(1),
  role: roleSchema,
  content: z.string().min(1),
  timestamp: z.string().min(1),
});

export const channelHistorySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  summary: z.string().min(1),
  timestamp: z.string().min(1),
});

export const signalTypeSchema = z.enum([
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
]);

export const behavioralSignalSchema = z.object({
  channel: z.string().min(1),
  eventType: z.string().min(1),
  detail: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1),
  timestamp: z.string().min(1),
});

export const extractedSignalSchema = z.object({
  type: signalTypeSchema,
  detail: z.string(),
  confidence: z.number().min(0).max(1),
});

export const extractedActionSchema = z.object({
  action: z.string(),
  detail: z.string(),
});

export const extractedContextSchema = z.object({
  inferredIntent: z.string().nullable().default(null),
  inferredEmotionalState: z.string().nullable().default(null),
  inferredName: z.string().nullable().default(null),
  inferredLanguage: z.string().nullable().default(null),
  inferredPhoneNumber: z.string().nullable().default(null),
  signals: z.array(extractedSignalSchema).default([]),
  topics: z.array(z.string()).default([]),
  mentionedProducts: z.array(z.string()).default([]),
  mentionedOrderIds: z.array(z.string()).default([]),
  actions: z.array(extractedActionSchema).default([]),
  contextSummary: z.string().default(""),
});

export const extractionRecordSchema = z.object({
  turnIndex: z.number().int().nonnegative(),
  channel: z.string().min(1),
  extracted: extractedContextSchema,
  timestamp: z.string().min(1),
});

export const integrationSchema = z.object({
  enabled: z.boolean(),
  latencyMs: z.number().nonnegative(),
  mockData: z.record(z.unknown()),
});

export const pendingActionSchema = z.object({
  action: z.string().min(1),
  detail: z.string().min(1),
  channel: z.string().min(1),
  timestamp: z.string().min(1),
});

export const agentContextSchema = z.object({
  customer: customerSchema,
  agentConfig: agentConfigSchema,
  conversationHistory: z.array(conversationEntrySchema),
  channelHistory: z.array(channelHistorySchema),
  activeChannel: z.string().min(1),
  signals: z.array(behavioralSignalSchema),
  integrations: z.record(integrationSchema),
  pendingActions: z.array(pendingActionSchema),
  topics: z.array(z.string()).default([]),
  contextSummary: z.string().default(""),
  extractionHistory: z.array(extractionRecordSchema).default([]),
});

export type AgentContextInput = z.infer<typeof agentContextSchema>;
