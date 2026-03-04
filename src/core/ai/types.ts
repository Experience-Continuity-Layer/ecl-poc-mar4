import type { AgentProvider, ConversationEntry } from "../agent-context/types";

export interface AgentAIRequest {
  provider: AgentProvider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  conversationHistory: ConversationEntry[];
}
