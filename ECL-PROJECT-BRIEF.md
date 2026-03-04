# ECL (Experience Continuity Layer) — Complete Project Documentation

> This document is a comprehensive brief for an AI agent tasked with planning a fresh rebuild of the ECL project. It captures the full architecture, every design decision, what works well, what to improve, and all reusable patterns from the current PoC.

---

## 1. What This Project Is

The ECL is a **virtual OS desktop environment** that simulates multi-channel customer service for **pluggable business scenarios** across different industries. A single AI agent orchestrates conversations across 5 channels (web chat, IVR phone, WhatsApp, kiosk, email), maintaining context continuity so a customer can switch channels without repeating themselves.

It runs as a **Next.js 16 single-page app** where the entire UI is a macOS-style desktop with draggable/resizable windows. Each window is either a **channel simulation** (web browser, WhatsApp, etc.) or a **tooling/control panel** (agent config, context inspector, customer profile simulator, data integrations, design system catalog).

The default demo scenario is built around "Aurelia Motors" — a fictional EV car company with 6 vehicle models, account data, orders, subscriptions, support topics, and FAQ content — but the architecture is intended to support swapping in other domains (e.g., retail, banking, travel, telecom) without changing the core OS, agent, or channel logic.

---

## 2. Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | Single-page app, no SSR for the OS shell |
| UI | React 19, TypeScript 5 | All client components |
| State | Zustand 5 + Immer | Single global `AgentContext` store |
| Validation | Zod 3 | Runtime schema validation for all context mutations |
| Styling | Tailwind 4 + CSS Modules + CSS custom properties | Mixed approach (see improvement notes) |
| Icons | Lucide React | Consistent icon library |
| Animation | Motion (framer-motion successor) | Window transitions, chat panel, banners |
| Wallpaper | @paper-design/shaders-react | Animated WebGL mesh gradient backgrounds |
| AI | Direct HTTP fetch per provider | No SDK wrappers — OpenAI, Anthropic, Google, HuggingFace, DeepSeek |
| Database | None | Everything is in-memory via Zustand |

### Dependencies (package.json)

```json
{
  "@paper-design/shaders-react": "^0.0.71",
  "ai": "^6.0.103",
  "immer": "^11.1.4",
  "lucide-react": "^0.576.0",
  "motion": "^12.34.3",
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "zod": "^3.25.76",
  "zustand": "^5.0.11"
}
```

Note: The `ai` package (Vercel AI SDK) is installed but **never used in code**. It can be removed or actually leveraged in the rebuild.

---

## 3. Architecture Overview

### 3.1 The Central Data Model: `AgentContext`

The entire system revolves around a single Zustand store holding an `AgentContext` object. This is the **shared memory** that every channel reads and writes to.

**Source of truth:** `src/core/agent-context/types.ts`

```typescript
interface AgentContext {
  customer: AgentCustomer;
  agentConfig: AgentConfig;
  conversationHistory: ConversationEntry[];
  channelHistory: ChannelHistoryEntry[];
  activeChannel: string;
  signals: BehavioralSignal[];
  integrations: IntegrationsMap;
  pendingActions: PendingAction[];
  topics: string[];
  contextSummary: string;
  extractionHistory: ExtractionRecord[];
}
```

#### `AgentCustomer` (12 fields)

```typescript
interface AgentCustomer {
  name: string | null;
  age: number | null;
  language: string | null;
  preferredChannel: AgentChannel | null;
  tier: string | null;
  phoneNumber: string | null;
  categories: string[];            // e.g. "high value", "EV enthusiast"
  intent: string | null;           // AI-inferred current goal
  emotionalState: string | null;   // AI-inferred emotion
  device: string | null;
  purchases: string[];
  issues: string[];
}
```

#### `AgentConfig` (14 fields)

```typescript
interface AgentConfig {
  provider: AgentProvider;         // "openai" | "anthropic" | "google" | "huggingface" | "deepseek"
  apiKey: string;
  model: string;
  temperature: number;             // 0–2
  maxOutputTokens: number;         // 64–4096
  topP: number;                    // 0–1
  modes: AgentMode[];              // "Observant" | "Contextual" | "Dedicated" | "Autonomous"
  tone: AgentTone;                 // "empathetic" | "professional" | "friendly" | "direct"
  verbosity: AgentVerbosity;       // "concise" | "balanced" | "detailed"
  proactivity: number;             // 1 (reactive) to 5 (autonomous)
  channels: AgentChannel[];        // enabled channels: "web" | "ivr" | "whatsapp" | "kiosk" | "email"
  preferredEscalationChannel: AgentChannel;
  rememberCustomerAcrossSessions: boolean;
  shareContextAcrossChannels: boolean;
  paused: boolean;
}
```

#### Behavioral signals (13 types)

```typescript
type SignalType =
  | "frustration" | "urgency" | "satisfaction" | "confusion"
  | "escalation_hint" | "product_interest" | "churn_risk"
  | "loyalty_signal" | "comparison_shopping" | "repeat_issue"
  | "action_detected" | "channel_switch" | "info_revealed";

interface BehavioralSignal {
  channel: string;
  eventType: SignalType | string;
  detail: string;
  confidence: number;              // 0–1
  timestamp: string;
}
```

#### Context extraction output

After each turn, the AI extracts structured context:

```typescript
interface ExtractedContext {
  inferredIntent: string | null;
  inferredEmotionalState: string | null;
  inferredName: string | null;
  inferredLanguage: string | null;
  inferredPhoneNumber: string | null;
  signals: ExtractedSignal[];
  topics: string[];
  mentionedProducts: string[];
  mentionedOrderIds: string[];
  actions: ExtractedAction[];
  contextSummary: string;          // Running 1–2 sentence summary
}
```

#### Mock integrations (6 data sources)

```typescript
type IntegrationsMap = Record<string, IntegrationConfig>;

interface IntegrationConfig {
  enabled: boolean;
  latencyMs: number;
  mockData: Record<string, unknown>;
}
```

Default integrations: CRM, Order Management, Product Catalog, Knowledge Base, Payment, Notifications. Each can be set to healthy/slow/degraded/offline scenarios.

---

### 3.2 Synchronized Multi-File Contract

Modifying `AgentContext` requires updating **5 files in strict order**. Skipping a step causes runtime bugs or silent data loss.

| Step | File | What to do |
|---|---|---|
| 1 | `types.ts` | Add/change the TypeScript interface |
| 2 | `schema.ts` | Update the matching Zod schema |
| 3 | `store.ts` | Update `initialContext` default + add store actions |
| 4 | `prompt-builder.ts` | Include the field in `buildSystemPrompt()` |
| 5 | UI component | Wire to a control or display |

Store actions follow the Immer `produce` pattern:

```typescript
actionName: (args) =>
  set((state) => ({
    context: produce(state.context, (draft) => {
      draft.field = newValue;
    }),
  })),
```

Each store method also has a standalone exported helper:

```typescript
export function actionName(args) {
  useAgentContextStore.getState().actionName(args);
}
```

---

### 3.3 AI Integration Flow

Every user message follows this flow:

```
User types message in channel UI
        │
        ▼
runAgentTurn(channel, message)           [agent-module.ts]
        │
        ├─ 1. Validate channel is enabled in agentConfig.channels
        ├─ 2. logMessage(channel, "user", message) → Zustand store
        ├─ 3. Scope history:
        │     • shareContextAcrossChannels=true  → all messages
        │     • shareContextAcrossChannels=false → current channel only
        ├─ 4. POST /api/agent/respond
        │     ├─ Build system prompt via buildSystemPrompt(context, channelMetadata)
        │     ├─ Call requestAIReply() → direct HTTP to provider
        │     └─ Return assistantReply
        ├─ 5. logMessage(channel, "assistant", reply) → Zustand store
        └─ 6. Fire-and-forget: runContextExtraction(channel)
              ├─ POST /api/agent/extract-context
              ├─ AI analyzes last 6 messages
              ├─ Extracts: intent, emotion, name, language, phone, signals,
              │            topics, products, orders, actions, summary
              ├─ Validates with extractedContextSchema (Zod)
              └─ applyExtractedContext() merges into store
```

Key design decisions in this flow:
- The system prompt is rebuilt from scratch on every turn (no caching)
- Context extraction is non-blocking — a failure never breaks the main flow
- Both API calls (respond + extract) use the same provider/model from agentConfig
- The extraction prompt is a separate, structured JSON-output prompt analyzing only the last 6 messages

---

### 3.4 System Prompt Builder

`buildSystemPrompt()` in `src/core/agent-context/prompt-builder.ts` constructs a comprehensive prompt from the full `AgentContext`. The prompt includes, in order:

1. **Core identity**: "You are an orchestration agent for a multi-channel continuity system."
2. **Agent config summary**: active modes, tone, verbosity, proactivity, escalation channel, memory settings
3. **Behavioral rules**: tone instruction, verbosity instruction, proactivity instructions (1–5), mode-specific rules (Observant/Contextual/Dedicated/Autonomous)
4. **Customer profile**: all 12 fields, with "Unknown" for nulls
5. **Unknown context instructions**: if the customer is mostly anonymous, the prompt instructs the agent not to interrogate but to gather context organically
6. **Full conversation history**: every message, formatted as `[timestamp] (channel/role) content`
7. **Integration health status**: per-integration status (Healthy/Slow/Degraded/Offline) with behavioral instructions for impaired services
8. **Pending actions**: timestamped list of detected customer needs
9. **Accumulated topics**: extracted conversation themes
10. **Context summary**: AI-generated running summary from prior extractions
11. **Behavioral signals**: last 20 signals, filtered to active channel + high-priority cross-channel signals
12. **Channel handoff history**: last 5 channel switches
13. **Knowledge base** (web/WhatsApp only): domain-specific scenario data (e.g., Aurelia Motors models, ownership, support, FAQ, account in the default automotive pack)
14. **Web-specific block** (web only): current page context, rich UI marker syntax (model cards, links, actions, info callouts, handoff cards), channel switching rules
15. **Messaging-specific block** (WhatsApp only): plain-text-only rules, no re-introduction after handoff

The mode-specific instructions are notable:

| Mode | Instruction |
|---|---|
| Observant | "Reference at least one concrete fact from known context in each response" |
| Contextual | "Connect the current request to prior conversation, pending actions, and customer profile" |
| Dedicated | "Keep ownership of the issue until resolved, summarize progress, and state the next step" |
| Autonomous | "Propose and sequence concrete next actions instead of waiting for broad user direction" |

Proactivity levels (1–5) control how much unsolicited guidance the agent provides, from strictly reactive (level 1) to "default to a concrete action plan and immediate execution-oriented guidance" (level 5).

---

### 3.5 Provider Client

`src/core/ai/client.ts` implements direct HTTP calls to 5 providers with no SDK wrappers:

| Provider | Function | Endpoint | Auth | Notes |
|---|---|---|---|---|
| OpenAI | `callOpenAI` | `api.openai.com/v1/chat/completions` | Bearer token | Standard chat format |
| Anthropic | `callAnthropic` | `api.anthropic.com/v1/messages` | `x-api-key` header | Requires alternating user/assistant roles only |
| Google | `callGoogle` | `generativelanguage.googleapis.com/v1beta` | URL param `key=` | Gemini format with `systemInstruction` |
| HuggingFace | `callHuggingFace` | `router.huggingface.co/v1/chat/completions` | Bearer token | OpenAI-compatible format |
| DeepSeek | `callDeepSeek` | `api.deepseek.com/chat/completions` | Bearer token | OpenAI-compatible format |

Default models per provider:

```typescript
const providerModels = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-6",
  google: "gemini-2.5-flash",
  huggingface: "meta-llama/Meta-Llama-3-8B-Instruct",
  deepseek: "deepseek-reasoner",
};
```

Error handling pattern: each provider function throws `ProviderRequestError` with the HTTP status code. Errors are never masked with simulated responses. The API key is validated before any call — empty key throws immediately.

---

### 3.6 Rich Message System

The web chat supports rich UI markers that the AI can embed in its responses. The parser is in `src/lib/rich-message-parser.ts`.

**Marker syntax:**

| Marker | Example | Renders as |
|---|---|---|
| `{{model:slug}}` | `{{model:astra-x}}` | Inline model card (name, category, range, price) |
| `{{link:label\|page}}` | `{{link:Browse models\|models}}` | Clickable link navigating the simulated site |
| `{{action:label\|action-id}}` | `{{action:Book a test drive\|book-test-drive}}` | Action button triggering an in-app action |
| `{{info:title\|content}}` | `{{info:Delivery update\|Your order is on track}}` | Info callout box |
| `{{handoff:channel\|message}}` | `{{handoff:whatsapp\|I can continue helping you on WhatsApp}}` | Channel switch card with confirmation |

Valid model slugs: `astra-x`, `orion-s`, `atlas-tour`, `nova-crossover`, `helios-gt`, `lumen-e`.
Valid page targets: `home`, `models`, `model-detail/SLUG`, `ownership`, `support`, `my-account`.
Valid action IDs: `book-test-drive`, `open-account`, `view-orders`, `go-support`.
Valid handoff channels: `whatsapp`, `ivr`, `kiosk`, `email`.

The parser uses regex to find `{{...}}` markers and returns a typed `RichSegment[]` array:

```typescript
type RichSegment =
  | { type: "text"; content: string }
  | { type: "model-card"; slug: string }
  | { type: "link"; label: string; target: string }
  | { type: "action"; label: string; actionId: string }
  | { type: "info"; title: string; content: string }
  | { type: "handoff"; channel: string; message: string };
```

---

### 3.7 Channel Handoff Flow

When the AI suggests a handoff (e.g., "Continue on WhatsApp"):

1. User clicks the handoff card rendered in the web chat
2. `logChannelEvent()` records the switch in `channelHistory` (from → to) and adds a `channel_switch` signal
3. Target channel window opens via `onOpenWindow(appId)` and gets a notification badge via `onNotifyWindow(appId)`
4. `runHandoffGreeting()` generates a context-aware greeting on the new channel:
   - Builds a special greeting prompt: 1–2 sentences, acknowledge the previous channel, reference the specific topic, no rich markers, don't ask them to repeat anything
   - Posts to `/api/agent/respond` with the greeting prompt appended to the system prompt
   - Logs the greeting as an assistant message on the target channel
5. The target channel window (e.g., WhatsApp) shows a `HandoffBanner` with the from-channel name, context summary, and timestamp

The phone number collection flow: if the customer wants to switch to WhatsApp or IVR and their phone number is unknown, the web chat agent is instructed to ask for it conversationally within the same reply, then use the handoff marker only after the customer provides it.

---

## 4. UI Architecture

### 4.1 Virtual OS Shell

The root component is `VirtualOS` in `src/components/shell/virtual-os.tsx`. It renders:

- **Wallpaper layer**: animated mesh gradient backgrounds (3 options: Mist/Twilight/Aurora) using `@paper-design/shaders-react`. Each has a tone (light/dark) that affects the menu bar and taskbar text color.
- **Menu bar** (top): "ECL" branding badge + wallpaper switcher button + live clock
- **Window layer** (middle): all open, non-minimized windows rendered with `DesktopWindow`, sorted by z-index
- **Taskbar** (bottom): macOS-style dock with app icons. Features:
  - Spring hover animation (scale + lift)
  - Running indicator dot below open apps
  - Notification badge (green dot) for incoming handoffs
  - Tooltip on hover showing window title
  - Click toggles minimize/open

### 4.2 Window Manager

`src/components/shell/window-manager/use-window-manager.ts` manages window state:

- **State per window**: `id`, `isOpen`, `isMinimized`, `hasNotification`, `position {x, y}`, `size {width, height}`, `zIndex`
- **Z-index stacking**: most recently focused window gets the next z-index
- **Drag**: pointer-down on title bar starts drag mode, pointer-move updates position
- **Resize**: pointer-down on bottom-right corner starts resize mode, enforces min 320×220
- **Size persistence**: window sizes saved to localStorage, restored on mount
- **Notification**: `notifyWindow(id)` sets `hasNotification: true` (cleared on focus/open)

### 4.3 Desktop Window Component

`src/components/shell/windows/desktop-window.tsx` renders each window:

- macOS-style title bar with red close button and amber minimize button (icons appear on hover)
- Title text centered in the title bar
- Content area fills the remaining height with overflow auto
- Motion enter/exit animations (fade + scale + slide)
- Glass aesthetic: `bg-white/96 backdrop-blur`, subtle border and shadow

### 4.4 Windows (10 total)

#### Channel Windows

**`web-browser` (1595 lines)** — The largest and most complex component. A full simulated Aurelia Motors website with:
- Browser chrome (URL bar, reload button, lock icon)
- Site navigation (Home, Models, Ownership, Support, My Account)
- 6 complete pages:
  - **Home**: hero section (personalized), "Why Aurelia" highlights, featured model (personalized), ownership teaser
  - **Models**: filter bar (All/Electric/Hybrid/Performance), model grid with cards, "Viewed" badges
  - **Model Detail**: breadcrumb, hero with gradient, specs grid, features list, test drive + support CTAs
  - **Ownership**: 4 service category cards
  - **Support**: 3 topic cards, FAQ accordion (5 items), 3 contact cards (phone, email, center)
  - **My Account**: profile header (uses customer name/tier from context), 4 tabs (Vehicle, Subscription, Orders, Preferences)
- Smart banner (personalized based on context)
- System health strip (shows when integrations are degraded/offline)
- Integration health affects visible UI (order management offline → orders tab shows degraded state, etc.)
- Embedded chat widget:
  - "Ask Aurelia" launcher button
  - Slide-in chat panel with header, message list, typing indicator, error display, input bar
  - Rich message rendering (model cards, links, actions, info callouts, handoff cards)
  - Channel handoff: clicking a handoff card triggers the full handoff flow (open target window, generate greeting)
- Test drive booking modal with personalized pre-fill
- Web personalization engine integration (see section 4.5)
- Behavioral signal logging: navigation, model views, support visits, FAQ opens, chat opens, order views

**`whatsapp` (217 lines)** — Wrapped in a `PhoneFrame` (iOS device simulation). Features:
- Header with avatar, "Messaging" title, phone number display, typing indicator
- Handoff banner when arriving from another channel
- Message list with timestamps (5-min gap threshold), user/assistant bubbles
- "Connecting..." state when awaiting a handoff greeting
- Empty state with instructions
- Channel enabled/disabled check with notice
- Plain text only (no rich markers)

**`ivr-phone`, `kiosk`, `email-client`** — All render `PlaceholderWindowContent` (title + description). Not yet implemented.

#### Tool Windows

**`agent-control-center` (695 lines)** — 3 tabs:
- **Controls**: Provider selection (5 provider option cards), API key input (password field), model override input, temperature/topP/maxTokens sliders (in accordion), tone selector (4 segments), verbosity selector (3 segments), proactivity slider (1–5 with labels), active modes (4 option cards), channel toggles (5 switches), escalation channel selector, active send channel selector, memory & session toggles, "Start new session" button
- **Chat**: context tag bar (provider/channel/tone/proactivity/modes), full conversation history (color-coded by role), typing indicator, message input with send button. Messages go through `runAgentTurn()` with the selected active channel.
- **Comparison**: A/B testing tool. Step 1: enter a test prompt + select channel. Step 2: save config snapshots (variants) with names. Step 3: run comparison — sends the same prompt to each variant sequentially, displays outputs side-by-side with word/char counts.

**`context-inspector` (679 lines)** — 4 tabs:
- **Live**: recent channel switches, agent understanding summary (amber callout), intent + emotion display, topics chips, recent signals (last 5, with confidence bars), pending actions, extraction turn count
- **Signals**: summary bar (signal type counts as colored chips), full signal list (newest first) with detail, confidence, channel, timestamp
- **Profile**: customer profile rows (with AI-enrichment sparkle indicator for inferred fields), categories, purchases, issues, channel history
- **Timeline**: vertical timeline of extraction records. Each entry shows turn index, channel, timestamp, collapsible detail with inferred intent/emotion, topics, signals with confidence bars, detected actions

**`customer-profile-simulator` (398 lines)** — 4 persona presets as option cards:
- Anonymous Visitor (all null)
- Frustrated Owner (Alexandra Voss, VIP, delivery issues, frustrated)
- First-time Buyer (Lucas Andersen, New, exploring, neutral)
- Returning Owner (Priya Nair, Regular, managing services, happy)

Plus full field-by-field editing: name, tier (segments), age, language, intent (6 options + Unknown), emotion (5 options + Unknown), device, preferred channel, categories (toggleable chips), purchases (list editor with suggestions), issues (list editor with suggestions).

**`data-integrations-panel` (264 lines)** — System status overview grid (6 colored dots), 4 global scenario presets:
- Normal Ops (all healthy)
- CRM Outage (CRM offline, others healthy)
- Checkout Incident (payment + orders degraded)
- High Load (all slow)

Per-integration accordion with: scenario selector (healthy/slow/degraded/offline), latency slider (0–3000ms), raw JSON payload editor.

**`tool-design-system`** — Live catalog of all design system primitives with interactive examples.

### 4.5 Web Personalization Engine

`src/core/use-web-personalization.ts` is a React hook that analyzes the current `AgentContext` and returns personalization data for the active scenario's website (Aurelia Motors in the default automotive scenario):

**Inputs analyzed**: signals, customer profile, pending actions, topics, integration health.

**Outputs**:

| Output | Logic |
|---|---|
| **Smart banner** | Priority: critical outage → pending actions + issues → issues → returning customer with orders → product interest → anonymous with interest → null |
| **Hero variant** | 6 variants: default, electric, hybrid, performance, returning, support. Selected based on: support intent + issues → returning customer → dominant model type interest |
| **Hero CTAs** | 2 buttons adapted per hero variant (e.g., "Continue with Astra X" + "View my account" for returning) |
| **Featured model** | Most-viewed model slug (by product_interest signal count) or first model |
| **Model badges** | `"Viewed"` badge on models the customer has viewed |
| **Preferred filter** | Auto-selects model filter (electric/hybrid/performance) matching dominant browsing type |
| **Form pre-fill** | Customer name + top model slug for test drive form |

The personalization is derived entirely from signals already in the `AgentContext` — no additional API calls.

---

## 5. Design System

### 5.1 Primitives

All reusable UI components live in `src/components/shell/tooling/design-system/primitives.tsx` (805 lines, ~30 components):

**Layout primitives:**
- `ToolAppSurface` — full-height scrollable canvas background for tool windows
- `ToolSection` — titled section with 3 variants: card (bordered), flat (no border), divided (border-bottom). Supports collapsible mode.
- `Stack` — vertical stack with gap tokens (xs/sm/md/lg/xl)
- `Inline` — horizontal flex-wrap with gap
- `FieldGroup` — label + children + optional hint
- `FieldLabel` — standalone label
- `SettingRow` — label/description left, control right

**Typography:**
- `TypeDisplay` (28px, 650 weight), `TypeTitle` (22px, 600), `TypeSubtitle` (18px, 560), `TypeBody` (16px, 400), `TypeCaption` (11px, 450)

**Controls:**
- `ActionButton` — 4 variants: primary (dark), secondary (bordered), ghost, danger (red)
- `SegmentControl` — toggle button (dark when active, bordered when inactive)
- `PillToggle` — rounded toggle (emerald when active)
- `SwitchToggle` — iOS-style switch with optional label + description
- `SliderField` — range input with label + value label, optional colorize mode
- `RangeSlider` — bare range input
- `TabBar` — horizontal tab bar with active state shadow
- `Accordion` — collapsible section with header + chevron animation
- `OptionCard` — selectable card with icon, title, description (dark when selected, lift on hover)

**Inputs:**
- `TextInput` — standard text/password/number input
- `TextAreaInput` — multiline input with optional monospace mode
- `SelectInput` — native select dropdown

**Feedback:**
- `Tag` — chip with optional remove button, neutral/accent variants
- `StatusDot` — colored dot (success/warning/danger/neutral/info) with optional pulse animation and label
- `StatusBadge` — rounded badge with variant colors

**Specialized:**
- `PhoneFrame` — iOS device frame with notch, status bar (time + signal + battery icons), home indicator
- `HandoffBanner` — green banner showing "From [channel]" with summary and timestamp
- `toDisplayLabel()` — utility function that converts camelCase/kebab-case strings to display labels (handles special cases like "openai" → "OpenAI", "ivr" → "IVR")

### 5.2 Design Tokens (CSS Variables)

Defined in `src/app/globals.css`:

```css
:root {
  --surface-canvas: #f4f4f5;    /* App background */
  --surface-panel: #f8fafc;     /* Secondary surface */
  --surface-card: #ffffff;      /* Card background */
  --surface-subtle: #f1f5f9;    /* Subtle background */
  --surface-border: #d4d4d8;    /* Border color */

  --type-step-2xs: 11px;        /* Caption */
  --type-step-xs: 12px;         /* Label */
  --type-step-sm: 14px;         /* Body small */
  --type-step-md: 16px;         /* Body */
  --type-step-lg: 18px;         /* Subtitle */
  --type-step-xl: 22px;         /* Title */
  --type-step-2xl: 28px;        /* Display */

  --layout-surface-pad: 24px;
  --layout-section-pad: 16px;
  --layout-control-pad-x: 12px;
  --layout-control-pad-y: 7px;
  --layout-gap-xs: 6px;
  --layout-gap-sm: 10px;
  --layout-gap-md: 14px;
  --layout-gap-lg: 20px;
  --layout-gap-xl: 28px;
}
```

**CSS utility classes defined in globals.css:**
- Typography: `.type-display`, `.type-title`, `.type-subtitle`, `.type-body`, `.type-body-sm`, `.type-label`, `.type-caption`
- Layout: `.layout-surface`, `.layout-section`, `.layout-stack-{xs|sm|md|lg|xl}`, `.layout-divider`, `.layout-field`, `.layout-fields`
- Components: `.switch-track`, `.switch-thumb`, `.slider-field`, `.accordion-content`, `.accordion-inner`, `.status-dot-pulse`, `.tab-bar`, `.tab-bar-item`, `.phone-frame`, `.phone-notch`, `.phone-screen`, `.phone-status-bar`, `.handoff-banner`

### 5.3 Styling Approach

- **Tailwind 4 utility classes** combined with CSS variable references (e.g., `bg-[var(--surface-card)]`)
- **CSS Modules** for complex channel windows: `web-browser-window.module.css` and `whatsapp-window.module.css`
- **Glass/translucent aesthetic**: backdrop-blur, semi-transparent backgrounds (`bg-white/96`), subtle borders with opacity
- **Hidden scrollbars globally** for OS aesthetic (scrollbar-width: none)
- **Font**: Inter (loaded via Next.js font optimization)

---

## 6. Mock Data Layer

### 6.1 Aurelia Motors Brand Data

This section describes the **default automotive scenario pack**. The same pattern (domain data + knowledge-base builder + channel UI) is intended to be reusable for other industries (e.g., retail catalog, banking products, travel itineraries) by swapping the data source and scenario-specific UI while keeping the core ECL architecture unchanged.

`src/data/aurelia-website.ts` (292 lines) contains all fictional content:

**6 vehicle models**, each with:
- name, slug, category, type (electric/hybrid/performance), price, tagline
- gradient (CSS linear-gradient for card backgrounds)
- image (Unsplash URL)
- specs: range, acceleration (0–100), top speed, charge time
- features: 5 feature descriptions

| Model | Type | Price |
|---|---|---|
| Astra X | Electric SUV | EUR 74,900 |
| Orion S | Hybrid SUV | EUR 52,800 |
| Atlas Tour | Hybrid estate | EUR 46,900 |
| Nova Crossover | Electric crossover | EUR 49,200 |
| Helios GT | Performance sedan | EUR 63,500 |
| Lumen E | Electric hatch | EUR 39,400 |

**Supporting content:**
- 3 highlights ("Why Aurelia")
- 4 ownership cards (Service, Connected Services, Fleet, Insurance)
- 5 FAQ items
- 3 support topics
- Account profile (Alexandra Voss, Premium, since 2023)
- Vehicle (Astra X Performance pack)
- Subscription (Connected Care Plus, EUR 29/mo)
- 3 orders (delivery prep, installation, renewal)
- Preferences (notifications, center, language)

### 6.2 Knowledge Base Builder

`src/core/web-knowledge.ts` transforms the scenario's brand/domain data into a structured string for the system prompt. The AI is grounded to this knowledge base with an explicit rule: "Do NOT fabricate product names, prices, specifications, policies, or order details. If the answer is not in the knowledge base, say you don't have that information."

`buildPageContext(page, pageTitle)` returns a description of what the customer is currently viewing (e.g., "The customer is on the models index, with filters for electric, hybrid, and performance vehicles").

---

## 7. API Routes

### 7.1 POST /api/agent/respond

`src/app/api/agent/respond/route.ts` (48 lines)

**Request schema** (Zod-validated):
```typescript
{
  context: AgentContext;       // Full context
  channel: AgentChannel;      // Channel ID
  systemPrompt?: string;      // Optional override (otherwise built from context)
  conversationHistory?: ConversationEntry[];  // Optional override
}
```

**Flow**: validates request → builds system prompt if not provided → calls `requestAIReply()` → returns `{ channel, assistantReply }`.

**Error handling**: `ProviderRequestError` returns with its status code; other errors return 400.

### 7.2 POST /api/agent/extract-context

`src/app/api/agent/extract-context/route.ts` (40 lines)

**Request schema**:
```typescript
{
  context: AgentContext;
  channel: AgentChannel;
}
```

**Flow**: validates request → builds extraction prompt (analyzes last 6 messages) → calls `requestAIReply()` with temperature=0.1 and maxTokens=600 → parses JSON response with Zod → returns `{ extracted }`.

The extraction prompt instructs the AI to return strictly valid JSON with conservative confidence scores and no hallucinated signals.

---

## 8. What Works Well (Reuse Candidates)

### 8.1 Core Architecture Patterns

- **Single shared `AgentContext` model** — the idea of one source of truth that all channels read/write is solid and should be preserved. The type hierarchy is well-designed.
- **Types + Zod schema dual-validation** — having TypeScript interfaces for dev-time safety AND Zod schemas for runtime validation is excellent. The synchronized 5-file contract is strict but prevents bugs.
- **Post-turn context extraction** — the fire-and-forget pattern of extracting structured data (intent, emotion, signals, topics, summary) after each turn is effective for progressive context building without blocking the user.
- **System prompt builder** — the approach of dynamically constructing the prompt from the full context state, with configurable mode/tone/verbosity/proactivity instructions, works well. The mode instructions and proactivity levels are well-calibrated.
- **Provider-agnostic AI client** — direct HTTP calls per provider, no SDK lock-in. Easy to add new providers. Clean error propagation.
- **Rich message markers** — the `{{type:params}}` syntax for embedding interactive UI in AI responses is a clean, extensible pattern.
- **Channel handoff with greeting generation** — the full flow (event logging → window open + notification → context-aware greeting generation) is polished.

### 8.2 UI Patterns

- **Virtual OS metaphor** — highly effective for demo/presentation purposes. The window management, taskbar, and wallpapers create a compelling interactive experience.
- **Design system primitives** — the centralized primitives file with consistent token usage is well-structured. Good variety of components.
- **Window manager** — drag/resize/minimize/focus/notify behavior works smoothly.
- **Web personalization engine** — signal-driven personalization of website content (hero variant, smart banner, featured model, badges, filter, pre-fill) is a compelling and well-implemented feature.
- **Context Inspector** — the 4-tab inspector (Live/Signals/Profile/Timeline) provides excellent visibility into the agent's evolving understanding.
- **Customer persona presets** — quick scenario setup is very useful for demos.
- **Data Integrations Panel** — global scenario presets + per-integration fine-tuning is well-designed.
- **Comparison tab** — A/B testing different agent configs against the same prompt is a valuable tool feature.

### 8.3 Specific Code Worth Reusing

- The `AgentContext` type hierarchy (`types.ts` + `schema.ts` pattern)
- The `buildSystemPrompt()` function structure and its instruction system
- The `parseRichMessage()` rich text parser
- The `useWebPersonalization()` hook logic
- The design system primitives (`PhoneFrame`, `HandoffBanner`, `TabBar`, etc.)
- The provider client functions (request formats for each AI provider)
- The context extraction prompt template and Zod-validated response parser
- The behavioral signal type system (13 signal types with confidence scores)
- The `toDisplayLabel()` utility function

---

## 9. What Needs Improvement

### 9.1 Architecture Issues

- **No streaming** — AI responses block until complete. The user sees nothing until the full response arrives. Should use streaming (SSE or WebSocket) for token-by-token display.
- **System prompt is enormous** — the full prompt includes ALL conversation history, ALL signals, and the full knowledge base. This will hit token limits quickly in real conversations (even short sessions can exceed 8K tokens of context). Needs summarization/windowing strategy.
- **No conversation memory management** — no sliding window, no summarization of old messages, no compression. Every turn sends the full history.
- **Context extraction doubles API costs** — every turn makes 2 API calls (response + extraction). Consider: extraction only every N turns, use a cheaper model for extraction, or extract inline.
- **Client-side state only** — no persistence, no server-side state, no session management. Refreshing the page loses everything.
- **No authentication** — API keys are held in client-side state (memory only, not persisted). But they're sent to the server route, which is fine for a PoC but not production.
- **Channel scoping is basic** — `shareContextAcrossChannels` is all-or-nothing boolean. More granular scoping (e.g., share summary but not full history) would be better.
- **Mock integrations only** — integration health affects UI/prompts but the actual data is all static mock data. No real API calls to backends.

### 9.2 Missing Features

- **IVR, Kiosk, Email channels** — only web and WhatsApp are implemented; the other 3 are placeholders
- **No speech/voice** — IVR has no TTS/STT integration
- **No real-time cross-tab/cross-device updates** — currently works via Zustand store reactivity within a single tab. Multi-tab or multi-device would need WebSocket/SSE.
- **No conversation export/import** — can't save or replay sessions
- **No analytics/metrics** — no measurement of agent performance, response quality, response time, or handoff success rate
- **No conversation summarization** — the `contextSummary` is built extraction-by-extraction but there's no long-term memory strategy

### 9.3 UI Issues

- **Web browser window is massive** — 1595 lines in a single component. Should be decomposed into sub-components (pages, chat widget, rich message renderer, etc.)
- **CSS Modules inconsistency** — web browser and WhatsApp use CSS Modules; other windows use inline Tailwind. Should pick one approach.
- **No responsive design** — the OS metaphor assumes a desktop viewport. Mobile users would need a completely different layout.
- **No dark mode for channel windows** — only the OS shell (menu bar, taskbar) adapts to wallpaper tone. The windows themselves are always light.
- **Wallpaper shader can be expensive** — animated WebGL mesh gradients may cause performance issues on low-end devices

---

## 10. File-by-File Reference

### Core (business logic)

| File | Lines | Purpose |
|---|---|---|
| `src/core/agent-context/types.ts` | 143 | TypeScript interfaces — source of truth for all types |
| `src/core/agent-context/schema.ts` | 154 | Zod schemas for runtime validation |
| `src/core/agent-context/store.ts` | 350 | Zustand store, initial context, actions, exported helpers |
| `src/core/agent-context/prompt-builder.ts` | 349 | System prompt generation from AgentContext |
| `src/core/ai/types.ts` | 13 | `AgentAIRequest` interface |
| `src/core/ai/client.ts` | 228 | Direct HTTP calls to 5 AI providers |
| `src/core/ai/agent-module.ts` | 133 | `runAgentTurn()` and `runHandoffGreeting()` orchestration |
| `src/core/ai/context-extraction.ts` | 111 | Extraction prompt builder and Zod-validated response parser |
| `src/core/web-knowledge.ts` | 110 | Knowledge base builder from brand data |
| `src/core/use-web-personalization.ts` | 346 | Signal-driven web personalization hook |
| `src/lib/rich-message-parser.ts` | 94 | `{{marker}}` parser returning typed segments |

### API Routes

| File | Lines | Purpose |
|---|---|---|
| `src/app/api/agent/respond/route.ts` | 48 | POST — agent reply endpoint |
| `src/app/api/agent/extract-context/route.ts` | 40 | POST — post-turn context extraction |

### Shell (OS frame)

| File | Lines | Purpose |
|---|---|---|
| `src/components/shell/virtual-os.tsx` | 333 | Root OS component (wallpaper, menu bar, windows, taskbar) |
| `src/components/shell/taskbar/taskbar.tsx` | 120 | macOS-style dock |
| `src/components/shell/window-manager/types.ts` | 34 | ShellAppId, AppDefinition, WindowState types |
| `src/components/shell/window-manager/use-window-manager.ts` | 234 | Window state management hook |
| `src/components/shell/windows/desktop-window.tsx` | 163 | Draggable/resizable window chrome |
| `src/components/shell/wallpaper-switcher.tsx` | 81 | Animated wallpaper system (3 mesh gradients) |

### Channel Windows

| File | Lines | Purpose |
|---|---|---|
| `src/components/shell/windows/web-browser-window.tsx` | 1595 | Full Aurelia Motors website + chat widget |
| `src/components/shell/windows/whatsapp-window.tsx` | 217 | WhatsApp messaging simulation |
| `src/components/shell/windows/placeholder-window-content.tsx` | — | Placeholder for unbuilt channels |

### Tool Windows

| File | Lines | Purpose |
|---|---|---|
| `src/components/shell/windows/agent-control-center-window.tsx` | 695 | Agent config, chat, A/B comparison |
| `src/components/shell/windows/context-inspector-overlay.tsx` | 679 | Live context / signals / profile / timeline |
| `src/components/shell/windows/customer-profile-simulator-window.tsx` | 398 | Persona presets + profile editing |
| `src/components/shell/windows/data-integrations-panel-window.tsx` | 264 | Integration scenario controls |
| `src/components/shell/windows/tool-design-system-window.tsx` | — | Design system catalog |

### Design System

| File | Lines | Purpose |
|---|---|---|
| `src/components/shell/tooling/design-system/primitives.tsx` | 805 | All shared UI primitives (~30 components) |
| `src/app/globals.css` | 415 | Design tokens + component CSS |

### Data

| File | Lines | Purpose |
|---|---|---|
| `src/data/aurelia-website.ts` | 292 | Mock Aurelia Motors brand content |

### Configuration

| File | Purpose |
|---|---|
| `package.json` | Dependencies and scripts (dev, build, start, lint, typecheck) |
| `.cursor/rules/experience-continuity-layer.mdc` | Core architecture rules (always applied) |
| `.cursor/rules/agent-context-contract.mdc` | 5-file modification contract |
| `.cursor/rules/ai-integration.mdc` | AI integration patterns |
| `.cursor/rules/design-system.mdc` | Design system conventions |
| `.cursor/skills/add-channel/SKILL.md` | Step-by-step channel implementation workflow |
| `.cursor/skills/add-design-primitive/SKILL.md` | Primitive addition conventions |
| `.cursor/skills/modify-agent-context/SKILL.md` | Context modification workflow |
| `.cursor/skills/optimize-engine/SKILL.md` | Rule/skill optimization workflow |
| `.cursor/skills/sync-design-system-tool/SKILL.md` | Design system tool sync workflow |

---

## 11. Key Design Decisions — Preserve or Reconsider

### Preserve

| Decision | Why it works |
|---|---|
| AgentContext as single source of truth | Clean, predictable data flow. All channels read/write the same state. |
| Types + Zod dual-validation | Catches bugs at both compile time and runtime. |
| System prompt built dynamically from context | Ensures the AI always has the latest state. Configurable behavior per mode/tone/verbosity/proactivity. |
| Post-turn extraction as separate non-blocking step | Builds progressive understanding without blocking UX. |
| Rich message marker system | Clean separation between AI text and UI rendering. Extensible. |
| Provider-agnostic direct HTTP client | No SDK lock-in. Easy to add/remove providers. |
| Signal-driven personalization | Derives UI changes from existing context — no extra API calls. |
| Channel handoff with greeting generation | Polished user experience across channel switches. |
| The 5-file modification contract | Prevents partial updates that cause subtle bugs. |
| Behavioral signal taxonomy (13 types) | Well-balanced set of observable customer behaviors. |

### Reconsider

| Decision | Why to reconsider |
|---|---|
| Virtual OS metaphor | May not be needed if the rebuild has a different presentation goal. Adds complexity. |
| Client-side-only state (Zustand, no persistence) | Real use cases need session persistence, multi-tab support, and potentially server-side state. |
| Full conversation history in system prompt | Will hit token limits. Needs summarization, sliding window, or RAG-style retrieval. |
| No streaming | Modern UX expects token-by-token streaming. Should be a priority. |
| Extraction on every turn (doubles API cost) | Consider: every N turns, cheaper model, or inline extraction. |
| Single monolithic web browser component (1595 lines) | Should be decomposed into page components, chat widget, rich renderer. |
| CSS Modules vs. Tailwind inconsistency | Pick one approach. Tailwind-only is simpler; CSS Modules give better encapsulation for complex components. |
| The `ai` package is installed but unused | Either leverage it (it provides streaming, tool calling, etc.) or remove it. |
| 5 AI providers | Consider whether all 5 are needed, or if fewer with deeper integration (e.g., streaming, tool use) would be better. |
| `shareContextAcrossChannels` as boolean | Too coarse. Consider sharing summaries but not full history, or channel-specific visibility rules. |

---

## 12. Recommended Focus Areas for Rebuild

Based on the strengths and weaknesses identified above, a rebuild should prioritize:

1. **Streaming responses** — this is the single biggest UX improvement possible
2. **Conversation memory management** — sliding window + summarization to stay within token limits
3. **Component decomposition** — especially the web browser window
4. **Implement remaining channels** — IVR (with TTS/STT if possible), kiosk, email
5. **Session persistence** — at minimum localStorage; ideally server-side
6. **Consistent styling approach** — pick Tailwind-only or CSS Modules-only
7. **Reduce extraction cost** — extract less frequently or with a cheaper model
8. **Preserve the core patterns** — AgentContext, prompt builder, rich messages, handoff flow, personalization engine
9. **Generalize scenario packs** — treat Aurelia as one scenario module, and design clear extension points so additional industries and business domains can plug in their own data, knowledge bases, and channel UIs without changing the core engine
