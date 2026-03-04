"use client";

import { useMemo } from "react";
import { useAgentContextStore } from "./agent-context/store";
import { aureliaModels, aureliaAccountOrders, type ModelType } from "@/data/aurelia-website";

type BrowserPage = "home" | "models" | "model-detail" | "ownership" | "support" | "my-account";
type ModelFilter = "all" | "electric" | "hybrid" | "performance";

interface BannerData {
  message: string;
  action?: { label: string; page: BrowserPage; modelSlug?: string };
}

type HeroKind = "default" | "electric" | "hybrid" | "performance" | "returning" | "support";

interface HeroVariant {
  kind: HeroKind;
  eyebrow: string;
  title: [string, string];
  subtitle: string;
}

export interface HeroCta {
  label: string;
  page?: BrowserPage;
  modelSlug?: string;
  action?: "test-drive" | "view-orders";
  style: "primary" | "ghost";
}

export interface WebPersonalization {
  banner: BannerData | null;
  featuredModelSlug: string;
  heroVariant: HeroVariant;
  heroCtas: HeroCta[];
  modelBadges: Record<string, string>;
  preferredFilter: ModelFilter | null;
  preFill: { name: string | null; modelSlug: string | null };
  hasVisitedModels: boolean;
}

const DEFAULT_HERO: HeroVariant = {
  kind: "default",
  eyebrow: "A premium mobility experience",
  title: ["Designed around", "your life."],
  subtitle:
    "A modern automotive ecosystem built for safety, electrification, and effortless ownership.",
};

const HERO_VARIANTS: Record<string, HeroVariant> = {
  electric: {
    kind: "electric",
    eyebrow: "Go electric with confidence",
    title: ["Electric confidence,", "built for your life."],
    subtitle:
      "Explore our fully electric range — long range, fast charging, and seamless ownership.",
  },
  hybrid: {
    kind: "hybrid",
    eyebrow: "Flexibility meets refinement",
    title: ["The best of", "both worlds."],
    subtitle:
      "Hybrid powertrains that adapt to your journey — electric in the city, ready for the open road.",
  },
  performance: {
    kind: "performance",
    eyebrow: "Engineered to thrill",
    title: ["Precision engineering,", "designed for the drive."],
    subtitle:
      "Dual motors, adaptive chassis, and track-proven performance wrapped in everyday refinement.",
  },
  returning: {
    kind: "returning",
    eyebrow: "Welcome back",
    title: ["Your journey", "continues."],
    subtitle:
      "Pick up where you left off — your vehicle, your preferences, your way.",
  },
  support: {
    kind: "support",
    eyebrow: "We're here for you",
    title: ["Let's get this", "sorted."],
    subtitle:
      "Our team is ready to help with whatever you need. Your context is already with us.",
  },
};

function parseModelSlugFromSignal(detail: string): string | null {
  const match = detail.match(/^model:([a-z0-9-]+)/);
  return match ? match[1] : null;
}

function parseModelTypeFromSignals(
  interestCounts: Record<string, number>,
): ModelType | null {
  let best: ModelType | null = null;
  let bestCount = 0;

  const typeCounts: Record<string, number> = {};
  for (const [slug, count] of Object.entries(interestCounts)) {
    const model = aureliaModels.find((m) => m.slug === slug);
    if (!model) continue;
    typeCounts[model.type] = (typeCounts[model.type] ?? 0) + count;
  }

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > bestCount) {
      bestCount = count;
      best = type as ModelType;
    }
  }

  return best;
}

export function useWebPersonalization(): WebPersonalization {
  const signals = useAgentContextStore((s) => s.context.signals);
  const customer = useAgentContextStore((s) => s.context.customer);
  const pendingActions = useAgentContextStore((s) => s.context.pendingActions);
  const topics = useAgentContextStore((s) => s.context.topics);
  const integrations = useAgentContextStore((s) => s.context.integrations);

  return useMemo(() => {
    const paymentOffline = !integrations.payment?.enabled ||
      integrations.payment?.mockData?.scenario === "offline";
    const orderOffline = !integrations.orderManagement?.enabled ||
      integrations.orderManagement?.mockData?.scenario === "offline";
    const criticalOutage = paymentOffline || orderOffline;
    const modelInterestCounts: Record<string, number> = {};
    const viewedSlugs = new Set<string>();
    let hasVisitedModelsPage = false;
    let hasVisitedSupport = false;

    for (const sig of signals) {
      if (sig.eventType === "product_interest") {
        const slug = parseModelSlugFromSignal(sig.detail);
        if (slug) {
          modelInterestCounts[slug] = (modelInterestCounts[slug] ?? 0) + 1;
          viewedSlugs.add(slug);
        }
      }
      if (sig.eventType === "action_detected") {
        if (sig.detail === "opened_support") hasVisitedSupport = true;
      }
      if (
        sig.eventType === "channel_switch" &&
        sig.detail.includes("->web:models")
      ) {
        hasVisitedModelsPage = true;
      }
    }

    const topModelSlug = Object.entries(modelInterestCounts).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? null;

    const dominantType = parseModelTypeFromSignals(modelInterestCounts);

    const hasInteraction = signals.length > 0 || !!customer.name;
    const hasIssues = customer.issues.length > 0;
    const hasSupportIntent =
      hasVisitedSupport ||
      customer.intent?.toLowerCase().includes("support") ||
      customer.intent?.toLowerCase().includes("help") ||
      customer.intent?.toLowerCase().includes("issue") ||
      topics.some(
        (t) =>
          t.toLowerCase().includes("support") ||
          t.toLowerCase().includes("issue") ||
          t.toLowerCase().includes("problem"),
      );

    // --- Banner (priority: critical outage > issues > orders > product interest > welcome) ---
    let banner: BannerData | null = null;

    if (criticalOutage) {
      const parts: string[] = [];
      if (paymentOffline) parts.push("payment processing");
      if (orderOffline) parts.push("order management");
      banner = {
        message: `We're experiencing issues with ${parts.join(" and ")}. Some features may be temporarily limited.`,
        action: { label: "Contact support", page: "support" },
      };
    } else if (hasIssues && pendingActions.length > 0) {
      const latestAction = pendingActions[pendingActions.length - 1];
      banner = {
        message: `We're working on your request: ${latestAction.detail}`,
        action: { label: "View support", page: "support" },
      };
    } else if (hasIssues) {
      banner = {
        message: customer.name
          ? `${customer.name}, we're tracking your concern: ${customer.issues[customer.issues.length - 1]}`
          : `We're tracking your concern: ${customer.issues[customer.issues.length - 1]}`,
        action: { label: "Go to support", page: "support" },
      };
    } else if (customer.name) {
      const inProgressOrder = aureliaAccountOrders.find(
        (o) => o.status === "In progress",
      );
      if (inProgressOrder) {
        banner = {
          message: `Welcome back, ${customer.name}. ${inProgressOrder.title} — ${inProgressOrder.detail.toLowerCase()}.`,
          action: { label: "View orders", page: "my-account" },
        };
      } else if (topModelSlug) {
        const model = aureliaModels.find((m) => m.slug === topModelSlug);
        banner = {
          message: `Welcome back, ${customer.name}. Still exploring the ${model?.name ?? "lineup"}?`,
          action: {
            label: `View ${model?.name ?? "details"}`,
            page: "model-detail",
            modelSlug: topModelSlug,
          },
        };
      } else {
        banner = {
          message: `Welcome back, ${customer.name}. How can we help today?`,
        };
      }
    } else if (topModelSlug && dominantType) {
      const typeLabel =
        dominantType === "electric"
          ? "electric vehicles"
          : dominantType === "hybrid"
            ? "hybrid models"
            : "performance vehicles";
      banner = {
        message: `Interested in ${typeLabel}? See what fits your lifestyle.`,
        action: { label: "Browse models", page: "models" },
      };
    }

    // --- Featured model ---
    const featuredModelSlug = topModelSlug ?? aureliaModels[0].slug;

    // --- Hero variant ---
    let heroVariant = DEFAULT_HERO;
    if (hasSupportIntent && hasIssues) {
      heroVariant = HERO_VARIANTS.support;
    } else if (customer.name && hasInteraction) {
      heroVariant = HERO_VARIANTS.returning;
    } else if (dominantType && HERO_VARIANTS[dominantType]) {
      heroVariant = HERO_VARIANTS[dominantType];
    }

    // --- Model badges ---
    const modelBadges: Record<string, string> = {};
    for (const slug of viewedSlugs) {
      modelBadges[slug] = "Viewed";
    }

    // --- Preferred filter ---
    const preferredFilter: ModelFilter | null = dominantType ?? null;

    // --- Hero CTAs (derived from hero kind + context) ---
    const topModel = topModelSlug
      ? aureliaModels.find((m) => m.slug === topModelSlug) ?? null
      : null;

    const typeLabels: Record<string, string> = {
      electric: "electric",
      hybrid: "hybrid",
      performance: "performance",
    };

    let heroCtas: HeroCta[];

    switch (heroVariant.kind) {
      case "support":
        heroCtas = [
          { label: "Go to support", page: "support", style: "primary" },
          { label: "View my orders", action: "view-orders", style: "ghost" },
        ];
        break;

      case "returning":
        heroCtas = topModel
          ? [
              {
                label: `Continue with ${topModel.name}`,
                page: "model-detail",
                modelSlug: topModel.slug,
                style: "primary",
              },
              { label: "View my account", page: "my-account", style: "ghost" },
            ]
          : [
              { label: "Continue exploring", page: "models", style: "primary" },
              { label: "View my account", page: "my-account", style: "ghost" },
            ];
        break;

      case "electric":
      case "hybrid":
      case "performance": {
        const typeWord = typeLabels[heroVariant.kind];
        heroCtas = [
          {
            label: `See ${typeWord} models`,
            page: "models",
            style: "primary",
          },
          topModel
            ? {
                label: `Test drive the ${topModel.name}`,
                action: "test-drive",
                style: "ghost",
              }
            : {
                label: "Book a test drive",
                action: "test-drive",
                style: "ghost",
              },
        ];
        break;
      }

      default:
        heroCtas = [
          { label: "Explore the range", page: "models", style: "primary" },
          { label: "Book a test drive", action: "test-drive", style: "ghost" },
        ];
        break;
    }

    // --- Pre-fill ---
    const preFill = {
      name: customer.name,
      modelSlug: topModelSlug,
    };

    return {
      banner,
      featuredModelSlug,
      heroVariant,
      heroCtas,
      modelBadges,
      preferredFilter,
      preFill,
      hasVisitedModels: hasVisitedModelsPage,
    };
  }, [signals, customer, pendingActions, topics, integrations]);
}
