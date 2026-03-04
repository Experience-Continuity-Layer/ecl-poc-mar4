---
name: modify-agent-context
description: Synchronized multi-file modification workflow for adding or changing fields on AgentContext. Use when adding new fields, changing types, or restructuring the agent context store, or when the user says "add field to context", "update agent context", "modify the store", or "add to customer profile".
---

# Modify AgentContext

## Overview

AgentContext is defined across 4-5 tightly coupled files. Changing one without the
others causes type errors, runtime bugs, or silent data loss. This skill documents
the exact modification chain.

## Checklist

Copy and track progress:

```
- [ ] 1. types.ts — TypeScript interface
- [ ] 2. schema.ts — Zod validation schema
- [ ] 3. store.ts — default state + actions
- [ ] 4. prompt-builder.ts — system prompt
- [ ] 5. UI — control or display
- [ ] 6. (if inferred) context-extraction.ts
- [ ] 7. Verify in Context Inspector
```

## Step 1: types.ts

Path: `src/core/agent-context/types.ts`

Add the field to the appropriate interface. Common locations:
- `AgentCustomer` — customer profile fields
- `AgentConfig` — agent behavior settings
- `AgentContext` — top-level context sections
- New interface — if adding a complex nested structure, define its own interface first

Use `| null` for fields that may be unknown. Use arrays (`string[]`) for multi-value fields.

## Step 2: schema.ts

Path: `src/core/agent-context/schema.ts`

Update the matching Zod schema to validate the new field.

Patterns:
- Optional inferred field: `z.string().nullable().default(null)`
- Required string: `z.string().min(1)`
- Array: `z.array(z.string()).default([])`
- Boolean: `z.boolean()`
- Number with range: `z.number().min(0).max(100)`
- Enum: `z.enum(["a", "b", "c"])`

If the field will be extracted by AI, also update `extractedContextSchema`.

## Step 3: store.ts

Path: `src/core/agent-context/store.ts`

1. Add the default value to `initialContext`.
2. If the field needs a dedicated write action (not just `updateContext`):

```typescript
// In the store definition:
newAction: (arg) =>
  set((state) => ({
    context: produce(state.context, (draft) => {
      draft.newField = arg;
    }),
  })),

// Export standalone helper:
export function newAction(arg: Type) {
  useAgentContextStore.getState().newAction(arg);
}
```

3. Update `clearContext` if the field should/shouldn't be preserved on reset.

## Step 4: prompt-builder.ts

Path: `src/core/agent-context/prompt-builder.ts`

Add the field to `buildSystemPrompt()` so the AI can see and use it.

Format as a readable line within the appropriate section:
- Customer fields → under "Customer profile:" section
- Config fields → add as a setting line
- New section → add a new block with header

Use `?? "Unknown"` for nullable fields. Use `.join(", ") || "none"` for arrays.

## Step 5: UI

Wire the field to a UI component:
- **Agent Control Center** (`agent-control-center-window.tsx`) — for `agentConfig` fields
- **Customer Profile Simulator** (`customer-profile-simulator-window.tsx`) — for `customer` fields
- **Context Inspector** (`context-inspector-overlay.tsx`) — for read-only display of any field
- **Data Integrations Panel** (`data-integrations-panel-window.tsx`) — for integration fields

Use primitives from `primitives.tsx` (SwitchToggle, SliderField, SegmentControl, TextInput, etc.).

## Step 6: Context extraction (if applicable)

If the new field should be inferred from conversation:

1. `context-extraction.ts` — add to `buildExtractionPrompt()` JSON schema and `EMPTY_EXTRACTION`.
2. `schema.ts` — add to `extractedContextSchema`.
3. `store.ts` — add merging logic in `applyExtractedContext()`.

## Step 7: Verify

Open the Context Inspector and confirm the field renders with its default value.
Send a test message and verify the field updates correctly (if AI-inferred or UI-driven).
