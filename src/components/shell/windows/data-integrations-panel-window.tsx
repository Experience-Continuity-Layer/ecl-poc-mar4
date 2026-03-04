"use client";

import { useMemo, useState } from "react";
import { updateContext, useAgentContextStore } from "@/core/agent-context/store";
import type { IntegrationConfig, IntegrationsMap } from "@/core/agent-context/types";
import {
  Accordion,
  FieldGroup,
  Inline,
  OptionCard,
  SegmentControl,
  SliderField,
  Stack,
  StatusDot,
  SwitchToggle,
  TextAreaInput,
  ToolAppSurface,
  ToolSection,
  toDisplayLabel,
} from "../tooling/design-system/primitives";
import type { StatusDotVariant } from "../tooling/design-system/primitives";

const integrationOrder = [
  "crm",
  "orderManagement",
  "productCatalog",
  "knowledgeBase",
  "payment",
  "notifications",
] as const;
type IntegrationKey = (typeof integrationOrder)[number];
type ScenarioName = "healthy" | "slow" | "degraded" | "offline";

const scenarioProfiles: Record<ScenarioName, { enabled: boolean; latencyMs: number; mockData: Record<string, unknown> }> = {
  healthy: { enabled: true, latencyMs: 120, mockData: { status: "healthy", note: "Primary data path available" } },
  slow: { enabled: true, latencyMs: 2200, mockData: { status: "slow", note: "Latency spike" } },
  degraded: { enabled: true, latencyMs: 1400, mockData: { status: "degraded", note: "Partial data available" } },
  offline: { enabled: false, latencyMs: 3000, mockData: { status: "offline", note: "Service unavailable" } },
};

const baselineMockData: Record<IntegrationKey, Record<string, unknown>> = {
  crm: { customerId: "AM-CUST-10244", accountOwner: "City Hub Amsterdam", loyaltyTier: "Premium" },
  orderManagement: { lastOrderId: "AM-44281", orderTitle: "Astra X · Delivery prep", status: "in-progress", etaDays: 5 },
  productCatalog: { featuredModel: "Astra X", inventoryNote: "Nova Crossover wait-list: ~4 weeks" },
  knowledgeBase: { topArticle: "How to troubleshoot home charging issues", policyVersion: "2026.02" },
  payment: { cardOnFile: true, subscriptionActive: true, refundWindowDays: 30 },
  notifications: { smsOptIn: true, emailOptIn: true, deliveryAlerts: true },
};

const integrationIcons: Record<IntegrationKey, string> = {
  crm: "👤",
  orderManagement: "📦",
  productCatalog: "🏷",
  knowledgeBase: "📚",
  payment: "💳",
  notifications: "🔔",
};

const globalScenarios: { id: string; icon: string; title: string; desc: string }[] = [
  { id: "normal-ops", icon: "✅", title: "Normal Ops", desc: "All systems healthy" },
  { id: "crm-outage", icon: "🔴", title: "CRM Outage", desc: "CRM offline, others healthy" },
  { id: "checkout-incident", icon: "⚠️", title: "Checkout Incident", desc: "Payment & orders degraded" },
  { id: "high-load", icon: "🐢", title: "High Load", desc: "All systems slow" },
];

function formatIntegrationName(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function scenarioDotVariant(scenario: ScenarioName | null, enabled: boolean): StatusDotVariant {
  if (!enabled) return "danger";
  if (scenario === "healthy") return "success";
  if (scenario === "slow") return "warning";
  if (scenario === "degraded") return "warning";
  if (scenario === "offline") return "danger";
  return "neutral";
}

export function DataIntegrationsPanelWindow() {
  const integrations = useAgentContextStore((s) => s.context.integrations);
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});
  const [activeGlobalScenario, setActiveGlobalScenario] = useState<string | null>(null);
  const [draftJson, setDraftJson] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      integrationOrder
        .filter((key) => Boolean(integrations[key]))
        .map((key) => [key, JSON.stringify(integrations[key].mockData, null, 2)]),
    ),
  );

  const integrationEntries = useMemo(
    () =>
      integrationOrder
        .filter((key) => Boolean(integrations[key]))
        .map((key) => [key, integrations[key]] as const),
    [integrations],
  );

  const updateIntegration = (key: IntegrationKey, patch: Partial<IntegrationConfig>) => {
    const current = integrations[key];
    if (!current) return;
    updateContext("integrations", { ...integrations, [key]: { ...current, ...patch } });
  };

  const getScenario = (key: IntegrationKey): ScenarioName | null => {
    const s = integrations[key]?.mockData?.scenario;
    if (s === "healthy" || s === "slow" || s === "degraded" || s === "offline") return s;
    return null;
  };

  const applyIntegrationScenario = (key: IntegrationKey, scenario: ScenarioName) => {
    const profile = scenarioProfiles[scenario];
    const data = { ...baselineMockData[key], ...profile.mockData, scenario };
    setDraftJson((prev) => ({ ...prev, [key]: JSON.stringify(data, null, 2) }));
    setJsonErrors((prev) => ({ ...prev, [key]: "" }));
    updateIntegration(key, { enabled: profile.enabled, latencyMs: profile.latencyMs, mockData: data });
    setActiveGlobalScenario(null);
  };

  const applyGlobalScenario = (scenario: string) => {
    setActiveGlobalScenario(scenario);
    const nextIntegrations: IntegrationsMap = { ...integrations };
    const nextDrafts = { ...draftJson };
    for (const key of integrationOrder) {
      const current = integrations[key];
      if (!current) continue;
      let chosen: ScenarioName = "healthy";
      if (scenario === "crm-outage" && key === "crm") chosen = "offline";
      if (scenario === "checkout-incident" && (key === "payment" || key === "orderManagement")) chosen = "degraded";
      if (scenario === "high-load") chosen = "slow";
      const profile = scenarioProfiles[chosen];
      const data = { ...baselineMockData[key], ...profile.mockData, scenario: chosen };
      nextIntegrations[key] = { ...current, enabled: profile.enabled, latencyMs: profile.latencyMs, mockData: data };
      nextDrafts[key] = JSON.stringify(data, null, 2);
    }
    setDraftJson(nextDrafts);
    setJsonErrors({});
    updateContext("integrations", nextIntegrations);
  };

  return (
    <ToolAppSurface>
      {/* Status overview */}
      <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
        <p className="type-label mb-2.5 text-zinc-500">System status</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {integrationEntries.map(([key, integration]) => {
            const scenario = getScenario(key);
            const variant = scenarioDotVariant(scenario, integration.enabled);
            return (
              <StatusDot
                key={key}
                variant={variant}
                pulse={variant === "success"}
                label={formatIntegrationName(key)}
              />
            );
          })}
        </div>
      </div>

      {/* Global scenarios */}
      <ToolSection title="Scenarios" variant="flat" className="mt-5" description="Apply a preset condition across all integrations at once">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {globalScenarios.map((s) => (
            <OptionCard
              key={s.id}
              selected={activeGlobalScenario === s.id}
              onClick={() => applyGlobalScenario(s.id)}
              title={s.title}
              description={s.desc}
              icon={s.icon}
            />
          ))}
        </div>
      </ToolSection>

      {/* Per-integration accordions */}
      <Stack gap="sm" className="mt-5">
        {integrationEntries.map(([key, integration]) => {
          const scenario = getScenario(key);
          const variant = scenarioDotVariant(scenario, integration.enabled);

          return (
            <Accordion
              key={key}
              title={`${integrationIcons[key]}  ${formatIntegrationName(key)}`}
              headerRight={
                <Inline>
                  <StatusDot variant={variant} size="sm" label={scenario ? toDisplayLabel(scenario) : "Custom"} />
                  <SwitchToggle
                    checked={integration.enabled}
                    onChange={(on) => updateIntegration(key, { enabled: on })}
                    label=""
                  />
                </Inline>
              }
              defaultOpen={false}
              className="overflow-hidden"
            >
              <Stack gap="md">
                {/* Scenario selector */}
                <FieldGroup label="Scenario">
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["healthy", "slow", "degraded", "offline"] as ScenarioName[]).map((s) => (
                      <SegmentControl
                        key={s}
                        active={scenario === s}
                        label={toDisplayLabel(s)}
                        onClick={() => applyIntegrationScenario(key, s)}
                      />
                    ))}
                  </div>
                </FieldGroup>

                {/* Latency slider */}
                <SliderField
                  label="Latency"
                  valueLabel={`${(integration.latencyMs / 1000).toFixed(1)}s`}
                  value={integration.latencyMs}
                  min={0}
                  max={3000}
                  step={100}
                  onChange={(v) => updateIntegration(key, { latencyMs: v })}
                  colorize
                />

                {/* Raw JSON */}
                <Accordion title="Raw payload" className="border-zinc-200 bg-white">
                  <FieldGroup label="Mock JSON data">
                    <TextAreaInput
                      value={draftJson[key] ?? JSON.stringify(integration.mockData, null, 2)}
                      rows={6}
                      mono
                      onChange={(val) => {
                        setDraftJson((prev) => ({ ...prev, [key]: val }));
                        try {
                          const parsed = JSON.parse(val) as Record<string, unknown>;
                          setJsonErrors((prev) => ({ ...prev, [key]: "" }));
                          updateIntegration(key, { mockData: parsed });
                        } catch (e) {
                          setJsonErrors((prev) => ({
                            ...prev,
                            [key]: e instanceof Error ? e.message : "Invalid JSON",
                          }));
                        }
                      }}
                    />
                  </FieldGroup>
                  {jsonErrors[key] ? (
                    <p className="type-caption mt-1 text-red-600">{jsonErrors[key]}</p>
                  ) : null}
                </Accordion>
              </Stack>
            </Accordion>
          );
        })}
      </Stack>
    </ToolAppSurface>
  );
}
