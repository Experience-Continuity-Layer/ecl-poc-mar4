"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { updateContext, useAgentContextStore } from "@/core/agent-context/store";
import type { AgentChannel, AgentCustomer } from "@/core/agent-context/types";
import {
  ActionButton,
  FieldGroup,
  Inline,
  OptionCard,
  SegmentControl,
  Stack,
  Tag,
  TextInput,
  ToolAppSurface,
  ToolSection,
  toDisplayLabel,
} from "../tooling/design-system/primitives";

const intentOptions = [
  "General assistance",
  "Vehicle delivery status",
  "Service appointment",
  "Charging issue",
  "Subscription inquiry",
  "In a hurry",
] as const;

const tierOptions = ["New", "Regular", "VIP"] as const;
const channelOptions: AgentChannel[] = ["web", "ivr", "whatsapp", "kiosk", "email"];
const deviceOptions = ["mobile", "desktop", "tablet", "kiosk", "phone"] as const;
const emotionOptions = ["neutral", "frustrated", "happy", "in a hurry", "confused"] as const;
const categoryOptions = [
  "high value",
  "time sensitive",
  "first-time buyer",
  "returning owner",
  "fleet customer",
  "EV enthusiast",
] as const;
const purchaseSuggestions = [
  "Order #AM-44281 – Astra X · Delivery prep",
  "Order #AM-43802 – HomeCharge Pro installation",
  "Connected Care Plus subscription",
];
const issueSuggestions = [
  "Vehicle delivery delayed by 5 days",
  "Charging station not recognized at home",
  "Software update failed mid-install",
];

type PresetId = "anonymous" | "frustrated-vip" | "new-customer" | "power-user";

const presets: { id: PresetId; icon: string; title: string; desc: string; data: AgentCustomer }[] = [
  {
    id: "anonymous",
    icon: "👤",
    title: "Anonymous Visitor",
    desc: "Zero context — build from scratch",
    data: {
      name: null, age: null, language: null, preferredChannel: null,
      tier: null, phoneNumber: null, purchases: [], issues: [], categories: [],
      intent: null, emotionalState: null, device: null,
    },
  },
  {
    id: "frustrated-vip",
    icon: "😤",
    title: "Frustrated Owner",
    desc: "VIP waiting on delayed vehicle delivery",
    data: {
      name: "Alexandra Voss", age: 42, language: "English", preferredChannel: "whatsapp",
      tier: "VIP", phoneNumber: "+31 6 12345678",
      purchases: ["Order #AM-44281 – Astra X · Delivery prep", "Connected Care Plus subscription"],
      issues: ["Vehicle delivery delayed by 5 days", "HomeCharge Pro installation rescheduled"],
      categories: ["high value", "time sensitive"], intent: "Vehicle delivery status",
      emotionalState: "frustrated", device: "mobile",
    },
  },
  {
    id: "new-customer",
    icon: "👋",
    title: "First-time Buyer",
    desc: "Exploring the lineup, no ownership yet",
    data: {
      name: "Lucas Andersen", age: 29, language: "English", preferredChannel: "web",
      tier: "New", phoneNumber: null, purchases: [], issues: [], categories: ["first-time buyer", "EV enthusiast"],
      intent: "General assistance", emotionalState: "neutral", device: "desktop",
    },
  },
  {
    id: "power-user",
    icon: "⚡",
    title: "Returning Owner",
    desc: "Active subscriber, managing services",
    data: {
      name: "Priya Nair", age: 36, language: "English", preferredChannel: "web",
      tier: "Regular", phoneNumber: null,
      purchases: ["Order #AM-43802 – HomeCharge Pro installation", "Connected Care Plus subscription", "Order #AM-43117 – Connected Care renewal"],
      issues: ["Software update failed mid-install"],
      categories: ["returning owner", "EV enthusiast"], intent: "Subscription inquiry",
      emotionalState: "happy", device: "desktop",
    },
  },
];

function patch(current: AgentCustomer, updates: Partial<AgentCustomer>) {
  updateContext("customer", { ...current, ...updates });
}

/* ─── List editor (purchases / issues) ─── */

function ListEditor({
  items,
  suggestions,
  placeholder,
  onAdd,
  onRemove,
}: {
  items: string[];
  suggestions: string[];
  placeholder: string;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  };

  return (
    <Stack gap="sm">
      {/* Suggestions */}
      <Inline>
        {suggestions
          .filter((s) => !items.includes(s))
          .map((s) => (
            <button
              key={s}
              type="button"
              className="type-caption inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
              onClick={() => onAdd(s)}
            >
              <Plus size={11} />
              {s}
            </button>
          ))}
      </Inline>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={placeholder}
          />
        </div>
        <ActionButton label="Add" variant="secondary" icon={Plus} onClick={addItem} />
      </div>

      {/* Item tags */}
      {items.length > 0 ? (
        <Inline>
          {items.map((item, i) => (
            <Tag key={`${item}_${i}`} label={item} onRemove={() => onRemove(i)} />
          ))}
        </Inline>
      ) : (
        <p className="type-caption text-zinc-400">None added yet.</p>
      )}
    </Stack>
  );
}

/* ─── Main component ─── */

export function CustomerProfileSimulatorWindow() {
  const customer = useAgentContextStore((s) => s.context.customer);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("anonymous");

  const loadPreset = (preset: PresetId) => {
    setSelectedPreset(preset);
    const data = presets.find((p) => p.id === preset)?.data;
    if (data) updateContext("customer", { ...customer, ...data });
  };

  return (
    <ToolAppSurface>
      {/* Preset cards */}
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {presets.map((p) => (
          <OptionCard
            key={p.id}
            selected={selectedPreset === p.id}
            onClick={() => loadPreset(p.id)}
            title={p.title}
            description={p.desc}
            icon={p.icon}
          />
        ))}
      </div>

      {/* Identity + Context — responsive to container width */}
      <div className="mt-5 grid gap-5 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <ToolSection title="Identity" variant="card" gap="md">
          <FieldGroup label="Name">
            <TextInput
              value={customer.name ?? ""}
              onChange={(v) => patch(customer, { name: v || null })}
              placeholder="Unknown"
            />
          </FieldGroup>

          <FieldGroup label="Tier">
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(90px,1fr))]">
              <SegmentControl
                active={customer.tier === null}
                label="Unknown"
                onClick={() => patch(customer, { tier: null })}
              />
              {tierOptions.map((tier) => (
                <SegmentControl
                  key={tier}
                  active={customer.tier === tier}
                  label={tier}
                  onClick={() => patch(customer, { tier })}
                />
              ))}
            </div>
          </FieldGroup>

          <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
            <FieldGroup label="Age">
              <TextInput
                type="number"
                value={customer.age != null ? String(customer.age) : ""}
                onChange={(v) => patch(customer, { age: v ? Number(v) : null })}
                placeholder="Unknown"
              />
            </FieldGroup>
            <FieldGroup label="Language">
              <TextInput
                value={customer.language ?? ""}
                onChange={(v) => patch(customer, { language: v || null })}
                placeholder="Unknown"
              />
            </FieldGroup>
          </div>
        </ToolSection>

        <ToolSection title="Context" variant="card" gap="md">
          <FieldGroup label="Intent">
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
              <SegmentControl
                active={customer.intent === null}
                label="Unknown"
                onClick={() => patch(customer, { intent: null })}
              />
              {intentOptions.map((intent) => (
                <SegmentControl
                  key={intent}
                  active={customer.intent === intent}
                  label={intent}
                  onClick={() => patch(customer, { intent })}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Emotion">
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              <SegmentControl
                active={customer.emotionalState === null}
                label="Unknown"
                onClick={() => patch(customer, { emotionalState: null })}
              />
              {emotionOptions.map((e) => (
                <SegmentControl
                  key={e}
                  active={customer.emotionalState === e}
                  label={toDisplayLabel(e)}
                  onClick={() => patch(customer, { emotionalState: e })}
                />
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Device">
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
              <SegmentControl
                active={customer.device === null}
                label="Unknown"
                onClick={() => patch(customer, { device: null })}
              />
              {deviceOptions.map((d) => (
                <SegmentControl
                  key={d}
                  active={customer.device === d}
                  label={toDisplayLabel(d)}
                  onClick={() => patch(customer, { device: d })}
                />
              ))}
            </div>
          </FieldGroup>
        </ToolSection>
      </div>

      {/* Channel preference */}
      <ToolSection title="Channel Preference" variant="card" className="mt-5" gap="md">
        <div className="grid gap-1.5 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
          <SegmentControl
            active={customer.preferredChannel === null}
            label="Unknown"
            onClick={() => patch(customer, { preferredChannel: null })}
          />
          {channelOptions.map((ch) => (
            <SegmentControl
              key={ch}
              active={customer.preferredChannel === ch}
              label={toDisplayLabel(ch)}
              onClick={() => patch(customer, { preferredChannel: ch })}
            />
          ))}
        </div>
      </ToolSection>

      {/* Categories */}
      <ToolSection title="Categories" variant="card" className="mt-5" gap="md">
        <Inline>
          {categoryOptions.map((cat) => {
            const active = customer.categories.includes(cat);
            return (
              <Tag
                key={cat}
                label={toDisplayLabel(cat)}
                variant={active ? "accent" : "neutral"}
                onRemove={
                  active
                    ? () => patch(customer, { categories: customer.categories.filter((c) => c !== cat) })
                    : undefined
                }
              />
            );
          })}
        </Inline>
        <Inline>
          {categoryOptions
            .filter((cat) => !customer.categories.includes(cat))
            .map((cat) => (
              <button
                key={cat}
                type="button"
                className="type-caption inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50"
                onClick={() => patch(customer, { categories: [...customer.categories, cat] })}
              >
                <Plus size={11} />
                {toDisplayLabel(cat)}
              </button>
            ))}
        </Inline>
      </ToolSection>

      {/* Purchases & Issues — responsive to container width */}
      <div className="mt-5 grid gap-5 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        <ToolSection title="Purchases" variant="card" gap="md">
          <ListEditor
            items={customer.purchases}
            suggestions={purchaseSuggestions}
            placeholder="Custom purchase entry"
            onAdd={(item) => {
              if (!customer.purchases.includes(item)) patch(customer, { purchases: [...customer.purchases, item] });
            }}
            onRemove={(i) => patch(customer, { purchases: customer.purchases.filter((_, idx) => idx !== i) })}
          />
        </ToolSection>

        <ToolSection title="Issues" variant="card" gap="md">
          <ListEditor
            items={customer.issues}
            suggestions={issueSuggestions}
            placeholder="Custom issue entry"
            onAdd={(item) => {
              if (!customer.issues.includes(item)) patch(customer, { issues: [...customer.issues, item] });
            }}
            onRemove={(i) => patch(customer, { issues: customer.issues.filter((_, idx) => idx !== i) })}
          />
        </ToolSection>
      </div>
    </ToolAppSurface>
  );
}
