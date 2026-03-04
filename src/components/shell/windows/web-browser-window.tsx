"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Globe2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  User,
  X,
  Zap,
} from "lucide-react";
import { ArrowUpRight, MessageCircle, SendHorizonal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { logBehavioralSignal, logChannelEvent, updateContext, useAgentContextStore } from "@/core/agent-context/store";
import type { ConversationEntry } from "@/core/agent-context/types";
import { runAgentTurn } from "@/core/ai/agent-module";
import {
  aureliaAccountOrders,
  aureliaAccountPreferences,
  aureliaAccountProfile,
  aureliaAccountSubscription,
  aureliaAccountVehicle,
  aureliaFaqItems,
  aureliaHighlights,
  aureliaModels,
  aureliaOwnershipData,
  HERO_IMG,
  OWNERSHIP_IMG,
  type AureliaModel,
} from "@/data/aurelia-website";
import type { ShellAppId } from "@/components/shell/window-manager/types";
import { useWebPersonalization } from "@/core/use-web-personalization";
import { parseRichMessage, type RichSegment } from "@/lib/rich-message-parser";
import styles from "./web-browser-window.module.css";

/* ═══════════════════════════════════════════ Types ═══ */

type BrowserPage = "home" | "models" | "model-detail" | "ownership" | "support" | "my-account";
type ModelFilter = "all" | "electric" | "hybrid" | "performance";
type AccountTab = "vehicle" | "subscription" | "orders" | "preferences";
type EffectiveStatus = "healthy" | "slow" | "degraded" | "offline";

type Model = AureliaModel;

interface IntegrationHealth {
  crm: EffectiveStatus;
  orderManagement: EffectiveStatus;
  productCatalog: EffectiveStatus;
  knowledgeBase: EffectiveStatus;
  payment: EffectiveStatus;
  notifications: EffectiveStatus;
  hasAnyIssue: boolean;
  hasOffline: boolean;
}

function resolveStatus(integration: { enabled: boolean; mockData: Record<string, unknown> } | undefined): EffectiveStatus {
  if (!integration || !integration.enabled) return "offline";
  const scenario = integration.mockData?.scenario;
  if (scenario === "slow" || scenario === "degraded" || scenario === "offline" || scenario === "healthy") {
    return scenario as EffectiveStatus;
  }
  return "healthy";
}

/* ═══════════════════════════════════════════ Data ═══ */

const models: Model[] = aureliaModels;

const primaryNav: { page: BrowserPage; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "models", label: "Models" },
  { page: "ownership", label: "Ownership" },
  { page: "support", label: "Support" },
];

const filterOptions: { value: ModelFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "performance", label: "Performance" },
];

const accountTabs: { key: AccountTab; label: string }[] = [
  { key: "vehicle", label: "Vehicle" },
  { key: "subscription", label: "Subscription" },
  { key: "orders", label: "Orders" },
  { key: "preferences", label: "Preferences" },
];

function getPageUrl(page: BrowserPage, model?: Model): string {
  switch (page) {
    case "home":
      return "/";
    case "models":
      return "/models";
    case "model-detail":
      return `/models/${model?.slug ?? ""}`;
    case "ownership":
      return "/ownership";
    case "support":
      return "/support";
    case "my-account":
      return "/account";
  }
}

/* ═══════════════════════════════════════════ Component ═══ */

export function WebBrowserWindow({
  onOpenWindow,
}: {
  onOpenWindow?: (id: ShellAppId) => void;
}) {
  const [activePage, setActivePage] = useState<BrowserPage>("home");
  const [selectedModelSlug, setSelectedModelSlug] = useState(models[0].slug);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [modelFilter, setModelFilter] = useState<ModelFilter>("all");
  const [accountTab, setAccountTab] = useState<AccountTab>("vehicle");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [testDriveSubmitted, setTestDriveSubmitted] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const launcherBtnRef = useRef<HTMLButtonElement>(null);
  const previousPageRef = useRef<BrowserPage>("home");
  const year = useMemo(() => new Date().getFullYear(), []);
  const personalization = useWebPersonalization();
  const integrations = useAgentContextStore((s) => s.context.integrations);
  const customer = useAgentContextStore((s) => s.context.customer);

  const integrationHealth: IntegrationHealth = useMemo(() => {
    const crm = resolveStatus(integrations.crm);
    const orderManagement = resolveStatus(integrations.orderManagement);
    const productCatalog = resolveStatus(integrations.productCatalog);
    const knowledgeBase = resolveStatus(integrations.knowledgeBase);
    const payment = resolveStatus(integrations.payment);
    const notifications = resolveStatus(integrations.notifications);
    const statuses = [crm, orderManagement, productCatalog, knowledgeBase, payment, notifications];
    return {
      crm,
      orderManagement,
      productCatalog,
      knowledgeBase,
      payment,
      notifications,
      hasAnyIssue: statuses.some((s) => s !== "healthy"),
      hasOffline: statuses.some((s) => s === "offline"),
    };
  }, [integrations]);

  const conversationHistory = useAgentContextStore(
    (state) => state.context.conversationHistory,
  );

  const webConversation = useMemo(
    () =>
      conversationHistory.filter(
        (entry: ConversationEntry) => entry.channel === "web",
      ),
    [conversationHistory],
  );

  const selectedModel = useMemo(
    () => models.find((m) => m.slug === selectedModelSlug) ?? models[0],
    [selectedModelSlug],
  );

  const filteredModels = useMemo(() => {
    const base = modelFilter === "all" ? models : models.filter((m) => m.type === modelFilter);
    const badges = personalization.modelBadges;
    if (Object.keys(badges).length === 0) return base;
    return [...base].sort((a, b) => {
      const aViewed = badges[a.slug] ? 1 : 0;
      const bViewed = badges[b.slug] ? 1 : 0;
      return bViewed - aViewed;
    });
  }, [modelFilter, personalization.modelBadges]);

  const logWebSignal = useCallback(
    (eventType: string, detail: string, confidence = 1) => {
      logBehavioralSignal({
        channel: "web",
        eventType,
        detail,
        confidence,
      });
    },
    [],
  );

  const handleNavigate = useCallback(
    (page: BrowserPage, modelSlug?: string) => {
      const from = previousPageRef.current;
      if (modelSlug) setSelectedModelSlug(modelSlug);
      setActivePage(page);
      setPageKey((k) => k + 1);
      scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

      // navigation signal
      logWebSignal(
        "channel_switch",
        `web:${from}->web:${page}${modelSlug ? ` (model:${modelSlug})` : ""}`,
      );

      // page-specific signals
      if (page === "model-detail") {
        const model = models.find((m) => m.slug === (modelSlug ?? previousPageRef.current)) ?? models[0];
        logWebSignal(
          "product_interest",
          `model:${model.slug}|${model.name}`,
        );
      } else if (page === "support") {
        logWebSignal("action_detected", "opened_support");
      } else if (page === "my-account") {
        logWebSignal("action_detected", "opened_account");
      }

      previousPageRef.current = page;
    },
    [logWebSignal],
  );

  const openTestDrive = useCallback(() => {
    setTestDriveSubmitted(false);
    setShowTestDrive(true);
  }, []);

  const handleToggleChat = useCallback(() => {
    setIsChatOpen((open) => !open);
    setChatError(null);
  }, []);

  const handleSendChat = useCallback(
    async (event?: React.FormEvent) => {
      if (event) event.preventDefault();
      const trimmed = chatInput.trim();
      if (!trimmed || isChatSending) return;

      setIsChatSending(true);
      setChatError(null);
      try {
        await runAgentTurn("web", trimmed, {
          currentPage: activePage,
          pageTitle:
            activePage === "model-detail"
              ? selectedModel.name
              : activePage === "models"
                ? "Models"
                : activePage === "ownership"
                  ? "Ownership"
                  : activePage === "support"
                    ? "Support"
                    : activePage === "my-account"
                      ? "My account"
                      : "Home",
        });
        setChatInput("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send message.";
        setChatError(message);
      } finally {
        setIsChatSending(false);
      }
    },
    [activePage, chatInput, isChatSending, selectedModel.name],
  );

  const handleSavePhone = useCallback(() => {
    const trimmed = phoneInput.trim();
    if (!trimmed || trimmed.length < 6) return;
    updateContext("customer", {
      ...useAgentContextStore.getState().context.customer,
      phoneNumber: trimmed,
    });
    logBehavioralSignal({
      channel: "web",
      eventType: "info_revealed",
      detail: "Provided messaging phone number",
      confidence: 1,
    });
    setPhoneInput("");
  }, [phoneInput]);

  const handleHandoffToMessaging = useCallback(() => {
    if (!customer.phoneNumber) return;
    logChannelEvent(
      "whatsapp",
      "channel_switch",
      "Handoff from web to whatsapp (phone verified)",
    );
    onOpenWindow?.("whatsapp");
  }, [onOpenWindow, customer.phoneNumber]);

  const syncedAccountRef = useRef(false);
  useEffect(() => {
    if (activePage !== "my-account" || syncedAccountRef.current) return;
    syncedAccountRef.current = true;

    const customer = useAgentContextStore.getState().context.customer;
    const orderTags = aureliaAccountOrders.map(
      (o) => `Order #${o.id} – ${o.title}`,
    );
    const mergedPurchases = [...customer.purchases];
    for (const tag of orderTags) {
      if (!mergedPurchases.includes(tag)) mergedPurchases.push(tag);
    }

    const subTag = `${aureliaAccountSubscription.planName} subscription`;
    if (!mergedPurchases.includes(subTag)) mergedPurchases.push(subTag);

    const mergedIssues = [...customer.issues];
    const inProgressOrder = aureliaAccountOrders.find((o) => o.status === "In progress");
    if (inProgressOrder) {
      const issueTag = `Open order: ${inProgressOrder.title} – ${inProgressOrder.detail}`;
      if (!mergedIssues.includes(issueTag)) mergedIssues.push(issueTag);
    }

    updateContext("customer", {
      ...customer,
      purchases: mergedPurchases,
      issues: mergedIssues,
    });
  }, [activePage]);

  const appliedPreferredFilter = useRef(false);
  useEffect(() => {
    if (
      activePage === "models" &&
      personalization.preferredFilter &&
      !appliedPreferredFilter.current
    ) {
      setModelFilter(personalization.preferredFilter);
      appliedPreferredFilter.current = true;
    }
  }, [activePage, personalization.preferredFilter]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => setIsHeaderCompact(scroller.scrollTop > 24);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = chatMessagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [webConversation.length, isChatSending]);

  useEffect(() => {
    if (isChatOpen) {
      const raf = requestAnimationFrame(() => chatInputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
    launcherBtnRef.current?.focus();
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      logWebSignal("action_detected", "opened_web_assistant");
    }
  }, [isChatOpen, logWebSignal]);

  const lastMessageTime = useMemo(() => {
    if (!webConversation.length) return null;
    const last = webConversation[webConversation.length - 1];
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(last.timestamp));
  }, [webConversation]);

  /* ──────────────── Home ──────────────── */

  const renderHome = () => (
    <>
      <section className={styles.hero}>
        <img
          src={HERO_IMG}
          alt="Aurelia Motors vehicle on a scenic road"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>{personalization.heroVariant.eyebrow}</p>
          <h1 className={styles.heroTitle}>
            {personalization.heroVariant.title[0]}
            <br />
            {personalization.heroVariant.title[1]}
          </h1>
          <p className={styles.heroCopy}>
            {personalization.heroVariant.subtitle}
          </p>
          <div className={styles.heroActions}>
            {personalization.heroCtas.map((cta, i) => (
              <button
                key={i}
                type="button"
                className={cta.style === "primary" ? styles.btnLight : styles.btnGhost}
                onClick={() => {
                  if (cta.action === "test-drive") {
                    openTestDrive();
                  } else if (cta.action === "view-orders") {
                    handleNavigate("my-account");
                    setAccountTab("orders");
                  } else if (cta.page) {
                    handleNavigate(cta.page, cta.modelSlug);
                  }
                }}
              >
                {cta.label}
                {cta.style === "primary" && <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>Why Aurelia</p>
          <h2 className={styles.sectionHeading}>
            Built for safety, comfort,
            <br />
            and electric confidence.
          </h2>
        </div>
        <div className={styles.highlightGrid}>
          {aureliaHighlights.map((item) => (
            <article key={item.title} className={styles.highlightCard}>
              <h3 className={styles.highlightTitle}>{item.title}</h3>
              <p className={styles.highlightDetail}>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        {(() => {
          const feat = models.find((m) => m.slug === personalization.featuredModelSlug) ?? models[0];
          const isPersonalized = personalization.featuredModelSlug !== models[0].slug;
          return (
            <>
              <div className={styles.sectionIntro}>
                <p className={styles.eyebrowDark}>
                  {isPersonalized ? "Picked for you" : "Featured"}
                </p>
                <h2 className={styles.sectionHeading}>
                  {isPersonalized ? `Continue with the ${feat.name}.` : `Meet the ${feat.name}.`}
                </h2>
              </div>
              <article
                className={styles.featuredCard}
                onClick={() => handleNavigate("model-detail", feat.slug)}
              >
                <div className={styles.featuredImageWrap} style={{ background: feat.gradient }}>
                  <img
                    src={feat.image}
                    alt={feat.name}
                    className={styles.featuredImage}
                    loading="lazy"
                  />
                </div>
                <div className={styles.featuredBody}>
                  <span className={styles.categoryPill}>{feat.category}</span>
                  <h3 className={styles.featuredName}>{feat.name}</h3>
                  <p className={styles.featuredTagline}>
                    {feat.tagline} &middot; {feat.price}
                  </p>
                  <span className={styles.btnOutline}>
                    View details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </article>
            </>
          );
        })()}
      </section>

      <section className={styles.sectionDark}>
        <img
          src={OWNERSHIP_IMG}
          alt="Premium vehicle on the road"
          className={styles.sectionDarkImage}
        />
        <div className={styles.sectionDarkOverlay} />
        <div className={styles.sectionDarkContent}>
          <p className={styles.eyebrow}>Ownership</p>
          <h2 className={styles.sectionHeadingLight}>
            Ownership as refined
            <br />
            as the drive.
          </h2>
          <p className={styles.sectionCopyLight}>
            From service booking to roadside support, every touchpoint is built around clarity and
            care.
          </p>
          <button
            type="button"
            className={styles.btnLight}
            onClick={() => handleNavigate("ownership")}
          >
            Explore ownership <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </>
  );

  /* ──────────────── Models ──────────────── */

  const renderModels = () => (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrowDark}>Current lineup</p>
        <h2 className={styles.sectionHeading}>Choose your Aurelia.</h2>
      </div>
      {(integrationHealth.productCatalog === "slow" || integrationHealth.productCatalog === "degraded") && (
        <div className={styles.pageHint}>
          <span className={styles.pageHintDot} />
          <span>Vehicle data may load slower than usual due to ongoing maintenance.</span>
        </div>
      )}
      {integrationHealth.productCatalog === "offline" && (
        <div className={`${styles.pageHint} ${styles.pageHintDanger}`}>
          <span className={styles.pageHintDot} />
          <span>Vehicle catalog is temporarily unavailable. Pricing and availability may not be current.</span>
        </div>
      )}
      <div className={styles.filterBar}>
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={modelFilter === opt.value ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setModelFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className={styles.modelGrid}>
        {filteredModels.map((model) => (
          <article key={model.slug} className={styles.modelCard}>
            <div className={styles.modelImageWrap} style={{ background: model.gradient }}>
              <img
                src={model.image}
                alt={model.name}
                className={styles.modelImage}
                loading="lazy"
              />
              {personalization.modelBadges[model.slug] && (
                <span className={styles.modelBadge}>
                  {personalization.modelBadges[model.slug]}
                </span>
              )}
            </div>
            <div className={styles.modelCardBody}>
              <span className={styles.categoryPill}>{model.category}</span>
              <h3 className={styles.modelName}>{model.name}</h3>
              <p className={styles.modelTagline}>{model.tagline}</p>
              <div className={styles.modelCardFooter}>
                <span className={styles.modelPrice}>{model.price}</span>
                <button
                  type="button"
                  className={styles.btnSmall}
                  onClick={() => handleNavigate("model-detail", model.slug)}
                >
                  View details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  /* ──────────────── Model Detail ──────────────── */

  const renderModelDetail = () => (
    <>
      <div className={styles.breadcrumb}>
        <button
          type="button"
          onClick={() => handleNavigate("models")}
          className={styles.breadcrumbLink}
        >
          Models
        </button>
        <ChevronRight className="h-3 w-3" />
        <span>{selectedModel.name}</span>
      </div>

      <section className={styles.detailHero} style={{ background: selectedModel.gradient }}>
        <img
          src={selectedModel.image}
          alt={selectedModel.name}
          className={styles.detailHeroImage}
        />
        <div className={styles.detailHeroOverlay} />
        <div className={styles.detailHeroContent}>
          <span className={styles.categoryPillLight}>{selectedModel.category}</span>
          <h1 className={styles.detailTitle}>{selectedModel.name}</h1>
          <p className={styles.detailTagline}>{selectedModel.tagline}</p>
          <p className={styles.detailPrice}>{selectedModel.price}</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>Key specifications</p>
        </div>
        <div className={styles.specsGrid}>
          <div className={styles.specCard}>
            <span className={styles.specValue}>{selectedModel.specs.range}</span>
            <span className={styles.specLabel}>Range</span>
          </div>
          <div className={styles.specCard}>
            <span className={styles.specValue}>{selectedModel.specs.acceleration}</span>
            <span className={styles.specLabel}>0\u2013100 km/h</span>
          </div>
          <div className={styles.specCard}>
            <span className={styles.specValue}>{selectedModel.specs.topSpeed}</span>
            <span className={styles.specLabel}>Top speed</span>
          </div>
          <div className={styles.specCard}>
            <span className={styles.specValue}>{selectedModel.specs.chargeTime}</span>
            <span className={styles.specLabel}>Charge 10\u201380%</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>Features</p>
          <h2 className={styles.sectionHeading}>What sets it apart.</h2>
        </div>
        <ul className={styles.featuresList}>
          {selectedModel.features.map((f) => (
            <li key={f} className={styles.featureItem}>
              <Check className="h-4 w-4 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className={styles.detailActions}>
          <button type="button" className={styles.btnPrimary} onClick={openTestDrive}>
            Book a test drive
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => handleNavigate("support")}
          >
            Have questions? Get support
          </button>
        </div>
      </section>
    </>
  );

  /* ──────────────── Ownership ──────────────── */

  const renderOwnership = () => (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <p className={styles.eyebrowDark}>Ownership</p>
        <h2 className={styles.sectionHeading}>Support that keeps pace with you.</h2>
        <p className={styles.sectionCopy}>
          From the moment you take delivery, every interaction is designed around transparency and
          care.
        </p>
      </div>
      <div className={styles.ownershipGrid}>
        {aureliaOwnershipData.map((card) => (
          <article key={card.title} className={styles.ownershipCard}>
            <h3 className={styles.ownershipTitle}>{card.title}</h3>
            <p className={styles.ownershipSummary}>{card.summary}</p>
            <p className={styles.ownershipDetail}>{card.detail}</p>
          </article>
        ))}
      </div>
      <div className={styles.sectionCta}>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={() => handleNavigate("support")}
        >
          Contact ownership support <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );

  /* ──────────────── Support ──────────────── */

  const renderSupport = () => (
    <>
      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>Support</p>
          <h2 className={styles.sectionHeading}>How can we help today?</h2>
        </div>
        <div className={styles.topicGrid}>
          <article className={styles.topicCard}>
            <Zap className="h-5 w-5" />
            <h3>Charging and battery</h3>
            <p>
              Troubleshoot charging behavior, range variation, and battery health indicators.
            </p>
          </article>
          <article className={styles.topicCard}>
            <Globe2 className="h-5 w-5" />
            <h3>Software and connectivity</h3>
            <p>Resolve app sync, profile pairing, and over-the-air update issues.</p>
          </article>
          <article className={styles.topicCard}>
            <Phone className="h-5 w-5" />
            <h3>Roadside and service</h3>
            <p>Request roadside support, schedule service visits, and manage claims.</p>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>FAQ</p>
          <h2 className={styles.sectionHeading}>Frequently asked questions</h2>
        </div>
        <div className={styles.faqList}>
          {aureliaFaqItems.map((item, i) => (
            <div
              key={i}
              className={`${styles.faqItem} ${expandedFaq === i ? styles.faqItemOpen : ""}`}
            >
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => {
                  const next = expandedFaq === i ? null : i;
                  setExpandedFaq(next);
                  if (next !== null) {
                    logWebSignal(
                      "action_detected",
                      `opened_faq:${item.question.slice(0, 60)}`,
                    );
                  }
                }}
              >
                <span>{item.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 ${styles.faqChevron}`} />
              </button>
              <div className={styles.faqAnswer}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrowDark}>Contact</p>
          <h2 className={styles.sectionHeading}>Reach us directly</h2>
        </div>
        <div className={styles.contactGrid}>
          <button type="button" className={styles.contactCard}>
            <Phone className="h-5 w-5" />
            <span className={styles.contactLabel}>Call us</span>
            <span className={styles.contactValue}>+31 20 555 0199</span>
          </button>
          <button type="button" className={styles.contactCard}>
            <Mail className="h-5 w-5" />
            <span className={styles.contactLabel}>Email us</span>
            <span className={styles.contactValue}>support@aurelia-motors.com</span>
          </button>
          <button type="button" className={styles.contactCard}>
            <MapPin className="h-5 w-5" />
            <span className={styles.contactLabel}>Visit a center</span>
            <span className={styles.contactValue}>Find your nearest location</span>
          </button>
        </div>
      </section>
    </>
  );

  /* ──────────────── My Account ──────────────── */

  const renderMyAccount = () => (
    <section className={styles.section}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className={styles.profileName}>
            {customer.name ?? "Guest"}
          </h2>
          {customer.name ? (
            <div className={styles.profileMeta}>
              {customer.tier ? (
                <span className={styles.tierBadge}>{customer.tier}</span>
              ) : null}
              <span>Member since {aureliaAccountProfile.memberSince}</span>
            </div>
          ) : (
            <div className={styles.profileMeta}>
              <span>Not signed in — demo account view only</span>
            </div>
          )}
          {customer.name && integrationHealth.crm !== "healthy" && (
            <div
              className={`${styles.pageHint} ${
                integrationHealth.crm === "offline" ? styles.pageHintDanger : ""
              }`}
              style={{ padding: "6px 0 0", width: "auto" }}
            >
              <span className={styles.pageHintDot} />
              <span>
                {integrationHealth.crm === "offline"
                  ? "Profile data limited — CRM unavailable"
                  : "Profile data may be delayed"}
              </span>
            </div>
          )}
        </div>
      </div>

      {customer.name ? (
        <>
          <div className={styles.tabBar}>
            {accountTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={accountTab === t.key ? styles.tabActive : styles.tab}
                onClick={() => {
                  setAccountTab(t.key);
                  if (t.key === "orders") {
                    logWebSignal("action_detected", "viewed_orders");
                  }
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {accountTab === "vehicle" && (
            <div className={styles.accountContent}>
              <article className={styles.accountCard}>
                <h3>Primary vehicle</h3>
                <p className={styles.accountCardValue}>{aureliaAccountVehicle.primaryVehicle}</p>
                <p className={styles.accountCardMuted}>{aureliaAccountVehicle.colorAndDelivery}</p>
              </article>
              <article className={styles.accountCard}>
                <h3>Mileage</h3>
                <p className={styles.accountCardValue}>{aureliaAccountVehicle.mileage}</p>
                <p className={styles.accountCardMuted}>{aureliaAccountVehicle.mileageLastSynced}</p>
              </article>
              <article className={styles.accountCard}>
                <h3>Next service</h3>
                <p className={styles.accountCardValue}>{aureliaAccountVehicle.nextService}</p>
                <p className={styles.accountCardMuted}>{aureliaAccountVehicle.nextServiceDetail}</p>
              </article>
            </div>
          )}

          {accountTab === "subscription" && (
            <div className={styles.accountContent}>
              <article className={styles.accountCard}>
                <h3>Current plan</h3>
                <p className={styles.accountCardValue}>{aureliaAccountSubscription.planName}</p>
                <p className={styles.accountCardMuted}>
                  {aureliaAccountSubscription.price} &middot; {aureliaAccountSubscription.renewsOn}
                </p>
              </article>
              <article className={styles.accountCard}>
                <h3>Includes</h3>
                <ul className={styles.accountList}>
                  {aureliaAccountSubscription.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          )}

          {accountTab === "orders" && (
            <div className={styles.accountContent}>
              {(integrationHealth.orderManagement === "degraded" ||
                integrationHealth.orderManagement === "slow") && (
                <div className={styles.pageHint} style={{ paddingBottom: 8 }}>
                  <span className={styles.pageHintDot} />
                  <span>
                    Order updates may be delayed. Status shown may not reflect the latest state.
                  </span>
                </div>
              )}
              {integrationHealth.orderManagement === "offline" && (
                <div
                  className={`${styles.pageHint} ${styles.pageHintDanger}`}
                  style={{ paddingBottom: 8 }}
                >
                  <span className={styles.pageHintDot} />
                  <span>Order management is offline. Order details are temporarily unavailable.</span>
                </div>
              )}
              <article
                className={`${styles.accountCard} ${
                  integrationHealth.orderManagement === "offline" ? styles.orderCardDegraded : ""
                }`}
              >
                <div className={styles.orderHeader}>
                  <h3>Order #AM-44281</h3>
                  <span className={styles.statusBadge}>In progress</span>
                </div>
                <p className={styles.accountCardValue}>Astra X &middot; Delivery prep</p>
                <p className={styles.accountCardMuted}>ETA 5 days &middot; Tracking available</p>
              </article>
              <article
                className={`${styles.accountCard} ${
                  integrationHealth.orderManagement === "offline" ? styles.orderCardDegraded : ""
                }`}
              >
                <div className={styles.orderHeader}>
                  <h3>Order #AM-43802</h3>
                  <span className={styles.statusBadgeGreen}>Confirmed</span>
                </div>
                <p className={styles.accountCardValue}>HomeCharge Pro installation</p>
                <p className={styles.accountCardMuted}>Scheduled for Tuesday, Mar 10</p>
              </article>
              <article
                className={`${styles.accountCard} ${
                  integrationHealth.orderManagement === "offline" ? styles.orderCardDegraded : ""
                }`}
              >
                <div className={styles.orderHeader}>
                  <h3>Order #AM-43117</h3>
                  <span className={styles.statusBadgeGreen}>Complete</span>
                </div>
                <p className={styles.accountCardValue}>Connected Care renewal</p>
                <p className={styles.accountCardMuted}>Paid successfully &middot; Feb 14, 2026</p>
              </article>
            </div>
          )}

          {accountTab === "preferences" && (
            <div className={styles.accountContent}>
              {integrationHealth.notifications !== "healthy" && (
                <div
                  className={`${styles.pageHint} ${
                    integrationHealth.notifications === "offline" ? styles.pageHintDanger : ""
                  }`}
                  style={{ paddingBottom: 8 }}
                >
                  <span className={styles.pageHintDot} />
                  <span>
                    {integrationHealth.notifications === "offline"
                      ? "Notification service is offline. Alerts may not be delivered."
                      : "Notification delivery may be delayed."}
                  </span>
                </div>
              )}
              <article className={styles.accountCard}>
                <h3>Notifications</h3>
                <p className={styles.accountCardValue}>{aureliaAccountPreferences.notifications}</p>
                <p className={styles.accountCardMuted}>
                  {aureliaAccountPreferences.notificationsDetail}
                </p>
              </article>
              <article className={styles.accountCard}>
                <h3>Preferred center</h3>
                <p className={styles.accountCardValue}>{aureliaAccountPreferences.preferredCenter}</p>
                <p className={styles.accountCardMuted}>
                  {aureliaAccountPreferences.preferredCenterAddress}
                </p>
              </article>
              <article className={styles.accountCard}>
                <h3>Language</h3>
                <p className={styles.accountCardValue}>{aureliaAccountPreferences.language}</p>
                <p className={styles.accountCardMuted}>
                  {aureliaAccountPreferences.languageDetail}
                </p>
              </article>
            </div>
          )}
        </>
      ) : (
        <div className={styles.accountContent}>
          <p className={styles.accountCardMuted}>
            You're browsing as a guest. In this demo, account details are only available after you
            select a persona in the Customer Profile Simulator.
          </p>
        </div>
      )}
    </section>
  );

  /* ──────────────── Test Drive Modal ──────────────── */

  const renderTestDriveModal = () => {
    if (!showTestDrive) return null;

    return (
      <div className={styles.modalOverlay} onClick={() => setShowTestDrive(false)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Book a test drive</h2>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowTestDrive(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {testDriveSubmitted ? (
            <div className={styles.thankYou}>
              <div className={styles.thankYouIcon}>
                <Check className="h-6 w-6" />
              </div>
              <h3>Request received</h3>
              <p>We&rsquo;ll contact you within 24 hours to confirm your appointment.</p>
              <button
                type="button"
                className={styles.btnOutline}
                onClick={() => setShowTestDrive(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <form
              className={styles.modalForm}
              onSubmit={(e) => {
                e.preventDefault();
                setTestDriveSubmitted(true);
              }}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Alexandra Voss"
                  defaultValue={personalization.preFill.name ?? ""}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="alexandra@example.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Preferred model</label>
                <select
                  className={styles.formSelect}
                  defaultValue={personalization.preFill.modelSlug ?? selectedModel.slug}
                >
                  {models.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Preferred date</label>
                <input type="date" className={styles.formInput} required />
              </div>
              {(integrationHealth.payment === "degraded" || integrationHealth.payment === "offline") && (
                <div className={styles.testDrivePaymentHint}>
                  <span className={styles.pageHintDot} />
                  {integrationHealth.payment === "offline"
                    ? "Payment processing is currently unavailable. You may experience issues confirming your booking."
                    : "Payment processing is experiencing delays. Confirmation may take longer than usual."}
                </div>
              )}
              <button type="submit" className={styles.btnPrimary}>
                Submit request
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  /* ──────────────── Page Router ──────────────── */

  const renderPage = () => {
    switch (activePage) {
      case "models":
        return renderModels();
      case "model-detail":
        return renderModelDetail();
      case "ownership":
        return renderOwnership();
      case "support":
        return renderSupport();
      case "my-account":
        return renderMyAccount();
      default:
        return renderHome();
    }
  };

  /* ──────────────── Render ──────────────── */

  const resolveNavTarget = useCallback(
    (target: string) => {
      if (target.startsWith("model-detail/")) {
        const slug = target.split("/")[1] || models[0]?.slug;
        if (slug) handleNavigate("model-detail", slug);
        return;
      }
      const page = target as BrowserPage;
      if (["home", "models", "ownership", "support", "my-account"].includes(page)) {
        handleNavigate(page);
      }
    },
    [handleNavigate],
  );

  const resolveAction = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "book-test-drive":
          openTestDrive();
          break;
        case "open-account":
          handleNavigate("my-account");
          break;
        case "view-orders":
          handleNavigate("my-account");
          setAccountTab("orders");
          break;
        case "go-support":
          handleNavigate("support");
          break;
      }
    },
    [handleNavigate, openTestDrive],
  );

  const renderAssistantContent = (segments: RichSegment[]) => {
    const elements: React.ReactNode[] = [];
    let inlineBuffer: React.ReactNode[] = [];

    const flushInline = () => {
      if (inlineBuffer.length > 0) {
        elements.push(
          <span key={`inline-${elements.length}`} className={styles.richTextBlock}>
            {inlineBuffer}
          </span>,
        );
        inlineBuffer = [];
      }
    };

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (segment.type === "text") {
        inlineBuffer.push(<span key={`t-${i}`}>{segment.content}</span>);
        continue;
      }

      if (segment.type === "link") {
        inlineBuffer.push(
          <button
            key={`link-${i}`}
            type="button"
            className={styles.richLink}
            onClick={() => resolveNavTarget(segment.target)}
          >
            {segment.label}
          </button>,
        );
        continue;
      }

      if (segment.type === "action") {
        inlineBuffer.push(
          <button
            key={`action-${i}`}
            type="button"
            className={styles.richAction}
            onClick={() => resolveAction(segment.actionId)}
          >
            {segment.label}
          </button>,
        );
        continue;
      }

      flushInline();

      if (segment.type === "model-card") {
        const model = models.find((m) => m.slug === segment.slug);
        if (!model) {
          inlineBuffer.push(<span key={`unknown-${i}`}>[Unknown model: {segment.slug}]</span>);
          continue;
        }
        elements.push(
          <button
            key={`model-${i}`}
            type="button"
            className={styles.richModelCard}
            onClick={() => handleNavigate("model-detail", model.slug)}
          >
            <span className={styles.richModelName}>{model.name}</span>
            <span className={styles.richModelMeta}>
              {model.category} · {model.specs.range} · {model.price}
            </span>
          </button>,
        );
        continue;
      }

      if (segment.type === "info") {
        elements.push(
          <div key={`info-${i}`} className={styles.richInfo}>
            <div className={styles.richInfoTitle}>{segment.title}</div>
            <div className={styles.richInfoBody}>{segment.content}</div>
          </div>,
        );
      }
    }

    flushInline();

    return elements;
  };

  return (
    <section className={styles.windowRoot}>
      <header className={styles.browserChrome}>
        <div className={styles.browserRow}>
          <button type="button" className={styles.chromeButton} aria-label="Reload">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <div className={styles.urlBar}>
            <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">
              {`https://www.aurelia-motors.com${getPageUrl(activePage, selectedModel)}`}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.siteBody}>
        <div ref={scrollerRef} className={styles.siteScroller}>
        <header
          className={`${styles.topNav} ${isHeaderCompact ? styles.topNavCompact : ""}`}
        >
          <div className={styles.topNavInner}>
            <button
              type="button"
              className={styles.brandMark}
              aria-label="Aurelia Motors homepage"
              onClick={() => handleNavigate("home")}
            >
              Aurelia Motors
            </button>
            <nav className={styles.primaryLinks} aria-label="Primary">
              {primaryNav.map(({ page, label }) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handleNavigate(page)}
                  className={
                    activePage === page ||
                    (page === "models" && activePage === "model-detail")
                      ? styles.navLinkActive
                      : styles.navLink
                  }
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className={styles.navRight}>
              <button
                type="button"
                className={
                  activePage === "my-account" ? styles.accountBtnActive : styles.accountBtn
                }
                onClick={() => handleNavigate("my-account")}
              >
                <User className="h-3.5 w-3.5" />
                <span className={styles.accountLabel}>Account</span>
              </button>
              <button type="button" className={styles.ctaBtn} onClick={openTestDrive}>
                Test drive
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {personalization.banner && (
            <motion.div
              key="smart-banner"
              className={styles.smartBanner}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.smartBannerInner}>
                <span className={styles.smartBannerText}>
                  {personalization.banner.message}
                </span>
                {personalization.banner.action && (
                  <button
                    type="button"
                    className={styles.smartBannerAction}
                    onClick={() => {
                      const act = personalization.banner!.action!;
                      handleNavigate(act.page, act.modelSlug);
                    }}
                  >
                    {personalization.banner.action.label}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {integrationHealth.hasAnyIssue && (
            <motion.div
              key="system-health"
              className={`${styles.systemHealthStrip} ${integrationHealth.hasOffline ? styles.systemHealthStripDanger : ""}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.systemHealthInner}>
                <span className={styles.systemHealthDot} />
                <span>
                  {integrationHealth.hasOffline
                    ? "Some services are temporarily unavailable. Certain features may be limited."
                    : "Some services are experiencing delays. Information may take longer to load."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main key={pageKey} className={styles.pageContent}>
          {renderPage()}
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerCol}>
              <p className={styles.footerBrand}>Aurelia Motors</p>
              <p className={styles.footerCopy}>Premium mobility designed for modern life.</p>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Explore</p>
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleNavigate("models")}
              >
                Models
              </button>
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleNavigate("ownership")}
              >
                Ownership
              </button>
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleNavigate("support")}
              >
                Support
              </button>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Account</p>
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => handleNavigate("my-account")}
              >
                My account
              </button>
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => {
                  handleNavigate("my-account");
                  setAccountTab("orders");
                }}
              >
                Orders
              </button>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Legal</p>
              <span className={styles.footerLink}>Privacy</span>
              <span className={styles.footerLink}>Accessibility</span>
              <span className={styles.footerLink}>Sustainability</span>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {year} Aurelia Motors. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {renderTestDriveModal()}

      <AnimatePresence mode="wait">
        {!isChatOpen && (
          <motion.div
            key="chat-launcher"
            className={styles.chatLauncher}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              ref={launcherBtnRef}
              type="button"
              className={styles.chatLauncherButton}
              onClick={handleToggleChat}
            >
              <span className={styles.chatLauncherBadge}>
                <MessageCircle className="h-3 w-3" />
              </span>
              <span>Ask Aurelia</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.aside
            key="chat-panel"
            className={styles.chatPanel}
            aria-label="Aurelia assistant chat"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <div className={styles.chatHeaderAvatar}>
                  <MessageCircle className="h-3.5 w-3.5" />
                </div>
                <div className={styles.chatHeaderTitle}>
                  <span>Aurelia</span>
                  <span>
                    <span className={styles.chatHeaderStatusDot} />
                    Online
                  </span>
                </div>
              </div>
              <div className={styles.chatHeaderRight}>
                {webConversation.length > 0 && customer.phoneNumber && !isChatSending && (
                  <button
                    type="button"
                    className={styles.chatHeaderHandoffBtn}
                    onClick={handleHandoffToMessaging}
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    Continue in Messaging
                  </button>
                )}
                <button
                  type="button"
                  className={styles.chatHeaderClose}
                  onClick={handleToggleChat}
                  aria-label="Close chat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </header>
            <div ref={chatMessagesRef} className={styles.chatMessages}>
              {webConversation.length === 0 && (
                <div className={styles.chatWelcome}>
                  <div className={styles.chatWelcomeIcon}>
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <h3 className={styles.chatWelcomeHeading}>How can I help?</h3>
                  <p className={styles.chatWelcomeBody}>
                    Tell me what you need and I’ll keep track of the details as you move between
                    channels.
                  </p>
                </div>
              )}
              {webConversation.map((entry, index) => {
                const key = `${entry.channel}-${entry.timestamp}-${index}`;
                const isUser = entry.role === "user";
                if (isUser) {
                  return (
                    <div key={key} className={`${styles.chatMessage} ${styles.chatMessageUser}`}>
                      {entry.content}
                    </div>
                  );
                }

                const segments = parseRichMessage(entry.content);
                return (
                  <div key={key} className={`${styles.chatMessage} ${styles.chatMessageAssistant}`}>
                    {renderAssistantContent(segments)}
                  </div>
                );
              })}
              {lastMessageTime && (
                <div className={styles.chatTimestamp}>Last updated {lastMessageTime}</div>
              )}
            </div>
            {chatError && <div className={styles.chatError}>{chatError}</div>}
            {isChatSending && (
              <div className={styles.chatThinking}>
                <span className={styles.chatThinkingDot} />
                <span className={styles.chatThinkingDot} />
                <span className={styles.chatThinkingDot} />
              </div>
            )}
            {webConversation.length > 0 && !customer.phoneNumber && (
              <div className={styles.chatPhoneCaptureStrip}>
                <div className={styles.chatPhoneCaptureWrap}>
                  <input
                    type="tel"
                    className={styles.chatPhoneCaptureInput}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Phone number for messaging"
                  />
                  <span className={styles.chatPhoneCaptureHint}>
                    Enter your number to continue the conversation in the messaging app
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.chatPhoneCaptureBtn}
                  onClick={handleSavePhone}
                  disabled={!phoneInput.trim() || phoneInput.trim().length < 6}
                >
                  Save & continue
                </button>
              </div>
            )}
            <form className={styles.chatInputBar} onSubmit={handleSendChat}>
              <input
                ref={chatInputRef}
                className={styles.chatInput}
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask Aurelia…"
                disabled={isChatSending}
              />
              <button
                type="submit"
                className={styles.chatSendButton}
                disabled={isChatSending || !chatInput.trim()}
              >
                <SendHorizonal className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
      </div>
    </section>
  );
}
