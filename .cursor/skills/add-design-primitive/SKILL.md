---
name: add-design-primitive
description: Conventions for adding or modifying reusable UI primitives in the ECL design system. Use when creating a new primitive component, updating an existing primitive, refactoring UI into reusable parts, or when the user says "add primitive", "new component", "design system", or "extract to primitives".
---

# Add Design Primitive

## Overview

All reusable UI primitives live in a single file:
`src/components/shell/tooling/design-system/primitives.tsx`

The Design System Tool window (`tool-design-system-window.tsx`) is a live catalog of every primitive.

## Checklist

```
- [ ] 1. Add/modify primitive in primitives.tsx
- [ ] 2. Export the component
- [ ] 3. Update tool-design-system-window.tsx
- [ ] 4. Verify visually
```

## Step 1: Write the primitive

File: `src/components/shell/tooling/design-system/primitives.tsx`

Conventions:
- `"use client"` is already declared at the top of the file — do not re-declare.
- Named export, PascalCase function name (e.g. `export function MyPrimitive`).
- Props as inline destructured object with TypeScript types.
- Use CSS variable tokens from `globals.css`, not raw values (e.g. `var(--surface-card)`, `var(--layout-gap-md)`).
- Tailwind utility classes for layout + token variable references for surfaces/spacing.
- Use `type-*` CSS classes for typography (`type-label`, `type-body-sm`, `type-caption`, etc.).
- Keep primitives stateless when possible. If state is needed (e.g. Accordion, TabBar), keep it minimal.
- Group the primitive under the appropriate section comment: `/* ─── Section Name ─── */`.

### Existing categories

| Category | Primitives |
|----------|-----------|
| Layout surfaces | ToolAppSurface, ToolSection |
| Typography | FieldLabel, FieldGroup, Stack, Inline, TypeDisplay, TypeTitle, TypeSubtitle, TypeBody, TypeCaption |
| Controls | PillToggle, SegmentControl, ActionButton |
| SwitchToggle | SwitchToggle |
| TabBar | TabBar |
| Accordion | Accordion |
| Tag | Tag |
| StatusDot | StatusDot |
| SliderField | SliderField |
| OptionCard | OptionCard |
| SettingRow | SettingRow |
| Inputs | TextInput, TextAreaInput, SelectInput, RangeSlider |
| Badges | StatusBadge |

## Step 2: Export

Ensure the component is a named export. No default exports in this file.
If you add a new type that consumers need, export it (e.g. `export type StatusDotVariant`).

## Step 3: Update Design System Tool

**This step is mandatory.** See the `sync-design-system-tool` skill for details.

After any change to `primitives.tsx`, update `tool-design-system-window.tsx` to:
- Add a preview section for new primitives
- Show all prop variants and states
- Update existing previews if props changed

## Step 4: Verify

Open the Tool Design System window in the virtual OS and confirm:
- The primitive renders correctly in the catalog
- All variants and states are represented
- Styling uses tokens and looks consistent with existing primitives
