"use client";

import { produce } from "immer";
import { create } from "zustand";
import { buildSystemPrompt } from "./prompt-builder";
import type {
  AgentChannel,
  AgentContext,
  AgentRole,
  BehavioralSignal,
  ChannelHistoryEntry,
  ExtractedContext,
} from "./types";

const providerModels = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-2.5-flash",
  huggingface: "meta-llama/Meta-Llama-3-8B-Instruct",
  deepseek: "deepseek-reasoner",
} as const;

interface AgentContextStore {
  context: AgentContext;
  updateContext: <K extends keyof AgentContext>(key: K, value: AgentContext[K]) => void;
  getContext: <K extends keyof AgentContext>(key: K) => AgentContext[K];
  logMessage: (channel: string, role: AgentRole, content: string) => void;
  logChannelEvent: (channel: string, eventType: string, detail: string) => void;
  logSignal: (signal: Omit<BehavioralSignal, "timestamp"> & { timestamp?: string }) => void;
  clearContext: () => void;
  getSystemPrompt: () => string;
  pushPendingAction: (action: string, detail: string, channel: string) => void;
  applyExtractedContext: (channel: string, extracted: ExtractedContext) => void;
}

const initialContext: AgentContext = {
  customer: {
    name: null,
    age: null,
    language: null,
    preferredChannel: null,
    tier: null,
    phoneNumber: null,
    categories: [],
    intent: null,
    emotionalState: null,
    device: null,
    purchases: [],
    issues: [],
  },
  agentConfig: {
    provider: "openai",
    apiKey: "",
    model: providerModels.openai,
    temperature: 0.2,
    maxOutputTokens: 400,
    topP: 1,
    modes: ["Observant", "Contextual"],
    tone: "empathetic",
    verbosity: "concise",
    proactivity: 3,
    channels: ["web", "ivr", "whatsapp", "kiosk", "email"],
    preferredEscalationChannel: "whatsapp",
    rememberCustomerAcrossSessions: false,
    shareContextAcrossChannels: true,
    paused: false,
  },
  conversationHistory: [],
  channelHistory: [],
  activeChannel: "web",
  signals: [],
  integrations: {
    crm: {
      enabled: true,
      latencyMs: 150,
      mockData: {
        customerId: "AM-CUST-10244",
        accountOwner: "City Hub Amsterdam",
        loyaltyTier: "Premium",
      },
    },
    orderManagement: {
      enabled: true,
      latencyMs: 220,
      mockData: {
        lastOrderId: "AM-44281",
        orderTitle: "Astra X · Delivery prep",
        status: "in-progress",
        etaDays: 5,
      },
    },
    productCatalog: {
      enabled: true,
      latencyMs: 180,
      mockData: {
        featuredModel: "Astra X",
        inventoryNote: "Nova Crossover wait-list: ~4 weeks",
      },
    },
    knowledgeBase: {
      enabled: true,
      latencyMs: 120,
      mockData: {
        topArticle: "How to troubleshoot home charging issues",
        policyVersion: "2026.02",
      },
    },
    payment: {
      enabled: true,
      latencyMs: 260,
      mockData: {
        cardOnFile: true,
        subscriptionActive: true,
        refundWindowDays: 30,
      },
    },
    notifications: {
      enabled: true,
      latencyMs: 140,
      mockData: {
        smsOptIn: true,
        emailOptIn: true,
        deliveryAlerts: true,
      },
    },
  },
  pendingActions: [],
  topics: [],
  contextSummary: "",
  extractionHistory: [],
};

export const useAgentContextStore = create<AgentContextStore>((set, get) => ({
  context: initialContext,
  updateContext: (key, value) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        draft[key] = value;
      }),
    })),
  getContext: (key) => get().context[key],
  logMessage: (channel, role, content) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        draft.conversationHistory.push({
          channel,
          role,
          content,
          timestamp: new Date().toISOString(),
        });
        draft.activeChannel = channel;
      }),
    })),
  logChannelEvent: (channel, eventType, detail) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        draft.signals.push({
          channel,
          eventType,
          detail,
          confidence: 1,
          timestamp: new Date().toISOString(),
        });
        draft.channelHistory.push({
          from: draft.activeChannel,
          to: channel,
          summary: `${eventType}: ${detail}`,
          timestamp: new Date().toISOString(),
        });
        draft.activeChannel = channel;
      }),
    })),
  logSignal: (signal) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        const timestamp = signal.timestamp ?? new Date().toISOString();
        draft.signals.push({
          channel: signal.channel,
          eventType: signal.eventType,
          detail: signal.detail,
          confidence: signal.confidence,
          timestamp,
        });
        const MAX_SIGNALS = 100;
        if (draft.signals.length > MAX_SIGNALS) {
          draft.signals.splice(0, draft.signals.length - MAX_SIGNALS);
        }
      }),
    })),
  clearContext: () =>
    set((state) => ({
      context: {
        ...initialContext,
        customer: state.context.agentConfig.rememberCustomerAcrossSessions
          ? state.context.customer
          : initialContext.customer,
        agentConfig: {
          ...initialContext.agentConfig,
          apiKey: state.context.agentConfig.apiKey,
          rememberCustomerAcrossSessions: state.context.agentConfig.rememberCustomerAcrossSessions,
        },
      },
    })),
  getSystemPrompt: () => buildSystemPrompt(get().context),
  pushPendingAction: (action, detail, channel) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        draft.pendingActions.push({
          action,
          detail,
          channel,
          timestamp: new Date().toISOString(),
        });
      }),
    })),
  applyExtractedContext: (channel, extracted) =>
    set((state) => ({
      context: produce(state.context, (draft) => {
        const now = new Date().toISOString();

        if (extracted.inferredIntent) {
          draft.customer.intent = extracted.inferredIntent;
        }
        if (extracted.inferredEmotionalState) {
          draft.customer.emotionalState = extracted.inferredEmotionalState;
        }
        if (extracted.inferredName && !draft.customer.name) {
          draft.customer.name = extracted.inferredName;
        }
        if (extracted.inferredLanguage && !draft.customer.language) {
          draft.customer.language = extracted.inferredLanguage;
        }

        for (const sig of extracted.signals) {
          draft.signals.push({
            channel,
            eventType: sig.type,
            detail: sig.detail,
            confidence: sig.confidence,
            timestamp: now,
          });
        }

        const existingTopics = new Set(draft.topics);
        for (const topic of extracted.topics) {
          if (!existingTopics.has(topic)) {
            draft.topics.push(topic);
          }
        }

        for (const product of extracted.mentionedProducts) {
          if (!draft.customer.categories.includes(product)) {
            draft.customer.categories.push(product);
          }
        }

        for (const orderId of extracted.mentionedOrderIds) {
          const issueTag = `Order ${orderId}`;
          if (!draft.customer.issues.includes(issueTag)) {
            draft.customer.issues.push(issueTag);
          }
        }

        for (const action of extracted.actions) {
          draft.pendingActions.push({
            action: action.action,
            detail: action.detail,
            channel,
            timestamp: now,
          });
        }

        if (extracted.contextSummary) {
          draft.contextSummary = extracted.contextSummary;
        }

        draft.extractionHistory.push({
          turnIndex: Math.floor(draft.conversationHistory.length / 2),
          channel,
          extracted,
          timestamp: now,
        });
      }),
    })),
}));

export function getDefaultModelForProvider(provider: AgentContext["agentConfig"]["provider"]) {
  return providerModels[provider];
}

export function updateContext<K extends keyof AgentContext>(key: K, value: AgentContext[K]) {
  useAgentContextStore.getState().updateContext(key, value);
}

export function getContext<K extends keyof AgentContext>(key: K): AgentContext[K] {
  return useAgentContextStore.getState().getContext(key);
}

export function logMessage(channel: AgentChannel | string, role: AgentRole, content: string) {
  useAgentContextStore.getState().logMessage(channel, role, content);
}

export function logChannelEvent(channel: string, eventType: string, detail: string) {
  useAgentContextStore.getState().logChannelEvent(channel, eventType, detail);
}

export function logBehavioralSignal(
  signal: Omit<BehavioralSignal, "timestamp"> & { timestamp?: string },
) {
  useAgentContextStore.getState().logSignal(signal);
}

export function clearContext() {
  useAgentContextStore.getState().clearContext();
}

export function getSystemPrompt() {
  return useAgentContextStore.getState().getSystemPrompt();
}

export function applyExtractedContext(channel: string, extracted: ExtractedContext) {
  useAgentContextStore.getState().applyExtractedContext(channel, extracted);
}

/**
 * Returns the latest channel handoff where the user switched *to* the given target channel.
 * Useful for rendering handoff banners in channel windows.
 */
export function getLatestChannelHandoff(
  targetChannel: AgentChannel | string,
): ChannelHistoryEntry | null {
  const history = useAgentContextStore.getState().context.channelHistory;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].to === targetChannel) return history[i];
  }
  return null;
}

/**
 * Returns the last N channel handoff entries (most recent first).
 * Useful for Context Inspector and other global channel-switch indicators.
 */
export function getRecentChannelHandoffs(n = 5): ChannelHistoryEntry[] {
  const history = useAgentContextStore.getState().context.channelHistory;
  return history.slice(-n).reverse();
}
