import type { AgentContext } from "./types";
import { buildPageContext, buildWebKnowledgeBase } from "@/core/web-knowledge";

function formatIntegrationName(name: string) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase());
}

function getModeInstructions(modes: AgentContext["agentConfig"]["modes"]) {
  const rules: string[] = [];

  if (modes.includes("Observant")) {
    rules.push(
      "Observant mode: explicitly reference at least one concrete fact from known context in each response.",
    );
  }
  if (modes.includes("Contextual")) {
    rules.push(
      "Contextual mode: connect the current request to prior conversation, pending actions, and customer profile.",
    );
  }
  if (modes.includes("Dedicated")) {
    rules.push(
      "Dedicated mode: keep ownership of the issue until resolved, summarize progress, and state the next step.",
    );
  }
  if (modes.includes("Autonomous")) {
    rules.push(
      "Autonomous mode: propose and sequence concrete next actions instead of waiting for broad user direction.",
    );
  }

  return rules.length > 0 ? rules : ["No explicit mode rules are active."];
}

function getVerbosityInstruction(verbosity: AgentContext["agentConfig"]["verbosity"]) {
  if (verbosity === "concise") {
    return "Verbosity rule: keep replies to 2-4 sentences unless the user asks for detail.";
  }
  if (verbosity === "balanced") {
    return "Verbosity rule: keep replies to 4-7 sentences with clear structure.";
  }
  return "Verbosity rule: provide a thorough response in 7-12 sentences with rationale and options.";
}

function getProactivityInstructions(proactivity: AgentContext["agentConfig"]["proactivity"]) {
  if (proactivity <= 1) {
    return [
      "Proactivity rule: strictly reactive. Answer the request only; do not add unsolicited next steps.",
      "Ask at most one clarifying question only when required.",
    ];
  }
  if (proactivity === 2) {
    return [
      "Proactivity rule: mostly reactive with light support.",
      "Offer one optional next step only when it is low-risk and immediately relevant.",
    ];
  }
  if (proactivity === 3) {
    return [
      "Proactivity rule: balanced support.",
      "Offer 1-2 practical next steps and include one clarifying question if needed.",
    ];
  }
  if (proactivity === 4) {
    return [
      "Proactivity rule: proactively drive progress.",
      "Recommend the best next action and provide a short alternative path.",
    ];
  }
  return [
    "Proactivity rule: highly autonomous.",
    "Default to a concrete action plan, assumptions, and immediate execution-oriented guidance.",
  ];
}

function getToneInstruction(tone: AgentContext["agentConfig"]["tone"]) {
  if (tone === "empathetic") {
    return "Tone rule: warm, calm, and reassuring. Acknowledge customer emotion when relevant.";
  }
  if (tone === "professional") {
    return "Tone rule: formal, precise, and policy-aware.";
  }
  if (tone === "friendly") {
    return "Tone rule: approachable and upbeat while staying clear and concise.";
  }
  return "Tone rule: direct and efficient. Avoid softeners and unnecessary filler.";
}

function buildUnknownContextInstructions(context: AgentContext): string[] {
  const unknownFields: string[] = [];
  if (!context.customer.name) unknownFields.push("name");
  if (context.customer.age == null) unknownFields.push("age");
  if (!context.customer.language) unknownFields.push("language");
  if (!context.customer.tier) unknownFields.push("tier");
  if (!context.customer.intent) unknownFields.push("intent");
  if (!context.customer.emotionalState) unknownFields.push("emotional state");
  if (!context.customer.device) unknownFields.push("device");
  if (!context.customer.preferredChannel) unknownFields.push("preferred channel");

  if (unknownFields.length === 0) return [];

  const isFullyAnonymous = unknownFields.length >= 6;

  if (isFullyAnonymous) {
    return [
      "IMPORTANT — This customer is largely or fully anonymous. Very little is known about them.",
      "Do NOT assume any personal details. Greet them warmly without using a name.",
      "Naturally gather context through conversation — infer intent, emotion, and needs from what they say.",
      "Do NOT interrogate them with a list of questions. Let the context build organically.",
      `Unknown fields: ${unknownFields.join(", ")}.`,
    ];
  }

  return [
    `Some customer details are still unknown: ${unknownFields.join(", ")}.`,
    "Use available context and infer what you can from the conversation. Do not ask for missing details unless it is essential to help them.",
  ];
}

export function buildSystemPrompt(
  context: AgentContext,
  channelMetadata?: Record<string, string>,
): string {
  const fullHistory = context.conversationHistory
    .map(
      (message) =>
        `[${message.timestamp}] (${message.channel}/${message.role}) ${message.content}`,
    )
    .join("\n");

  const integrationEntries = Object.entries(context.integrations);

  const integrationStatusLines = integrationEntries
    .map(([name, integration]) => {
      const displayName = formatIntegrationName(name);
      if (!integration.enabled) {
        return `${displayName}: OFFLINE — service unavailable. Do not promise data from this source.`;
      }
      const scenario = integration.mockData?.scenario;
      const latency = integration.latencyMs;
      if (scenario === "degraded") {
        return `${displayName}: DEGRADED (${latency}ms) — partial data, acknowledge limitations to the customer.`;
      }
      if (scenario === "slow") {
        return `${displayName}: SLOW (${latency}ms) — service responding with delays.`;
      }
      if (scenario === "offline") {
        return `${displayName}: OFFLINE — service unavailable. Do not promise data from this source.`;
      }
      return `${displayName}: Healthy (${latency}ms)`;
    })
    .join("\n");

  const hasIntegrationIssues = integrationEntries.some(
    ([, i]) => !i.enabled || ["degraded", "slow", "offline"].includes(String(i.mockData?.scenario ?? "")),
  );

  const disabledIntegrations = integrationEntries
    .filter(([, integration]) => !integration.enabled)
    .map(([name]) => formatIntegrationName(name))
    .join(", ");

  const pendingActions =
    context.pendingActions.length === 0
      ? "None"
      : context.pendingActions
          .map(
            (action) =>
              `${action.timestamp} [${action.channel}] ${action.action}: ${action.detail}`,
          )
          .join("\n");

  const modeInstructions = getModeInstructions(context.agentConfig.modes).join("\n");
  const verbosityInstruction = getVerbosityInstruction(context.agentConfig.verbosity);
  const proactivityInstructions = getProactivityInstructions(context.agentConfig.proactivity).join("\n");
  const toneInstruction = getToneInstruction(context.agentConfig.tone);

  const recentSignals = context.signals.slice(-20);
  const relevantSignals = recentSignals.filter((s) => {
    if (s.channel === context.activeChannel) return true;
    return s.eventType === "escalation_hint" || s.eventType === "repeat_issue" || s.eventType === "churn_risk";
  });

  const formattedSignals =
    relevantSignals.length > 0
      ? relevantSignals
          .slice(-10)
          .map(
            (s) =>
              `[${s.timestamp}] (${s.channel}) ${s.eventType} [${Math.round(
                s.confidence * 100,
              )}%]: ${s.detail}`,
          )
          .join("\n")
      : "No recent behavioral signals for the active channel.";

  const knowledgeChannels = ["web", "whatsapp"];
  const includeKnowledge = knowledgeChannels.includes(context.activeChannel);

  const knowledgeBlock: string[] = includeKnowledge
    ? [
        "",
        "Knowledge Base (Aurelia Motors):",
        buildWebKnowledgeBase(),
        "",
        "GROUNDING RULE: When answering questions about vehicles, ownership, support, or this account, use ONLY the facts from the Knowledge Base above and the customer profile. Do NOT fabricate product names, prices, specifications, policies, or order details. If the answer is not in the knowledge base, say you don't have that information.",
      ]
    : [];

  const webOnlyBlock: string[] =
    context.activeChannel === "web"
      ? [
          "",
          "Current web page context:",
          buildPageContext(
            channelMetadata?.currentPage ?? "unknown",
            channelMetadata?.pageTitle ?? "Aurelia Motors",
          ),
          "",
          "You are embedded inside the Aurelia Motors website.",
          "",
          "RICH UI MARKERS: You can optionally embed markers in your reply to render inline cards and actions. Use them only when they make the answer clearer. Write markers exactly as shown — no backticks, no extra formatting.",
          "",
          "Marker types:",
          "  {{model:slug}} — show a compact card for a model. Valid slugs: astra-x, orion-s, atlas-tour, nova-crossover, helios-gt, lumen-e.",
          "  {{link:label|page}} — navigate the site. Valid page targets: home, models, model-detail/SLUG, ownership, support, my-account.",
          "  {{action:label|action-id}} — propose an action. Valid action IDs: book-test-drive, open-account, view-orders, go-support.",
          "  {{info:title|content}} — highlight an important fact in a callout.",
          "",
          "Keep the natural language answer readable even if markers are stripped out. Do not wrap markers in backticks or other formatting.",
        ]
      : [];

  const messagingBlock: string[] =
    context.activeChannel === "whatsapp"
      ? [
          "",
          "You are responding on the messaging channel. Keep replies conversational and slightly shorter than on the web.",
          "Do NOT use rich UI markers ({{model:...}}, {{link:...}}, etc.) — this channel renders plain text only.",
          "Avoid asking for information already in context — especially contact details (phone, name) and prior intents.",
          ...(context.channelHistory.some((h) => h.to === "whatsapp")
            ? [
                "The customer was handed off from another channel. Acknowledge the switch succinctly (e.g. 'I'll pick up from where we left off on the website.') and continue without asking them to repeat anything.",
              ]
            : []),
        ]
      : [];

  return [
    "You are an orchestration agent for a multi-channel continuity system.",
    "Preserve continuity across channels and never ask the user to repeat information.",
    "When you respond, address the customer by name and acknowledge their top known issue when relevant.",
    `Active modes: ${context.agentConfig.modes.join(", ") || "None"}.`,
    `Respond in a ${context.agentConfig.tone} tone with ${context.agentConfig.verbosity} verbosity.`,
    `Proactivity level: ${context.agentConfig.proactivity}.`,
    `Preferred escalation channel: ${context.agentConfig.preferredEscalationChannel}.`,
    `Share context across channels: ${context.agentConfig.shareContextAcrossChannels ? "yes" : "no"}.`,
    `Remember customer across sessions: ${context.agentConfig.rememberCustomerAcrossSessions ? "yes" : "no"}.`,
    "",
    "Response behavior rules:",
    toneInstruction,
    verbosityInstruction,
    proactivityInstructions,
    "Mode-specific rules:",
    modeInstructions,
    "Always end with either a clear next step or a concise confirmation of completion.",
    "",
    "Customer profile:",
    `Name: ${context.customer.name ?? "Unknown"}`,
    `Age: ${context.customer.age ?? "Unknown"}`,
    `Language: ${context.customer.language ?? "Unknown"}`,
    `Preferred channel: ${context.customer.preferredChannel ?? "Unknown"}`,
    `Tier: ${context.customer.tier ?? "Unknown"}`,
    `Phone: ${context.customer.phoneNumber ?? "Unknown"}`,
    `Categories: ${context.customer.categories.join(", ") || "none"}`,
    `Intent: ${context.customer.intent ?? "Unknown"}`,
    `Emotional state: ${context.customer.emotionalState ?? "Unknown"}`,
    `Device: ${context.customer.device ?? "Unknown"}`,
    `Purchases: ${context.customer.purchases.join(", ") || "none"}`,
    `Known issues: ${context.customer.issues.join(", ") || "none"}`,
    `Active channel: ${context.activeChannel}`,
    "",
    ...buildUnknownContextInstructions(context),
    "",
    "Full conversation history:",
    fullHistory || "No previous messages.",
    "",
    "Data integration status:",
    integrationStatusLines || "No integrations configured.",
    "",
    ...(disabledIntegrations
      ? [`Offline integrations: ${disabledIntegrations}.`]
      : []),
    "",
    "Integration rules:",
    "- When a data source is DEGRADED or OFFLINE, proactively acknowledge it and explain any limitations or delays to the customer.",
    "- Do NOT promise information from an offline source. Instead, suggest alternatives (e.g. calling support, trying again later).",
    "- When a source is SLOW, you may note that information might take longer to retrieve.",
    ...(hasIntegrationIssues
      ? ["- IMPORTANT: Some systems are currently impaired. Factor this into your response — be transparent about what you can and cannot do right now."]
      : []),
    "",
    "Pending actions:",
    pendingActions,
    "",
    "Accumulated topics:",
    context.topics.length > 0 ? context.topics.join(", ") : "None yet.",
    "",
    "Running context summary (built from prior turns):",
    context.contextSummary || "No summary yet — this may be the first interaction.",
    "",
    "Recent behavioral signals (filtered):",
    formattedSignals,
    "",
    "Use only these recent signals when inferring what the customer is trying to do right now. Prefer signals from the active channel over older ones from other channels.",
    "",
    "Channel handoff history:",
    context.channelHistory.length > 0
      ? context.channelHistory
          .slice(-5)
          .map((h) => `[${h.timestamp}] ${h.from} -> ${h.to}: ${h.summary}`)
          .join("\n")
      : "No channel switches yet.",
    "",
    "Use the accumulated context, signals, and summary above to maintain continuity.",
    "Build on what you already know — never ask the customer to repeat information that is in the context.",
    ...knowledgeBlock,
    ...webOnlyBlock,
    ...messagingBlock,
  ].join("\n");
}
