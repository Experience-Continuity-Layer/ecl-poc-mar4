export type AgentProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "huggingface"
  | "deepseek";
export type AgentRole = "user" | "assistant" | "system";
export type AgentChannel = "web" | "ivr" | "whatsapp" | "kiosk" | "email";
export type AgentMode = "Observant" | "Contextual" | "Dedicated" | "Autonomous";
export type AgentTone = "empathetic" | "professional" | "friendly" | "direct";
export type AgentVerbosity = "concise" | "balanced" | "detailed";

export interface AgentCustomer {
  name: string | null;
  age: number | null;
  language: string | null;
  preferredChannel: AgentChannel | null;
  tier: string | null;
  phoneNumber: string | null;
  categories: string[];
  intent: string | null;
  emotionalState: string | null;
  device: string | null;
  purchases: string[];
  issues: string[];
}

export interface AgentConfig {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  modes: AgentMode[];
  tone: AgentTone;
  verbosity: AgentVerbosity;
  proactivity: number;
  channels: AgentChannel[];
  preferredEscalationChannel: AgentChannel;
  rememberCustomerAcrossSessions: boolean;
  shareContextAcrossChannels: boolean;
  paused: boolean;
}

export interface ConversationEntry {
  channel: AgentChannel | string;
  role: AgentRole;
  content: string;
  timestamp: string;
}

export interface ChannelHistoryEntry {
  from: string;
  to: string;
  summary: string;
  timestamp: string;
}

export type SignalType =
  | "frustration"
  | "urgency"
  | "satisfaction"
  | "confusion"
  | "escalation_hint"
  | "product_interest"
  | "churn_risk"
  | "loyalty_signal"
  | "comparison_shopping"
  | "repeat_issue"
  | "action_detected"
  | "channel_switch"
  | "info_revealed";

export interface BehavioralSignal {
  channel: string;
  eventType: SignalType | string;
  detail: string;
  confidence: number;
  timestamp: string;
}

export interface ExtractedSignal {
  type: SignalType;
  detail: string;
  confidence: number;
}

export interface ExtractedAction {
  action: string;
  detail: string;
}

export interface ExtractedContext {
  inferredIntent: string | null;
  inferredEmotionalState: string | null;
  inferredName: string | null;
  inferredLanguage: string | null;
  inferredPhoneNumber: string | null;
  signals: ExtractedSignal[];
  topics: string[];
  mentionedProducts: string[];
  mentionedOrderIds: string[];
  actions: ExtractedAction[];
  contextSummary: string;
}

export interface ExtractionRecord {
  turnIndex: number;
  channel: string;
  extracted: ExtractedContext;
  timestamp: string;
}

export interface IntegrationConfig {
  enabled: boolean;
  latencyMs: number;
  mockData: Record<string, unknown>;
}

export type IntegrationsMap = Record<string, IntegrationConfig>;

export interface PendingAction {
  action: string;
  detail: string;
  channel: string;
  timestamp: string;
}

export interface AgentContext {
  customer: AgentCustomer;
  agentConfig: AgentConfig;
  conversationHistory: ConversationEntry[];
  channelHistory: ChannelHistoryEntry[];
  activeChannel: string;
  signals: BehavioralSignal[];
  integrations: IntegrationsMap;
  pendingActions: PendingAction[];
  topics: string[];
  contextSummary: string;
  extractionHistory: ExtractionRecord[];
}
