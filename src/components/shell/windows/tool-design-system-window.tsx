"use client";

import { useState } from "react";
import { Settings, Zap, Eye, Target } from "lucide-react";
import {
  Accordion,
  ActionButton,
  FieldGroup,
  FieldLabel,
  HandoffBanner,
  Inline,
  OptionCard,
  PillToggle,
  SegmentControl,
  SelectInput,
  SettingRow,
  SliderField,
  Stack,
  StatusBadge,
  StatusDot,
  SwitchToggle,
  TabBar,
  Tag,
  TextAreaInput,
  TextInput,
  ToolAppSurface,
  ToolSection,
  TypeBody,
  TypeCaption,
  TypeDisplay,
  TypeSubtitle,
  TypeTitle,
} from "../tooling/design-system/primitives";

type DemoTab = "foundations" | "controls" | "patterns";

const demoPillOptions = ["Alpha", "Beta", "Gamma"];

export function ToolDesignSystemWindow() {
  const [activeTab, setActiveTab] = useState<DemoTab>("foundations");

  return (
    <ToolAppSurface>
      <Stack gap="md">
        <div>
          <h2 className="type-title text-zinc-900">Design System</h2>
          <p className="type-caption mt-1 text-zinc-500">
            Living reference of every shared primitive, variant, and token used across tool windows.
          </p>
        </div>

        <TabBar
          tabs={[
            { id: "foundations" as DemoTab, label: "Foundations" },
            { id: "controls" as DemoTab, label: "Controls" },
            { id: "patterns" as DemoTab, label: "Patterns" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "foundations" ? <FoundationsTab /> : null}
        {activeTab === "controls" ? <ControlsTab /> : null}
        {activeTab === "patterns" ? <PatternsTab /> : null}
      </Stack>
    </ToolAppSurface>
  );
}

/* ─── Foundations tab ─── */

function FoundationsTab() {
  return (
    <Stack gap="lg">
      <ToolSection title="Typography" description="Shared text hierarchy across all tool windows">
        <Stack gap="sm">
          <TypeDisplay>Display</TypeDisplay>
          <TypeTitle>Title</TypeTitle>
          <TypeSubtitle>Subtitle</TypeSubtitle>
          <TypeBody>Body text for descriptions and helper content with clear readability.</TypeBody>
          <TypeCaption>Caption for metadata, hints, and secondary information.</TypeCaption>
        </Stack>
      </ToolSection>

      <ToolSection title="Layout tokens" description="Semantic spacing variables for consistent rhythm">
        <div className="grid gap-5 md:grid-cols-2">
          <Stack gap="xs">
            <FieldLabel label="Gap scale" />
            {["xs (6px)", "sm (10px)", "md (14px)", "lg (20px)", "xl (28px)"].map((t) => (
              <TypeCaption key={t}>--layout-gap-{t}</TypeCaption>
            ))}
          </Stack>
          <Stack gap="xs">
            <FieldLabel label="Padding & dividers" />
            {["surface-pad (24px)", "section-pad (16px)", "control-pad-x (12px)", "control-pad-y (7px)", "divider-color / divider-width"].map((t) => (
              <TypeCaption key={t}>--layout-{t}</TypeCaption>
            ))}
          </Stack>
        </div>
      </ToolSection>

      <ToolSection title="Surface colors" description="Layered background system for depth">
        <div className="grid grid-cols-5 gap-2">
          {[
            { name: "Canvas", var: "--surface-canvas", hex: "#f4f4f5" },
            { name: "Panel", var: "--surface-panel", hex: "#f8fafc" },
            { name: "Card", var: "--surface-card", hex: "#ffffff" },
            { name: "Subtle", var: "--surface-subtle", hex: "#f1f5f9" },
            { name: "Border", var: "--surface-border", hex: "#d4d4d8" },
          ].map((s) => (
            <div key={s.var} className="text-center">
              <div
                className="mx-auto mb-1.5 h-10 w-full rounded-lg border border-zinc-200"
                style={{ backgroundColor: s.hex }}
              />
              <p className="type-caption font-medium text-zinc-700">{s.name}</p>
              <p className="type-caption text-zinc-400">{s.hex}</p>
            </div>
          ))}
        </div>
      </ToolSection>

      <ToolSection title="Status badges" description="State indicators for system and agent health">
        <Inline>
          <StatusBadge label="Ready" variant="success" />
          <StatusBadge label="No API key" variant="warning" />
          <StatusBadge label="Error" variant="danger" />
          <StatusBadge label="Paused" variant="neutral" />
        </Inline>
      </ToolSection>

      <ToolSection title="Status dots" description="Compact inline status indicators with optional pulse">
        <Inline>
          <StatusDot variant="success" pulse label="Healthy" />
          <StatusDot variant="warning" label="Slow" />
          <StatusDot variant="danger" label="Offline" />
          <StatusDot variant="neutral" label="Unknown" />
          <StatusDot variant="info" label="Active" />
        </Inline>
        <Inline className="mt-2">
          <StatusDot variant="success" size="sm" label="Small" />
          <StatusDot variant="warning" size="sm" label="Small" />
        </Inline>
      </ToolSection>

      <ToolSection title="Section variants" description="ToolSection supports card, flat, divided, and collapsible modes">
        <ToolSection title="Card (default)" description="Bordered container for grouped content">
          <TypeCaption>Standard visual container.</TypeCaption>
        </ToolSection>
        <ToolSection title="Flat" variant="flat">
          <TypeCaption>Hierarchy from spacing, not framing.</TypeCaption>
        </ToolSection>
        <ToolSection title="Divided" variant="divided">
          <TypeCaption>List-like sections with bottom border.</TypeCaption>
        </ToolSection>
        <ToolSection title="Collapsible" collapsible defaultOpen={false}>
          <TypeCaption>Click the header to expand. Uses smooth CSS grid animation.</TypeCaption>
        </ToolSection>
      </ToolSection>
    </Stack>
  );
}

/* ─── Controls tab ─── */

function ControlsTab() {
  const [textVal, setTextVal] = useState("Sofia Rivera");
  const [selectVal, setSelectVal] = useState("gpt-4.1-mini");
  const [areaVal, setAreaVal] = useState("Empathetic tone, reference known issues.");
  const [sliderVal, setSliderVal] = useState(1200);
  const [sliderVal2, setSliderVal2] = useState(0.7);
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(false);
  const [segActive, setSegActive] = useState("a");
  const [pillActive, setPillActive] = useState(new Set(["Alpha"]));
  const [optCard, setOptCard] = useState("obs");
  const [demoTab, setDemoTab] = useState("first");

  const togglePill = (name: string) => {
    setPillActive((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <Stack gap="lg">
      {/* TabBar */}
      <ToolSection title="TabBar" description="Pill-style tab switcher with smooth active state">
        <TabBar
          tabs={[
            { id: "first", label: "First" },
            { id: "second", label: "Second" },
            { id: "third", label: "With icon", icon: Settings },
          ]}
          active={demoTab}
          onChange={setDemoTab}
        />
        <TypeCaption>Active: {demoTab}</TypeCaption>
      </ToolSection>

      {/* Segment + Pill */}
      <ToolSection title="Segment controls" description="Single-select buttons with optional icon prop">
        <Inline>
          <SegmentControl active={segActive === "a"} label="Option A" onClick={() => setSegActive("a")} />
          <SegmentControl active={segActive === "b"} label="Option B" onClick={() => setSegActive("b")} />
          <SegmentControl active={segActive === "c"} label="With icon" icon={Zap} onClick={() => setSegActive("c")} />
        </Inline>
      </ToolSection>

      <ToolSection title="Pill toggles" description="Multi-select toggles for categories and filters">
        <Inline>
          {demoPillOptions.map((p) => (
            <PillToggle key={p} active={pillActive.has(p)} label={p} onClick={() => togglePill(p)} />
          ))}
        </Inline>
      </ToolSection>

      {/* SwitchToggle */}
      <ToolSection title="Switch toggle" description="iOS-style boolean switch, with or without label">
        <Stack gap="xs">
          <SwitchToggle
            checked={switchA}
            onChange={setSwitchA}
            label="Remember across sessions"
            description="Preserve customer data between resets"
          />
          <SwitchToggle
            checked={switchB}
            onChange={setSwitchB}
            label="Share context across channels"
          />
        </Stack>
        <Inline className="mt-2">
          <TypeCaption>Compact (no label):</TypeCaption>
          <SwitchToggle checked={switchA} onChange={setSwitchA} />
        </Inline>
      </ToolSection>

      {/* OptionCard */}
      <ToolSection title="Option cards" description="Rich selectable cards with icon, title, and description">
        <div className="grid grid-cols-2 gap-2">
          <OptionCard
            selected={optCard === "obs"}
            onClick={() => setOptCard("obs")}
            title="Observant"
            description="Reference concrete facts from context"
            icon={<Eye size={16} />}
          />
          <OptionCard
            selected={optCard === "ded"}
            onClick={() => setOptCard("ded")}
            title="Dedicated"
            description="Own the issue until resolved"
            icon={<Target size={16} />}
          />
          <OptionCard
            selected={optCard === "emoji"}
            onClick={() => setOptCard("emoji")}
            title="With emoji"
            description="Supports string icons too"
            icon="⚡"
          />
          <OptionCard
            selected={optCard === "plain"}
            onClick={() => setOptCard("plain")}
            title="Plain card"
            description="No icon, just text"
          />
        </div>
      </ToolSection>

      {/* Tags */}
      <ToolSection title="Tags" description="Removable chips for lists, categories, and selections">
        <Inline>
          <Tag label="High value" variant="accent" onRemove={() => {}} />
          <Tag label="Time sensitive" variant="accent" onRemove={() => {}} />
          <Tag label="Read-only tag" />
          <Tag label="Neutral removable" onRemove={() => {}} />
        </Inline>
      </ToolSection>

      {/* Accordion */}
      <ToolSection title="Accordion" description="Collapsible content with smooth CSS grid animation">
        <Accordion title="Advanced parameters" defaultOpen>
          <TypeBody>Expanded content with any children. Supports nested accordions.</TypeBody>
        </Accordion>
        <Accordion title="Collapsed by default">
          <TypeBody>This was closed on mount.</TypeBody>
        </Accordion>
        <Accordion title="With header right" headerRight={<StatusDot variant="success" label="OK" />}>
          <TypeBody>The header can include right-aligned elements.</TypeBody>
        </Accordion>
      </ToolSection>

      {/* Inputs */}
      <ToolSection title="Inputs" description="Text, select, and textarea fields">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Text input">
            <TextInput value={textVal} onChange={setTextVal} placeholder="Customer name" />
          </FieldGroup>
          <FieldGroup label="Select input">
            <SelectInput
              value={selectVal}
              onChange={setSelectVal}
              options={[
                { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
                { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
                { value: "gemini-2.5-flash", label: "gemini-2.5-flash" },
              ]}
            />
          </FieldGroup>
        </div>
        <FieldGroup label="Textarea" hint="Supports mono prop for code/JSON editing">
          <TextAreaInput value={areaVal} onChange={setAreaVal} rows={3} />
        </FieldGroup>
      </ToolSection>

      {/* SliderField */}
      <ToolSection title="Slider field" description="Styled range input with filled track, value label, and optional color coding">
        <SliderField
          label="Latency"
          valueLabel={`${(sliderVal / 1000).toFixed(1)}s`}
          value={sliderVal}
          min={0}
          max={3000}
          step={100}
          onChange={setSliderVal}
        />
        <SliderField
          label="Temperature"
          valueLabel={sliderVal2.toFixed(2)}
          value={sliderVal2}
          min={0}
          max={2}
          step={0.05}
          onChange={setSliderVal2}
        />
        <SliderField
          label="Color-coded latency"
          valueLabel={`${sliderVal}ms`}
          value={sliderVal}
          min={0}
          max={3000}
          step={100}
          onChange={setSliderVal}
          colorize
        />
      </ToolSection>

      {/* Buttons */}
      <ToolSection title="Action buttons" description="Primary, secondary, ghost, and danger variants. Optional icon prop.">
        <Inline>
          <ActionButton label="Primary" onClick={() => {}} />
          <ActionButton variant="secondary" label="Secondary" onClick={() => {}} />
          <ActionButton variant="ghost" label="Ghost" onClick={() => {}} />
          <ActionButton variant="danger" label="Danger" onClick={() => {}} />
        </Inline>
        <Inline>
          <ActionButton label="With icon" icon={Zap} onClick={() => {}} />
          <ActionButton variant="secondary" label="Disabled" disabled onClick={() => {}} />
        </Inline>
      </ToolSection>
    </Stack>
  );
}

/* ─── Patterns tab ─── */

function PatternsTab() {
  return (
    <Stack gap="lg">
      <ToolSection title="Setting row" description="Label + control in a horizontal scannable row">
        <Stack gap="xs">
          <SettingRow label="Remember customer" description="Keep profile between sessions">
            <SwitchToggle checked onChange={() => {}} />
          </SettingRow>
          <SettingRow label="Active provider">
            <StatusBadge label="OpenAI" variant="success" />
          </SettingRow>
          <SettingRow label="Proactivity level">
            <TypeCaption>3 — Balanced</TypeCaption>
          </SettingRow>
        </Stack>
      </ToolSection>

      <ToolSection title="Field group" description="Label + input + optional hint, wrapped as a single unit">
        <FieldGroup label="API key" hint="Stored in memory only, never persisted to disk">
          <TextInput value="" onChange={() => {}} placeholder="sk-..." type="password" />
        </FieldGroup>
      </ToolSection>

      <ToolSection title="Composition: status overview" description="Compact grid of StatusDots for at-a-glance health">
        <div className="rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] p-3">
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            <StatusDot variant="success" pulse label="CRM" />
            <StatusDot variant="success" pulse label="Orders" />
            <StatusDot variant="warning" label="Product Catalog" />
            <StatusDot variant="success" pulse label="Knowledge Base" />
            <StatusDot variant="danger" label="Payment" />
            <StatusDot variant="success" pulse label="Notifications" />
          </div>
        </div>
      </ToolSection>

      <ToolSection title="Composition: preset cards" description="OptionCard grid for scenario / persona selection">
        <div className="grid grid-cols-3 gap-2">
          <OptionCard selected title="Frustrated VIP" description="Urgent, mobile, high-value" icon="😤" onClick={() => {}} />
          <OptionCard selected={false} title="New Customer" description="No history, neutral" icon="👋" onClick={() => {}} />
          <OptionCard selected={false} title="Power User" description="Repeat buyer, happy" icon="⚡" onClick={() => {}} />
        </div>
      </ToolSection>

      <ToolSection title="Composition: integration accordion" description="Accordion with header status + toggle, nested content">
        <Accordion
          title="📦  Order Management"
          headerRight={
            <Inline>
              <StatusDot variant="warning" size="sm" label="Slow" />
              <SwitchToggle checked onChange={() => {}} />
            </Inline>
          }
          defaultOpen
        >
          <Stack gap="md">
            <FieldGroup label="Scenario">
              <div className="grid grid-cols-4 gap-1.5">
                <SegmentControl active label="Healthy" onClick={() => {}} />
                <SegmentControl active={false} label="Slow" onClick={() => {}} />
                <SegmentControl active={false} label="Degraded" onClick={() => {}} />
                <SegmentControl active={false} label="Offline" onClick={() => {}} />
              </div>
            </FieldGroup>
            <SliderField label="Latency" valueLabel="2.2s" value={2200} min={0} max={3000} step={100} onChange={() => {}} colorize />
          </Stack>
        </Accordion>
      </ToolSection>

      <ToolSection title="Composition: chat bubble" description="Message styling pattern used in the agent chat tab">
        <Stack gap="sm">
          <div className="ml-8 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <div className="mb-1 flex items-center gap-1.5">
              <StatusDot variant="info" size="sm" />
              <span className="type-caption text-zinc-500">Web · 2:34 PM</span>
            </div>
            <p className="type-body-sm text-zinc-900">My order has been delayed. Can you help?</p>
          </div>
          <div className="mr-8 rounded-xl border border-emerald-100 bg-white px-4 py-3">
            <div className="mb-1 flex items-center gap-1.5">
              <StatusDot variant="success" size="sm" />
              <span className="type-caption text-zinc-500">Web · 2:34 PM</span>
            </div>
            <p className="type-body-sm text-zinc-900">
              Hi Sofia, I can see your order #24831 is delayed by 3 days. Let me check the latest status.
            </p>
          </div>
        </Stack>
      </ToolSection>

      <ToolSection title="Handoff banner" description="Cross-channel continuity indicator for incoming context handoffs">
        <Stack gap="sm">
          <HandoffBanner
            fromChannel="web"
            summary="Looking at Astra X, asked about delivery timeline"
            timestamp={new Date().toISOString()}
          />
          <HandoffBanner
            fromChannel="ivr"
            summary="Transferred from IVR menu, order inquiry"
          />
        </Stack>
      </ToolSection>

      <ToolSection title="Phone frame" description="Minimal smartphone shell wrapper for channel simulations">
        <TypeCaption>
          Wraps channel content in a realistic phone bezel with status bar, dynamic island notch, and home indicator.
          Used by the WhatsApp window. Open it from the taskbar to see a live example.
        </TypeCaption>
      </ToolSection>

      <ToolSection title="Composition: tag list with add" description="Removable tags with suggestion chips and input">
        <Stack gap="sm">
          <Inline>
            <Tag label="Order #24831 - Premium Blender" onRemove={() => {}} />
            <Tag label="Order #24899 - Smart Kettle" onRemove={() => {}} />
          </Inline>
          <Inline>
            <button
              type="button"
              className="type-caption inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              + Espresso Machine Cleaner
            </button>
          </Inline>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TextInput value="" onChange={() => {}} placeholder="Custom entry" />
            </div>
            <ActionButton variant="secondary" label="Add" onClick={() => {}} />
          </div>
        </Stack>
      </ToolSection>
    </Stack>
  );
}
