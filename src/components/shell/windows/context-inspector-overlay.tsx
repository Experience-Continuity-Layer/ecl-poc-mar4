"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  Activity,
  User,
  Zap,
  MessageSquare,
  ArrowRightLeft,
  Clock,
  ChevronDown,
  Sparkles,
  Target,
  AlertTriangle,
  Heart,
  HelpCircle,
  TrendingUp,
  ShoppingCart,
  RotateCcw,
  Search,
  Shield,
  Eye,
} from "lucide-react";
import { getRecentChannelHandoffs, useAgentContextStore } from "@/core/agent-context/store";
import type { BehavioralSignal, ExtractionRecord, SignalType } from "@/core/agent-context/types";

type InspectorTab = "live" | "signals" | "profile" | "timeline";

const signalMeta: Record<
  SignalType,
  { icon: typeof Brain; color: string; bg: string; label: string }
> = {
  frustration: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Frustration" },
  urgency: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Urgency" },
  satisfaction: { icon: Heart, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Satisfaction" },
  confusion: { icon: HelpCircle, color: "text-violet-600", bg: "bg-violet-50 border-violet-200", label: "Confusion" },
  escalation_hint: { icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Escalation" },
  product_interest: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Interest" },
  churn_risk: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-50 border-red-300", label: "Churn Risk" },
  loyalty_signal: { icon: Shield, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", label: "Loyalty" },
  comparison_shopping: { icon: Search, color: "text-sky-600", bg: "bg-sky-50 border-sky-200", label: "Comparing" },
  repeat_issue: { icon: RotateCcw, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", label: "Repeat Issue" },
  action_detected: { icon: Target, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200", label: "Action" },
  channel_switch: { icon: ArrowRightLeft, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200", label: "Channel Switch" },
  info_revealed: { icon: Eye, color: "text-teal-600", bg: "bg-teal-50 border-teal-200", label: "Info Revealed" },
};

function getSignalMeta(eventType: string) {
  return signalMeta[eventType as SignalType] ?? {
    icon: Activity,
    color: "text-zinc-600",
    bg: "bg-zinc-50 border-zinc-200",
    label: eventType,
  };
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-zinc-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Brain;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-100 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition hover:bg-zinc-50"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon size={14} className="text-zinc-400" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </span>
        {count != null && count > 0 && (
          <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {count}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function SignalChip({ signal }: { signal: BehavioralSignal }) {
  const meta = getSignalMeta(signal.eventType);
  const Icon = meta.icon;
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-2.5 ${meta.bg}`}>
      <Icon size={14} className={`mt-0.5 flex-shrink-0 ${meta.color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
          <ConfidenceBar value={signal.confidence} />
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-700">{signal.detail}</p>
        <span className="mt-1 block text-[10px] text-zinc-400">
          {signal.channel} · {new Date(signal.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Brain; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
        <Icon size={14} className="text-zinc-400" />
      </div>
      <p className="text-[11px] text-zinc-400">{message}</p>
    </div>
  );
}

/* ── Tab: Live Context ── */

function LiveContextTab() {
  const context = useAgentContextStore((s) => s.context);
  const latestExtraction = context.extractionHistory.at(-1);
  const recentHandoffs = getRecentChannelHandoffs(5);

  return (
    <div className="divide-y divide-zinc-100">
      {/* Recent channel switches */}
      {recentHandoffs.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft size={14} className="text-cyan-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Recent channel switches
            </span>
          </div>
          <div className="space-y-1.5">
            {recentHandoffs.map((h, i) => (
              <div key={`${h.timestamp}_${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 px-3 py-2">
                <span className="text-[11px] font-medium text-cyan-800">
                  {h.from} → {h.to}
                </span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[140px]" title={h.summary}>
                  {h.summary}
                </span>
                <span className="text-[10px] text-zinc-400 flex-shrink-0">
                  {new Date(h.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Summary */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Agent Understanding
          </span>
        </div>
        {context.contextSummary ? (
          <p className="rounded-lg bg-amber-50/80 border border-amber-100 p-3 text-[12px] leading-relaxed text-zinc-800">
            {context.contextSummary}
          </p>
        ) : (
          <p className="rounded-lg bg-zinc-50 p-3 text-[12px] text-zinc-400 italic">
            No context accumulated yet. Start a conversation and the agent will build understanding turn by turn.
          </p>
        )}
      </div>

      {/* Current Intent + Emotion */}
      <div className="grid grid-cols-2 gap-px bg-zinc-100">
        <div className="bg-white p-3">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Intent
          </span>
          <span className={`mt-1 block text-[12px] font-medium ${context.customer.intent ? "text-zinc-900" : "text-zinc-300"}`}>
            {context.customer.intent ?? "Detecting..."}
          </span>
        </div>
        <div className="bg-white p-3">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Emotion
          </span>
          <span className={`mt-1 block text-[12px] font-medium ${context.customer.emotionalState ? "text-zinc-900" : "text-zinc-300"}`}>
            {context.customer.emotionalState ?? "Detecting..."}
          </span>
        </div>
      </div>

      {/* Topics */}
      <CollapsibleSection title="Topics" icon={MessageSquare} count={context.topics.length}>
        {context.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {context.topics.map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquare} message="Topics will appear as the conversation develops" />
        )}
      </CollapsibleSection>

      {/* Recent Signals */}
      <CollapsibleSection title="Recent Signals" icon={Activity} count={context.signals.length}>
        {context.signals.length > 0 ? (
          <div className="space-y-2">
            {context.signals.slice(-5).reverse().map((sig, i) => (
              <SignalChip key={`${sig.timestamp}_${i}`} signal={sig} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Activity} message="No behavioral signals detected yet" />
        )}
      </CollapsibleSection>

      {/* Pending Actions */}
      <CollapsibleSection title="Pending Actions" icon={Target} count={context.pendingActions.length}>
        {context.pendingActions.length > 0 ? (
          <div className="space-y-2">
            {context.pendingActions.slice(-5).reverse().map((action, i) => (
              <div
                key={`${action.timestamp}_${i}`}
                className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2.5"
              >
                <Zap size={14} className="mt-0.5 flex-shrink-0 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-indigo-700">{action.action}</span>
                  <p className="mt-0.5 text-[11px] text-zinc-700">{action.detail}</p>
                  <span className="mt-1 block text-[10px] text-zinc-400">
                    {action.channel} · {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Target} message="No pending actions" />
        )}
      </CollapsibleSection>

      {/* Extraction Turn Count */}
      {latestExtraction && (
        <div className="px-4 py-2 text-center">
          <span className="text-[10px] text-zinc-400">
            Context extracted from {context.extractionHistory.length} turn{context.extractionHistory.length !== 1 ? "s" : ""}
            {" · "}Last: {new Date(latestExtraction.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Signals ── */

function SignalsTab() {
  const signals = useAgentContextStore((s) => s.context.signals);
  const reversed = useMemo(() => [...signals].reverse(), [signals]);

  if (reversed.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={Activity} message="Signals will appear here as the agent detects behavioral patterns during conversation" />
      </div>
    );
  }

  const grouped = useMemo(() => {
    const map = new Map<string, BehavioralSignal[]>();
    for (const sig of reversed) {
      const arr = map.get(sig.eventType) ?? [];
      arr.push(sig);
      map.set(sig.eventType, arr);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [reversed]);

  return (
    <div className="divide-y divide-zinc-100">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {grouped.map(([type, sigs]) => {
          const meta = getSignalMeta(type);
          const Icon = meta.icon;
          return (
            <span key={type} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${meta.bg}`}>
              <Icon size={10} className={meta.color} />
              <span className={`text-[10px] font-medium ${meta.color}`}>{sigs.length}</span>
            </span>
          );
        })}
      </div>

      {/* Full list */}
      <div className="space-y-2 p-4">
        {reversed.map((sig, i) => (
          <SignalChip key={`${sig.timestamp}_${i}`} signal={sig} />
        ))}
      </div>
    </div>
  );
}

/* ── Tab: Profile ── */

function ProfileRow({
  label,
  value,
  inferred,
}: {
  label: string;
  value: string | null;
  inferred?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] text-zinc-500 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {inferred && value && (
          <Sparkles size={10} className="flex-shrink-0 text-amber-500" />
        )}
        <span
          className={`text-[12px] text-right truncate ${
            value ? "font-medium text-zinc-900" : "text-zinc-300 italic"
          }`}
        >
          {value ?? "unknown"}
        </span>
      </div>
    </div>
  );
}

function ProfileTab() {
  const context = useAgentContextStore((s) => s.context);
  const { customer } = context;

  const hasExtractions = context.extractionHistory.length > 0;
  const inferredFields = useMemo(() => {
    const fields = new Set<string>();
    for (const record of context.extractionHistory) {
      if (record.extracted.inferredName) fields.add("name");
      if (record.extracted.inferredLanguage) fields.add("language");
      if (record.extracted.inferredIntent) fields.add("intent");
      if (record.extracted.inferredEmotionalState) fields.add("emotionalState");
    }
    return fields;
  }, [context.extractionHistory]);

  return (
    <div className="divide-y divide-zinc-100">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={14} className="text-zinc-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Customer Profile
          </span>
          {hasExtractions && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5">
              <Sparkles size={10} className="text-amber-500" />
              <span className="text-[10px] text-amber-700 font-medium">AI-enriched</span>
            </span>
          )}
        </div>
        <div className="divide-y divide-zinc-50">
          <ProfileRow label="Name" value={customer.name} inferred={inferredFields.has("name")} />
          <ProfileRow label="Age" value={customer.age != null ? String(customer.age) : null} />
          <ProfileRow label="Language" value={customer.language} inferred={inferredFields.has("language")} />
          <ProfileRow label="Preferred channel" value={customer.preferredChannel} />
          <ProfileRow label="Tier" value={customer.tier} />
          <ProfileRow label="Phone" value={customer.phoneNumber ?? null} />
          <ProfileRow label="Device" value={customer.device} />
          <ProfileRow label="Intent" value={customer.intent} inferred={inferredFields.has("intent")} />
          <ProfileRow label="Emotional state" value={customer.emotionalState} inferred={inferredFields.has("emotionalState")} />
        </div>
      </div>

      <CollapsibleSection title="Categories & Products" icon={ShoppingCart} count={customer.categories.length}>
        {customer.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {customer.categories.map((cat) => (
              <span key={cat} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                {cat}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 italic">None detected</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Purchases" icon={ShoppingCart} count={customer.purchases.length}>
        {customer.purchases.length > 0 ? (
          <ul className="space-y-1">
            {customer.purchases.map((p) => (
              <li key={p} className="text-[11px] text-zinc-700">{p}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-400 italic">None recorded</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Known Issues" icon={AlertTriangle} count={customer.issues.length}>
        {customer.issues.length > 0 ? (
          <ul className="space-y-1">
            {customer.issues.map((issue) => (
              <li key={issue} className="text-[11px] text-zinc-700">{issue}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-zinc-400 italic">None recorded</p>
        )}
      </CollapsibleSection>

      {/* Channel history */}
      <CollapsibleSection title="Channel History" icon={ArrowRightLeft} count={context.channelHistory.length}>
        {context.channelHistory.length > 0 ? (
          <div className="space-y-2">
            {context.channelHistory.slice(-5).reverse().map((h, i) => (
              <div key={`${h.timestamp}_${i}`} className="flex items-start gap-2 rounded-lg border border-cyan-200 bg-cyan-50 p-2.5">
                <ArrowRightLeft size={12} className="mt-0.5 flex-shrink-0 text-cyan-600" />
                <div>
                  <span className="text-[11px] font-semibold text-cyan-700">
                    {h.from} → {h.to}
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-700">{h.summary}</p>
                  <span className="mt-1 block text-[10px] text-zinc-400">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ArrowRightLeft} message="No channel handoffs yet" />
        )}
      </CollapsibleSection>
    </div>
  );
}

/* ── Tab: Timeline ── */

function TimelineTab() {
  const extractionHistory = useAgentContextStore((s) => s.context.extractionHistory);
  const reversed = useMemo(() => [...extractionHistory].reverse(), [extractionHistory]);

  if (reversed.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={Clock} message="The extraction timeline will show how the agent's understanding evolves turn by turn" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative space-y-4 pl-6">
        {/* vertical line */}
        <div className="absolute left-[9px] top-1 bottom-1 w-px bg-zinc-200" />

        {reversed.map((record, i) => (
          <TimelineEntry key={`${record.timestamp}_${i}`} record={record} index={reversed.length - i} />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ record, index }: { record: ExtractionRecord; index: number }) {
  const [expanded, setExpanded] = useState(index === 1);
  const { extracted } = record;

  return (
    <div className="relative">
      {/* dot */}
      <div className="absolute -left-6 top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-zinc-900">
        <span className="text-[8px] font-bold text-white">{record.turnIndex}</span>
      </div>

      <button
        type="button"
        className="w-full text-left rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:shadow-sm"
        onClick={() => setExpanded((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-medium uppercase text-zinc-500">{record.channel}</span>
            <span className="text-[10px] text-zinc-400">
              {new Date(record.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {extracted.signals.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600">
                {extracted.signals.length} signal{extracted.signals.length !== 1 ? "s" : ""}
              </span>
            )}
            <ChevronDown
              size={12}
              className={`text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Summary always visible */}
        {extracted.contextSummary && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-700 line-clamp-2">
            {extracted.contextSummary}
          </p>
        )}
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 space-y-3">
          {extracted.inferredIntent && (
            <div>
              <span className="text-[10px] font-medium uppercase text-zinc-400">Intent</span>
              <p className="text-[11px] font-medium text-zinc-800">{extracted.inferredIntent}</p>
            </div>
          )}
          {extracted.inferredEmotionalState && (
            <div>
              <span className="text-[10px] font-medium uppercase text-zinc-400">Emotion</span>
              <p className="text-[11px] font-medium text-zinc-800">{extracted.inferredEmotionalState}</p>
            </div>
          )}
          {extracted.topics.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase text-zinc-400">Topics</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {extracted.topics.map((t) => (
                  <span key={t} className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {extracted.signals.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase text-zinc-400">Signals</span>
              <div className="mt-1 space-y-1.5">
                {extracted.signals.map((sig, si) => {
                  const meta = getSignalMeta(sig.type);
                  const Icon = meta.icon;
                  return (
                    <div key={`${sig.type}_${si}`} className="flex items-center gap-2">
                      <Icon size={11} className={meta.color} />
                      <span className="text-[11px] text-zinc-700 flex-1">{sig.detail}</span>
                      <ConfidenceBar value={sig.confidence} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {extracted.actions.length > 0 && (
            <div>
              <span className="text-[10px] font-medium uppercase text-zinc-400">Actions Detected</span>
              <div className="mt-1 space-y-1">
                {extracted.actions.map((a, ai) => (
                  <div key={`${a.action}_${ai}`} className="flex items-center gap-2">
                    <Target size={11} className="text-indigo-600" />
                    <span className="text-[11px] font-medium text-indigo-700">{a.action}</span>
                    <span className="text-[11px] text-zinc-600">— {a.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main ── */

const tabs: { id: InspectorTab; label: string; icon: typeof Brain }[] = [
  { id: "live", label: "Live", icon: Brain },
  { id: "signals", label: "Signals", icon: Activity },
  { id: "profile", label: "Profile", icon: User },
  { id: "timeline", label: "Timeline", icon: Clock },
];

export function ContextInspectorWindow() {
  const [activeTab, setActiveTab] = useState<InspectorTab>("live");
  const signalCount = useAgentContextStore((s) => s.context.signals.length);
  const turnCount = useAgentContextStore((s) => s.context.extractionHistory.length);

  return (
    <section className="flex h-full flex-col bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-zinc-500" />
          <span className="text-[12px] font-semibold text-zinc-700">Context Inspector</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400">
            {turnCount} turn{turnCount !== 1 ? "s" : ""} · {signalCount} signal{signalCount !== 1 ? "s" : ""}
          </span>
          {turnCount > 0 && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-zinc-900 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === "live" && <LiveContextTab />}
        {activeTab === "signals" && <SignalsTab />}
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "timeline" && <TimelineTab />}
      </div>
    </section>
  );
}
