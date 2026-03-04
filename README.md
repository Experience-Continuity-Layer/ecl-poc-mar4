## ECL Experience Continuity Layer POC

Experience Continuity Layer is a virtual OS that simulates multiple customer-service channels (web, IVR, WhatsApp, kiosk, email) and orchestrates them through a single AI agent. The goal is to let a customer switch channels without repeating themselves while the agent keeps a unified, structured memory of the entire journey.

Built with **Next.js 16 (App Router)**, **React 19**, and **TypeScript 5**, it runs fully in the browser but reflects a multi-channel environment.

---

## Features

- **Virtual OS shell**: Desktop-like environment with taskbar, windows, and wallpapers (`VirtualOS`).
- **Multi-channel simulations**: Windows for web, IVR, WhatsApp, kiosk, and email experiences.
- **Single shared memory**: An `AgentContext` store that every channel reads/writes to.
- **Real AI providers**: Pluggable AI backends (OpenAI, Anthropic, Google, HuggingFace) via a small `agentConfig`.
- **Post-turn context extraction**: Fire-and-forget pipeline that keeps `AgentContext` clean and structured.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **State**: Zustand + Immer
- **Validation**: Zod
- **Styling**: Tailwind CSS 4 + custom primitives
- **Icons & Motion**: Lucide, Motion

---

## Project Structure (high level)

- `src/app/page.tsx` – Renders the main `VirtualOS`.
- `src/app/api/agent/respond/route.ts` – POST endpoint for turning an agent request into an AI response.
- `src/app/api/agent/extract-context/route.ts` – POST endpoint for post-turn context extraction (fire-and-forget).
- `src/core/agent-context/types.ts` – Source of truth for `AgentContext` types.
- `src/core/agent-context/schema.ts` – Zod schemas for runtime validation.
- `src/core/agent-context/store.ts` – Zustand store + helpers for reading/writing `AgentContext`.
- `src/core/agent-context/prompt-builder.ts` – Builds the system prompt from `AgentContext`.
- `src/core/ai/types.ts` – Types for AI requests and providers.
- `src/core/ai/client.ts` – Provider-specific HTTP clients.
- `src/core/ai/agent-module.ts` – Main `runAgentTurn` orchestration.
- `src/core/ai/context-extraction.ts` – Prompt + parsing for context extraction.
- `src/components/shell/virtual-os.tsx` – OS layout and app definitions.
- `src/components/shell/taskbar/taskbar.tsx` – Taskbar UI.
- `src/components/shell/wallpaper-switcher.tsx` – Wallpaper controls.
- `src/components/shell/window-manager/*` – Types and hooks for window state.
- `src/components/tooling/design-system/primitives.tsx` – Reusable UI primitives.
- `src/components/shell/windows/*` – One file per window/channel.

---

## Getting Started (Local Development)

1. **Install dependencies**:

```bash
npm install
```

2. **Run the dev server**:

```bash
npm run dev
```

3. Open `http://localhost:3000` in your browser to see the virtual OS.

---

## Development Notes

- **Single source of truth**: All channel behavior and long-lived memory flow through `AgentContext`. If you add new fields, keep `types.ts`, `schema.ts`, and `store.ts` in sync.
- **New channels**: Each new channel is implemented as a window under `src/components/shell/windows/` and integrated into `VirtualOS` app definitions.
- **AI providers**: Provider/model configuration lives in a small `agentConfig` layer; adding a new provider should not require changing channel UIs.

For deeper internal conventions and workflows, see the `.cursor/rules` and `.cursor/skills` documents in the repo.
