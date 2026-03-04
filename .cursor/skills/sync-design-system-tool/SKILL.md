---
name: sync-design-system-tool
description: Proactively sync the Design System Tool window with primitives.tsx after any design system change. This skill should be triggered automatically by the AI whenever primitives.tsx is modified — new primitive added, props changed, primitive removed or renamed. Use when the user says "update design system tool", "sync catalog", or after any task that touched primitives.tsx.
---

# Sync Design System Tool

## When to trigger

Run this skill **proactively** at the end of any task that modifies
`src/components/shell/tooling/design-system/primitives.tsx`.

Do not wait for the user to ask. If you touched `primitives.tsx`, sync the tool window.

## Files

- **Source**: `src/components/shell/tooling/design-system/primitives.tsx`
- **Catalog**: `src/components/shell/windows/tool-design-system-window.tsx`

## Structure of tool-design-system-window.tsx

The catalog has three tabs:
- **Foundations** (`FoundationsTab`) — typography, tokens, surface colors, status indicators, section variants
- **Controls** (`ControlsTab`) — interactive primitives with live state demos
- **Patterns** (`PatternsTab`) — composition examples showing how primitives combine

## Sync checklist

```
- [ ] 1. Identify what changed in primitives.tsx
- [ ] 2. Update the matching tab in tool-design-system-window.tsx
- [ ] 3. Add import if new primitive
- [ ] 4. Verify visually
```

## Step 1: Identify the change

| Change type | Action in catalog |
|-------------|-------------------|
| New primitive added | Add a new `<ToolSection>` with preview in the appropriate tab |
| Primitive props changed | Update existing preview to demonstrate new/changed props |
| Primitive removed | Remove its preview section and import |
| Primitive renamed | Update import and all references in catalog |

## Step 2: Update the catalog

### For new interactive primitives (Controls tab)

Add a `<ToolSection>` with:
- `title` = primitive name
- `description` = one-line explanation of what it does
- Live demo with `useState` for interactive state
- Show all variants (e.g. primary/secondary/ghost for buttons)
- Show key prop combinations (with/without icon, disabled state)

### For new display primitives (Foundations tab)

Add a `<ToolSection>` showing:
- All visual variants (colors, sizes)
- Edge cases (long text, empty state)

### For new composition patterns (Patterns tab)

Add a `<ToolSection>` showing:
- A realistic use case combining 2-3 primitives
- Description of when this pattern is used

## Step 3: Add import

Add the new primitive to the import block at the top of `tool-design-system-window.tsx`:

```typescript
import {
  // ... existing imports
  NewPrimitive,
} from "../tooling/design-system/primitives";
```

## Step 4: Verify

Open the Tool Design System window and confirm:
- New primitive appears in the correct tab
- Interactive demos work (state updates on click/toggle)
- Styling matches the rest of the catalog
- No missing or broken previews for existing primitives
