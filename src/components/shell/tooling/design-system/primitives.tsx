"use client";

import { type ReactNode, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, X, ChevronDown } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type BadgeVariant = "neutral" | "success" | "warning" | "danger";
type SectionVariant = "card" | "flat" | "divided";
type StackGap = "xs" | "sm" | "md" | "lg" | "xl";
export type StatusDotVariant = "success" | "warning" | "danger" | "neutral" | "info";

function stackClass(gap: StackGap) {
  if (gap === "xs") return "layout-stack-xs";
  if (gap === "sm") return "layout-stack-sm";
  if (gap === "md") return "layout-stack-md";
  if (gap === "lg") return "layout-stack-lg";
  return "layout-stack-xl";
}

export function toDisplayLabel(value: string) {
  const fullMatchMap: Record<string, string> = {
    openai: "OpenAI",
    huggingface: "HuggingFace",
    ivr: "IVR",
    api: "API",
    crm: "CRM",
  };
  const normalizedValue = value.trim().toLowerCase();
  if (fullMatchMap[normalizedValue]) {
    return fullMatchMap[normalizedValue];
  }

  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ");
  return normalized
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (fullMatchMap[lower]) return fullMatchMap[lower];
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/* ─── Layout surfaces ─── */

export function ToolAppSurface({ children }: { children: ReactNode }) {
  return <section className="layout-surface h-full overflow-auto bg-[var(--surface-canvas)]">{children}</section>;
}

export function ToolSection({
  title,
  description,
  children,
  headerRight,
  variant = "card",
  gap = "md",
  className = "",
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  headerRight?: ReactNode;
  variant?: SectionVariant;
  gap?: StackGap;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantClass =
    variant === "flat"
      ? "layout-pad-none bg-transparent border-none shadow-none"
      : variant === "divided"
        ? "bg-transparent border-none px-0 pt-0 pb-[var(--layout-gap-xl)] shadow-none layout-divider"
        : "rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] layout-section shadow-sm";

  const header = (
    <div
      className={`flex items-center justify-between gap-[var(--layout-gap-md)] ${collapsible ? "cursor-pointer select-none" : ""}`}
      onClick={collapsible ? () => setIsOpen((o) => !o) : undefined}
    >
      <div className="flex items-center gap-[var(--layout-gap-sm)]">
        <div>
          <h3 className="type-label text-zinc-600">{title}</h3>
          {description ? <p className="type-caption mt-[var(--layout-gap-xs)] text-zinc-500">{description}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-[var(--layout-gap-sm)]">
        {headerRight ? <div onClick={(e) => e.stopPropagation()}>{headerRight}</div> : null}
        {collapsible ? (
          <ChevronDown
            size={14}
            className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        ) : null}
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <section className={`${variantClass} ${className}`}>
        {header}
        <div className="accordion-content" data-open={isOpen}>
          <div className={`accordion-inner ${stackClass(gap)}`}>
            <div className="pt-[var(--layout-gap-md)]">{children}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${stackClass(gap)} ${variantClass} ${className}`}>
      {header}
      {children}
    </section>
  );
}

/* ─── Typography ─── */

export function FieldLabel({ label }: { label: string }) {
  return <p className="type-label text-zinc-600">{label}</p>;
}

export function FieldGroup({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="layout-field block">
      <FieldLabel label={label} />
      {children}
      {hint ? <p className="type-caption text-zinc-500">{hint}</p> : null}
    </label>
  );
}

export function Stack({
  children,
  gap = "md",
  className = "",
}: {
  children: ReactNode;
  gap?: StackGap;
  className?: string;
}) {
  return <div className={`${stackClass(gap)} ${className}`}>{children}</div>;
}

export function Inline({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-wrap items-center gap-[var(--layout-gap-sm)] ${className}`}>{children}</div>;
}

export function TypeDisplay({ children }: { children: ReactNode }) {
  return <h2 className="type-display text-zinc-900">{children}</h2>;
}

export function TypeTitle({ children }: { children: ReactNode }) {
  return <h3 className="type-title text-zinc-800">{children}</h3>;
}

export function TypeSubtitle({ children }: { children: ReactNode }) {
  return <h4 className="type-subtitle text-zinc-700">{children}</h4>;
}

export function TypeBody({ children }: { children: ReactNode }) {
  return <p className="type-body text-zinc-700">{children}</p>;
}

export function TypeCaption({ children }: { children: ReactNode }) {
  return <p className="type-caption text-zinc-500">{children}</p>;
}

/* ─── Controls ─── */

export function PillToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`type-caption rounded-full border px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] font-medium transition ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-[var(--surface-border)] bg-[var(--surface-card)] text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

export function SegmentControl({
  active,
  label,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`type-caption flex items-center justify-center gap-1.5 rounded-lg border px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] font-medium transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-[var(--surface-border)] bg-[var(--surface-card)] text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100"
      }`}
    >
      {Icon ? <Icon size={13} /> : null}
      {label}
    </button>
  );
}

export function ActionButton({
  variant = "primary",
  label,
  onClick,
  disabled,
  icon: Icon,
  className: extraClass = "",
}: {
  variant?: ButtonVariant;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-zinc-900 text-white hover:bg-zinc-800"
      : variant === "secondary"
        ? "border border-[var(--surface-border)] bg-[var(--surface-card)] text-zinc-700 hover:bg-zinc-100"
        : variant === "danger"
          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
          : "bg-transparent text-zinc-600 hover:bg-zinc-100";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`type-caption flex items-center justify-center gap-1.5 rounded-lg px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${extraClass}`}
    >
      {Icon ? <Icon size={13} /> : null}
      {label}
    </button>
  );
}

/* ─── SwitchToggle ─── */

export function SwitchToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onChange(!checked);
    }
  };

  if (!label) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="inline-flex items-center"
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        onKeyDown={handleKeyDown}
      >
        <span className="switch-track" data-checked={checked}>
          <span className="switch-thumb" />
        </span>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-[var(--surface-subtle)]"
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      onKeyDown={handleKeyDown}
    >
      <div className="min-w-0 flex-1">
        <p className="type-body-sm text-zinc-800">{label}</p>
        {description ? <p className="type-caption text-zinc-500">{description}</p> : null}
      </div>
      <span className="switch-track" data-checked={checked}>
        <span className="switch-thumb" />
      </span>
    </div>
  );
}

/* ─── TabBar ─── */

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: LucideIcon }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="tab-bar-item"
          data-active={active === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon ? <tab.icon size={14} /> : null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Accordion ─── */

export function Accordion({
  title,
  children,
  defaultOpen = false,
  headerRight,
  className = "",
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerRight?: ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-xl border border-[var(--surface-border)] bg-[var(--surface-subtle)] ${className}`}>
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center justify-between px-[var(--layout-section-pad)] py-3 text-left"
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
      >
        <span className="type-label text-zinc-600">{title}</span>
        <div className="flex items-center gap-2">
          {headerRight ? <span onClick={(e) => e.stopPropagation()}>{headerRight}</span> : null}
          <ChevronDown
            size={14}
            className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      <div className="accordion-content" data-open={isOpen}>
        <div className="accordion-inner">
          <div className="px-[var(--layout-section-pad)] pb-[var(--layout-section-pad)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tag (removable chip) ─── */

export function Tag({
  label,
  onRemove,
  variant = "neutral",
}: {
  label: string;
  onRemove?: () => void;
  variant?: "neutral" | "accent";
}) {
  return (
    <span
      className={`type-caption inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${
        variant === "accent"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
      }`}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center justify-center rounded-full p-0.5 transition hover:bg-zinc-200/60"
        >
          <X size={11} />
        </button>
      ) : null}
    </span>
  );
}

/* ─── StatusDot ─── */

export function StatusDot({
  variant = "neutral",
  pulse = false,
  label,
  size = "md",
}: {
  variant?: StatusDotVariant;
  pulse?: boolean;
  label?: string;
  size?: "sm" | "md";
}) {
  const colorMap: Record<StatusDotVariant, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    neutral: "bg-zinc-400",
    info: "bg-blue-500",
  };
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block rounded-full ${dotSize} ${colorMap[variant]} ${pulse ? "status-dot-pulse" : ""}`}
      />
      {label ? <span className="type-caption text-zinc-600">{label}</span> : null}
    </span>
  );
}

/* ─── SliderField ─── */

export function SliderField({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  valueLabel,
  colorize = false,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  valueLabel?: string;
  colorize?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const trackBg = colorize
    ? `linear-gradient(to right, #22c55e ${0}%, #eab308 ${50}%, #ef4444 ${100}%)`
    : `linear-gradient(to right, #18181b ${pct}%, #e4e4e7 ${pct}%)`;

  return (
    <div className="slider-field">
      {(label || valueLabel) ? (
        <div className="mb-1.5 flex items-baseline justify-between">
          {label ? <span className="type-label text-zinc-600">{label}</span> : null}
          {valueLabel ? <span className="type-caption font-medium tabular-nums text-zinc-800">{valueLabel}</span> : null}
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: trackBg }}
      />
    </div>
  );
}

/* ─── OptionCard ─── */

export function OptionCard({
  selected,
  onClick,
  title,
  description,
  icon,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: string | ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition hover:-translate-y-0.5 ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
          : "border-[var(--surface-border)] bg-[var(--surface-card)] text-zinc-800 hover:border-zinc-400 hover:shadow-sm"
      } ${className}`}
    >
      {icon ? (
        <span className={`mb-0.5 text-base leading-none ${selected ? "opacity-90" : ""}`}>
          {typeof icon === "string" ? icon : icon}
        </span>
      ) : null}
      <span className="type-label">{title}</span>
      {description ? (
        <span className={`type-caption ${selected ? "text-zinc-300" : "text-zinc-500"}`}>
          {description}
        </span>
      ) : null}
    </button>
  );
}

/* ─── SettingRow ─── */

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <p className="type-body-sm text-zinc-800">{label}</p>
        {description ? <p className="type-caption text-zinc-500">{description}</p> : null}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ─── Inputs ─── */

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password" | "number";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="type-body-sm w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500"
    />
  );
}

export function TextAreaInput({
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`type-body-sm w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 ${mono ? "font-mono text-[12px] leading-relaxed" : ""}`}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="type-body-sm w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-zinc-900"
    />
  );
}

/* ─── Badges ─── */

export function StatusBadge({ label, variant = "neutral" }: { label: string; variant?: BadgeVariant }) {
  const styles =
    variant === "success"
      ? "bg-emerald-100 text-emerald-700"
      : variant === "warning"
        ? "bg-amber-100 text-amber-700"
        : variant === "danger"
          ? "bg-red-100 text-red-700"
          : "bg-zinc-200 text-zinc-700";

  return (
    <span
      className={`type-caption rounded-full px-[var(--layout-control-pad-x)] py-[var(--layout-control-pad-y)] font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

/* ─── PhoneFrame ─── */

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [clock] = useState(() =>
    new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
  );

  return (
    <div className={`flex h-full items-center justify-center bg-zinc-100 p-3 ${className}`}>
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="phone-status-bar text-zinc-900">
            <span className="phone-status-time">{clock}</span>
            <div className="phone-status-icons">
              <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
                <rect x="0" y="7" width="3" height="4" rx="0.75" fill="currentColor" />
                <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.75" fill="currentColor" />
                <rect x="9" y="2" width="3" height="9" rx="0.75" fill="currentColor" />
                <rect x="13" y="0" width="3" height="11" rx="0.75" fill="currentColor" opacity="0.35" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden>
                <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="2" width="12" height="7" rx="1" fill="currentColor" />
                <path d="M20 3.5C21 4 21 7 20 7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="phone-content">{children}</div>
          <div className="phone-home-indicator">
            <div className="phone-home-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── HandoffBanner ─── */

const channelDisplayNames: Record<string, string> = {
  web: "Web Browser",
  ivr: "IVR Phone",
  whatsapp: "WhatsApp",
  kiosk: "Kiosk",
  email: "Email",
};

export function HandoffBanner({
  fromChannel,
  summary,
  timestamp,
  className = "",
}: {
  fromChannel: string;
  summary?: string;
  timestamp?: string;
  className?: string;
}) {
  const fromLabel = channelDisplayNames[fromChannel] ?? toDisplayLabel(fromChannel);
  const formattedTime = timestamp
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp))
    : null;

  return (
    <div className={`handoff-banner ${className}`}>
      <div className="handoff-banner-icon">
        <ArrowDownRight size={12} />
      </div>
      <div className="handoff-banner-body">
        <span className="handoff-banner-text">
          From {fromLabel}
          {summary ? ` · ${summary.replace(/^channel_switch:\s*/i, "")}` : ""}
        </span>
        {formattedTime ? (
          <span className="handoff-banner-time">{formattedTime}</span>
        ) : null}
      </div>
    </div>
  );
}
