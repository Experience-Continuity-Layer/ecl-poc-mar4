"use client";

import { FormEvent, useMemo, useState } from "react";
import { Send, Loader2, Play, RotateCcw } from "lucide-react";
import { runAgentTurn } from "@/core/ai/agent-module";
import {
  clearContext,
  getDefaultModelForProvider,
  getLatestChannelHandoff,
  updateContext,
  useAgentContextStore,
} from "@/core/agent-context/store";
import type { AgentChannel, AgentConfig, AgentMode, AgentProvider } from "@/core/agent-context/types";
import {
  Accordion,
  ActionButton,
  FieldGroup,
  Inline,
  OptionCard,
  SegmentControl,
  SliderField,
  Stack,
  StatusDot,
  SwitchToggle,
  TabBar,
  Tag,
  TextInput,
  ToolAppSurface,
  ToolSection,
  toDisplayLabel,
} from "../tooling/design-system/primitives";

const channelOptions: AgentChannel[] = ["web", "ivr", "whatsapp", "kiosk", "email"];
const toneOptions = ["empathetic", "professional", "friendly", "direct"] as const;
const verbosityOptions = ["concise", "balanced", "detailed"] as const;
const proactivityLabels: Record<number, string> = {
  1: "Reactive",
  2: "Supportive",
  3: "Balanced",
  4: "Proactive",
  5: "Autonomous",
};

const providerMeta: { id: AgentProvider; label: string; defaultModel: string }[] = [
  { id: "openai", label: "OpenAI", defaultModel: "gpt-4.1-mini" },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-6" },
  { id: "google", label: "Google", defaultModel: "gemini-2.5-flash" },
  { id: "huggingface", label: "HuggingFace", defaultModel: "Meta-Llama-3-8B" },
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-reasoner" },
];

const modeDescriptions: Record<AgentMode, { icon: string; desc: string }> = {
  Observant: { icon: "👁", desc: "Reference concrete facts from known context" },
  Contextual: { icon: "🔗", desc: "Connect requests to prior conversation & profile" },
  Dedicated: { icon: "🎯", desc: "Own the issue until resolved, track progress" },
  Autonomous: { icon: "⚡", desc: "Propose and sequence actions proactively" },
};

type ConfigSnapshot = {
  id: string;
  name: string;
  config: AgentConfig;
  createdAt: string;
};

type ComparisonRun = {
  snapshotId: string;
  snapshotName: string;
  output: string;
  error: string | null;
  charCount: number;
  wordCount: number;
  channel: AgentChannel;
  timestamp: string;
};

type AgentCenterTab = "controls" | "chat" | "comparison";

const tabDefs: { id: AgentCenterTab; label: string }[] = [
  { id: "controls", label: "Controls" },
  { id: "chat", label: "Chat" },
  { id: "comparison", label: "Comparison" },
];

/* ─── Status bar ─── */

function AgentStatusBar() {
  const context = useAgentContextStore((s) => s.context);
  const channelHistory = useAgentContextStore((s) => s.context.channelHistory);
  const { paused, apiKey } = context.agentConfig;
  const latestHandoff = useMemo(
    () => getLatestChannelHandoff(context.activeChannel),
    [channelHistory, context.activeChannel],
  );

  const { label, variant } = useMemo(() => {
    if (paused) return { label: "Paused", variant: "neutral" as const };
    if (!apiKey.trim()) return { label: "No API key", variant: "warning" as const };
    return { label: "Ready", variant: "success" as const };
  }, [paused, apiKey]);

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot variant={variant} pulse={variant === "success"} />
          <span className="type-body-sm font-medium text-zinc-800">Agent {label}</span>
          <span className="type-caption text-zinc-500">
            · Active: {toDisplayLabel(context.activeChannel)}
          </span>
        </div>
        <ActionButton
          label={paused ? "Resume" : "Pause"}
          variant={paused ? "primary" : "secondary"}
          onClick={() =>
            updateContext("agentConfig", {
              ...useAgentContextStore.getState().context.agentConfig,
              paused: !paused,
            })
          }
        />
      </div>
      {latestHandoff && (
        <div className="flex items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 px-3 py-1.5">
          <span className="type-caption text-cyan-700">
            {latestHandoff.from} → {latestHandoff.to}
          </span>
          <span className="type-caption text-zinc-500 truncate flex-1" title={latestHandoff.summary}>
            {latestHandoff.summary}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Controls tab ─── */

function AgentControlsTab({ onError }: { onError: (msg: string) => void }) {
  const context = useAgentContextStore((s) => s.context);
  const cfg = context.agentConfig;

  const patch = (updates: Partial<AgentConfig>) =>
    updateContext("agentConfig", { ...cfg, ...updates });

  const onProviderChange = (provider: AgentProvider) =>
    patch({ provider, model: getDefaultModelForProvider(provider) });

  const onModeToggle = (mode: AgentMode) => {
    const has = cfg.modes.includes(mode);
    patch({ modes: has ? cfg.modes.filter((m) => m !== mode) : [...new Set([...cfg.modes, mode])] });
  };

  const onChannelToggle = (channel: AgentChannel, enabled: boolean) => {
    if (!enabled && cfg.channels.length <= 1 && cfg.channels.includes(channel)) {
      onError("At least one channel must remain enabled.");
      return;
    }
    const nextChannels = enabled
      ? [...new Set([...cfg.channels, channel])]
      : cfg.channels.filter((c) => c !== channel);
    const preferredEscalationChannel = nextChannels.includes(cfg.preferredEscalationChannel)
      ? cfg.preferredEscalationChannel
      : nextChannels[0] ?? "web";
    const activeChannel = nextChannels.includes(context.activeChannel as AgentChannel)
      ? context.activeChannel
      : preferredEscalationChannel;
    patch({ channels: nextChannels, preferredEscalationChannel });
    updateContext("activeChannel", activeChannel);
  };

  return (
    <div className="layout-stack-lg h-full overflow-auto rounded-xl bg-[var(--surface-panel)] p-5">
      {/* Model */}
      <ToolSection title="Model" variant="flat">
        <div className="grid grid-cols-2 gap-2">
          {providerMeta.map((p) => (
            <OptionCard
              key={p.id}
              selected={cfg.provider === p.id}
              onClick={() => onProviderChange(p.id)}
              title={p.label}
              description={p.defaultModel}
            />
          ))}
        </div>

        <FieldGroup label="API key" hint="Stored in memory only, never persisted">
          <TextInput
            type="password"
            value={cfg.apiKey}
            onChange={(v) => patch({ apiKey: v })}
            placeholder="sk-..."
          />
        </FieldGroup>

        <FieldGroup label="Model override">
          <TextInput
            value={cfg.model}
            onChange={(v) => patch({ model: v })}
            placeholder={providerMeta.find((p) => p.id === cfg.provider)?.defaultModel}
          />
        </FieldGroup>

        <Accordion title="Advanced parameters">
          <Stack gap="md">
            <SliderField
              label="Temperature"
              valueLabel={cfg.temperature.toFixed(2)}
              value={cfg.temperature}
              min={0}
              max={2}
              step={0.05}
              onChange={(v) => patch({ temperature: v })}
            />
            <SliderField
              label="Top P"
              valueLabel={cfg.topP.toFixed(2)}
              value={cfg.topP}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => patch({ topP: v })}
            />
            <SliderField
              label="Max output tokens"
              valueLabel={String(cfg.maxOutputTokens)}
              value={cfg.maxOutputTokens}
              min={64}
              max={2048}
              step={32}
              onChange={(v) => patch({ maxOutputTokens: v })}
            />
          </Stack>
        </Accordion>
      </ToolSection>

      {/* Personality */}
      <ToolSection title="Personality" variant="flat">
        <FieldGroup label="Tone">
          <div className="grid grid-cols-4 gap-1.5">
            {toneOptions.map((tone) => (
              <SegmentControl
                key={tone}
                active={cfg.tone === tone}
                label={toDisplayLabel(tone)}
                onClick={() => patch({ tone })}
              />
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="Verbosity">
          <div className="grid grid-cols-3 gap-1.5">
            {verbosityOptions.map((v) => (
              <SegmentControl
                key={v}
                active={cfg.verbosity === v}
                label={toDisplayLabel(v)}
                onClick={() => patch({ verbosity: v })}
              />
            ))}
          </div>
        </FieldGroup>
        <SliderField
          label="Proactivity"
          valueLabel={`${cfg.proactivity} — ${proactivityLabels[cfg.proactivity]}`}
          value={cfg.proactivity}
          min={1}
          max={5}
          onChange={(v) => patch({ proactivity: v })}
        />
      </ToolSection>

      {/* Modes */}
      <ToolSection title="Active Modes" variant="flat" description="Select which behavioral modes the agent uses">
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(modeDescriptions) as AgentMode[]).map((mode) => (
            <OptionCard
              key={mode}
              selected={cfg.modes.includes(mode)}
              onClick={() => onModeToggle(mode)}
              title={mode}
              description={modeDescriptions[mode].desc}
              icon={modeDescriptions[mode].icon}
            />
          ))}
        </div>
      </ToolSection>

      {/* Channels */}
      <ToolSection title="Channels" variant="flat">
        <Stack gap="xs">
          {channelOptions.map((channel) => (
            <SwitchToggle
              key={channel}
              checked={cfg.channels.includes(channel)}
              onChange={(on) => onChannelToggle(channel, on)}
              label={toDisplayLabel(channel)}
            />
          ))}
        </Stack>

        <FieldGroup label="Escalation channel">
          <div className="grid grid-cols-5 gap-1.5">
            {channelOptions.map((channel) => (
              <SegmentControl
                key={channel}
                active={cfg.preferredEscalationChannel === channel}
                label={toDisplayLabel(channel)}
                onClick={() => {
                  if (!cfg.channels.includes(channel)) {
                    onError(`Enable ${toDisplayLabel(channel)} first.`);
                    return;
                  }
                  patch({ preferredEscalationChannel: channel });
                }}
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Active send channel">
          <div className="grid grid-cols-5 gap-1.5">
            {channelOptions.map((channel) => (
              <SegmentControl
                key={`send-${channel}`}
                active={context.activeChannel === channel}
                label={toDisplayLabel(channel)}
                onClick={() => updateContext("activeChannel", channel)}
              />
            ))}
          </div>
        </FieldGroup>
      </ToolSection>

      {/* Memory & Session */}
      <ToolSection title="Memory & Session" variant="flat">
        <Stack gap="xs">
          <SwitchToggle
            checked={cfg.rememberCustomerAcrossSessions}
            onChange={(v) => patch({ rememberCustomerAcrossSessions: v })}
            label="Remember customer across sessions"
            description="Preserve customer data when starting a new session"
          />
          <SwitchToggle
            checked={cfg.shareContextAcrossChannels}
            onChange={(v) => patch({ shareContextAcrossChannels: v })}
            label="Share context across channels"
            description="Let all channels see the full conversation history"
          />
        </Stack>
        <ActionButton
          variant="danger"
          label="Start new session"
          icon={RotateCcw}
          onClick={() => clearContext()}
        />
      </ToolSection>
    </div>
  );
}

/* ─── Chat tab ─── */

function AgentChatTab({
  error,
  setError,
}: {
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const context = useAgentContextStore((s) => s.context);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;
    if (context.agentConfig.paused) { setError("Agent is paused."); return; }
    if (!context.agentConfig.channels.includes(context.activeChannel as AgentChannel)) {
      setError(`Active channel "${context.activeChannel}" is disabled.`);
      return;
    }
    setInput("");
    setIsLoading(true);
    setError(null);
    try {
      await runAgentTurn(context.activeChannel, message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 rounded-xl bg-[var(--surface-card)] p-5">
      {/* Context bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag label={toDisplayLabel(context.agentConfig.provider)} variant="accent" />
        <Tag label={toDisplayLabel(context.activeChannel)} />
        <Tag label={toDisplayLabel(context.agentConfig.tone)} />
        <Tag label={`P${context.agentConfig.proactivity}`} />
        {context.agentConfig.modes.map((m) => <Tag key={m} label={m} />)}
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-[var(--surface-subtle)] p-4">
        {context.conversationHistory.length === 0 ? (
          <p className="type-body-sm text-center text-zinc-400 pt-8">No messages yet. Start a conversation below.</p>
        ) : (
          <ul className="layout-stack-sm">
            {context.conversationHistory.map((msg, i) => (
              <li
                key={`${msg.timestamp}_${i}`}
                className={`rounded-xl px-4 py-3 ${
                  msg.role === "assistant"
                    ? "mr-8 border border-emerald-100 bg-white"
                    : msg.role === "user"
                      ? "ml-8 border border-blue-100 bg-blue-50/60"
                      : "border border-zinc-200 bg-zinc-50"
                }`}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <StatusDot
                    variant={msg.role === "assistant" ? "success" : msg.role === "user" ? "info" : "neutral"}
                    size="sm"
                  />
                  <span className="type-caption text-zinc-500">
                    {toDisplayLabel(msg.channel)} · {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="type-body-sm text-zinc-900 leading-relaxed">{msg.content}</p>
              </li>
            ))}
          </ul>
        )}
        {isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-zinc-500">
            <Loader2 size={14} className="animate-spin" />
            <span className="type-caption">Agent is typing...</span>
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form className="flex items-center gap-2" onSubmit={onSubmit}>
        <div className="flex-1">
          <TextInput value={input} onChange={setInput} placeholder="Type a message..." />
        </div>
        <button
          type="submit"
          disabled={
            isLoading ||
            context.agentConfig.paused ||
            !context.agentConfig.channels.includes(context.activeChannel as AgentChannel)
          }
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>

      {error ? <p className="type-caption text-red-600">{error}</p> : null}
    </div>
  );
}

/* ─── Comparison tab ─── */

function AgentComparisonTab({
  error,
  setError,
}: {
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const context = useAgentContextStore((s) => s.context);
  const [comparisonInput, setComparisonInput] = useState("");
  const [comparisonChannel, setComparisonChannel] = useState<AgentChannel>("web");
  const [snapshotDraftName, setSnapshotDraftName] = useState("");
  const [snapshots, setSnapshots] = useState<ConfigSnapshot[]>([]);
  const [comparisonRuns, setComparisonRuns] = useState<ComparisonRun[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const captureSnapshot = () => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setSnapshots((prev) => [
      ...prev,
      {
        id,
        name: snapshotDraftName.trim() || `Variant ${prev.length + 1}`,
        config: { ...context.agentConfig },
        createdAt: new Date().toISOString(),
      },
    ]);
    setSnapshotDraftName("");
  };

  const runComparison = async () => {
    const message = comparisonInput.trim();
    if (!message) { setError("Add a tester prompt first."); return; }
    if (snapshots.length < 2) { setError("Save at least two variants."); return; }
    if (isComparing) return;

    setError(null);
    setIsComparing(true);
    setComparisonRuns([]);
    const ctxSnapshot = useAgentContextStore.getState().context;
    const results: ComparisonRun[] = [];

    try {
      for (const snap of snapshots) {
        if (!snap.config.channels.includes(comparisonChannel)) {
          results.push({
            snapshotId: snap.id, snapshotName: snap.name, output: "",
            error: `${toDisplayLabel(comparisonChannel)} disabled in this variant.`,
            charCount: 0, wordCount: 0, channel: comparisonChannel,
            timestamp: new Date().toISOString(),
          });
          setComparisonRuns([...results]);
          continue;
        }
        const scoped = snap.config.shareContextAcrossChannels
          ? ctxSnapshot.conversationHistory
          : ctxSnapshot.conversationHistory.filter((e) => e.channel === comparisonChannel);

        const res = await fetch("/api/agent/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: { ...ctxSnapshot, activeChannel: comparisonChannel, agentConfig: snap.config, conversationHistory: scoped },
            channel: comparisonChannel,
          }),
        });
        const data = (await res.json()) as { assistantReply?: string; error?: string };
        const output = data.assistantReply?.trim() ?? "";
        results.push({
          snapshotId: snap.id, snapshotName: snap.name, output,
          error: !res.ok ? data.error ?? "Call failed." : null,
          charCount: output.length,
          wordCount: output ? output.split(/\s+/).filter(Boolean).length : 0,
          channel: comparisonChannel, timestamp: new Date().toISOString(),
        });
        setComparisonRuns([...results]);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const ready = comparisonInput.trim().length > 0 && snapshots.length >= 2 && !isComparing;

  return (
    <div className="layout-stack-md h-full overflow-auto rounded-xl bg-[var(--surface-card)] p-5">
      {/* Step 1 */}
      <ToolSection title="1. Test setup" variant="card" description="Same prompt for every variant so differences come from config only">
        <FieldGroup label="Prompt">
          <TextInput
            value={comparisonInput}
            onChange={setComparisonInput}
            placeholder="e.g. Customer asks for delayed order update and refund options."
          />
        </FieldGroup>
        <FieldGroup label="Channel">
          <div className="grid grid-cols-5 gap-1.5">
            {channelOptions.map((ch) => (
              <SegmentControl
                key={`cmp-${ch}`}
                active={comparisonChannel === ch}
                label={toDisplayLabel(ch)}
                onClick={() => setComparisonChannel(ch)}
              />
            ))}
          </div>
        </FieldGroup>
      </ToolSection>

      {/* Step 2 */}
      <ToolSection title="2. Saved variants" variant="card" description="Adjust controls, then save each config variant here">
        <Inline className="items-end">
          <div className="min-w-48 flex-1">
            <FieldGroup label="Variant name">
              <TextInput value={snapshotDraftName} onChange={setSnapshotDraftName} placeholder="e.g. Direct P2" />
            </FieldGroup>
          </div>
          <ActionButton variant="secondary" label="Save current config" onClick={captureSnapshot} />
        </Inline>

        {snapshots.length === 0 ? (
          <p className="type-caption text-zinc-400">No variants saved yet.</p>
        ) : (
          <Stack gap="sm">
            {snapshots.map((snap) => (
              <div key={snap.id} className="flex items-center gap-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <input
                    className="type-body-sm w-full bg-transparent font-medium text-zinc-800 outline-none"
                    value={snap.name}
                    onChange={(e) =>
                      setSnapshots((prev) =>
                        prev.map((s) => (s.id === snap.id ? { ...s, name: e.target.value } : s)),
                      )
                    }
                  />
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <Tag label={toDisplayLabel(snap.config.tone)} />
                    <Tag label={toDisplayLabel(snap.config.verbosity)} />
                    <Tag label={`P${snap.config.proactivity}`} />
                    <Tag label={`T${snap.config.temperature.toFixed(1)}`} />
                  </div>
                </div>
                <ActionButton variant="secondary" label="Load" onClick={() => updateContext("agentConfig", snap.config)} />
                <ActionButton
                  variant="ghost"
                  label="Delete"
                  onClick={() => {
                    setSnapshots((prev) => prev.filter((s) => s.id !== snap.id));
                    setComparisonRuns((prev) => prev.filter((r) => r.snapshotId !== snap.id));
                  }}
                />
              </div>
            ))}
          </Stack>
        )}
      </ToolSection>

      {/* Step 3 */}
      <ToolSection title="3. Run comparison" variant="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusDot variant={comparisonInput.trim() ? "success" : "warning"} label="Prompt" />
            <StatusDot variant={snapshots.length >= 2 ? "success" : "warning"} label={`${snapshots.length} variants`} />
          </div>
          <ActionButton
            label={isComparing ? "Running..." : "Run comparison"}
            icon={Play}
            onClick={runComparison}
            disabled={!ready}
          />
        </div>

        {comparisonRuns.length > 0 ? (
          <Stack gap="sm">
            {comparisonRuns.map((run) => (
              <article key={`${run.snapshotId}_${run.timestamp}`} className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-subtle)] p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="type-label text-zinc-700">{run.snapshotName}</span>
                  <span className="type-caption text-zinc-500">
                    {toDisplayLabel(run.channel)} · {run.wordCount}w · {run.charCount}c
                  </span>
                </div>
                {run.error ? (
                  <p className="type-body-sm text-red-600">{run.error}</p>
                ) : (
                  <p className="type-body-sm leading-relaxed text-zinc-800">{run.output}</p>
                )}
              </article>
            ))}
          </Stack>
        ) : null}
      </ToolSection>

      {error ? <p className="type-caption text-red-600">{error}</p> : null}
    </div>
  );
}

/* ─── Main component ─── */

export function AgentControlCenterWindow() {
  const [activeTab, setActiveTab] = useState<AgentCenterTab>("controls");
  const [error, setError] = useState<string | null>(null);

  return (
    <ToolAppSurface>
      <div className="flex h-full flex-col gap-3">
        <AgentStatusBar />
        <TabBar tabs={tabDefs} active={activeTab} onChange={setActiveTab} />

        <div className="min-h-0 flex-1">
          {activeTab === "controls" ? <AgentControlsTab onError={setError} /> : null}
          {activeTab === "chat" ? <AgentChatTab error={error} setError={setError} /> : null}
          {activeTab === "comparison" ? <AgentComparisonTab error={error} setError={setError} /> : null}
        </div>

        {activeTab === "controls" && error ? (
          <p className="type-caption px-1 text-red-600">{error}</p>
        ) : null}
      </div>
    </ToolAppSurface>
  );
}
