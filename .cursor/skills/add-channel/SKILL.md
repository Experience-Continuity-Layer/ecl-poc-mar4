---
name: add-channel
description: Step-by-step workflow for implementing a new channel in the ECL virtual OS. Use when building IVR, WhatsApp, Kiosk, Email, or any new channel simulation, or when the user says "add channel", "implement channel", or "build the IVR/WhatsApp/kiosk/email".
---

# Add Channel

## Overview

Each channel in the ECL is a window in the virtual OS shell that interacts with AgentContext.
The Web Browser channel (`web-browser`) is the reference implementation.
IVR, WhatsApp, Kiosk, and Email are currently placeholders.

## Checklist

Copy and track progress:

```
- [ ] Step 1: Add ShellAppId (if new)
- [ ] Step 2: Create window component
- [ ] Step 3: Wire into virtual-os.tsx
- [ ] Step 4: Integrate with AgentContext
- [ ] Step 5: Add chat / interaction flow
- [ ] Step 6: Verify cross-channel continuity
```

## Step 1: Add ShellAppId (if new)

File: `src/components/shell/window-manager/types.ts`

Existing channel app IDs: `web-browser`, `ivr-phone`, `whatsapp`, `kiosk`, `email-client`.
If the channel already has an ID in the `ShellAppId` union, skip this step.

## Step 2: Create window component

File: `src/components/shell/windows/<channel>-window.tsx`

Naming: `<Channel>Window` (e.g. `IvrPhoneWindow`, `WhatsAppWindow`, `KioskWindow`, `EmailClientWindow`).

Use `"use client"` directive. Import primitives from `../tooling/design-system/primitives`.
Wrap in `<ToolAppSurface>` for consistent padding and scrolling.

Channel-specific UI expectations:
- **IVR**: Voice menu tree, keypad, call controls, transfer/escalation flow
- **WhatsApp**: Message bubbles, typing indicator, quick-reply chips, media
- **Kiosk**: Touch-optimized layout, large buttons, simplified navigation
- **Email**: Inbox list, thread view, compose, reply-in-thread

## Step 3: Wire into virtual-os.tsx

File: `src/components/shell/virtual-os.tsx`

1. Import the new window component.
2. The app definition already exists in `appDefinitions` for placeholder channels.
3. Add a case in `renderWindowContent()`:

```typescript
if (appId === "ivr-phone") {
  return <IvrPhoneWindow />;
}
```

This replaces the `PlaceholderWindowContent` fallback for that channel.

## Step 4: Integrate with AgentContext

The channel must read from and write to AgentContext:

```typescript
import { useAgentContextStore } from "@/core/agent-context/store";
import { logMessage, logChannelEvent } from "@/core/agent-context/store";
```

Key interactions:
- **Set active channel**: happens automatically in `logMessage()` and `logChannelEvent()`.
- **Log messages**: `logMessage(channelId, "user", text)` and `logMessage(channelId, "assistant", reply)`.
- **Log events**: `logChannelEvent(channelId, "eventType", "detail")` for channel-specific events.
- **Read state**: `useAgentContextStore()` hook to access `context.conversationHistory`, `context.customer`, etc.
- **Check channel enabled**: Verify `agentConfig.channels.includes(channelId)` before interactions.

## Step 5: Add chat / interaction flow

Use the agent module for AI-powered interactions:

```typescript
import { runAgentTurn } from "@/core/ai/agent-module";

const reply = await runAgentTurn(channelId, userMessage);
```

`runAgentTurn` handles: logging, API call, reply logging, and context extraction.
It throws if the channel is disabled or the API call fails — handle errors in the UI.

For channels with non-text interaction (IVR keypad, kiosk buttons), convert user actions to
text messages that represent the intent (e.g. "Selected option 3: Check order status").

## Step 6: Verify cross-channel continuity

1. Start a conversation in one channel (e.g. Web Browser).
2. Open the new channel and send a follow-up message.
3. Confirm the agent references prior context without the user repeating themselves.
4. Check the Context Inspector to verify `channelHistory` and `conversationHistory` updated.
5. Test with `shareContextAcrossChannels` toggled on and off.
