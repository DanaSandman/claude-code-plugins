---
name: ui-generate
description: >
  Generate UI components with shadcn/ui and Tailwind CSS. Use when the user asks to
  "create a component", "build a UI", "make a button", "add a card",
  "create a navbar", "build a sidebar", "make a modal", "create a layout",
  "build a dashboard", "design a page", mentions creating any React/Next.js
  UI element, or asks for component generation.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UI Component Generator

You are generating UI components using shadcn/ui and Tailwind CSS for a Next.js/React project.

## Current Project State

- Working directory: !`pwd`
- Has shadcn: !`test -f components.json && echo "Yes" || echo "No"`
- Has Tailwind: !`test -f tailwind.config.ts -o -f tailwind.config.js && echo "Yes" || echo "No"`

## Step 1: Detect Project Setup

Check what's already configured:

1. Look for `components.json` (shadcn/ui config)
2. Look for `tailwind.config.ts` or `tailwind.config.js`
3. Check `package.json` for relevant dependencies
4. Check if `@/lib/utils` exists (cn utility)
5. Check `components/ui/` for already installed shadcn components

If shadcn/ui is not initialized, offer to set it up:
```bash
npx shadcn@latest init
```

## Step 2: Understand the Request

From the user's request, determine:
- **What component** to build (button, card, form, page layout, etc.)
- **Which shadcn/ui primitives** are needed
- **Custom behavior** (state, interactivity, data fetching)
- **Whether it's a Server or Client Component**

## Step 3: Install Required shadcn/ui Components

If the component needs shadcn/ui primitives that aren't installed:
```bash
npx shadcn@latest add <component-name>
```

Check existing components first to avoid reinstalling:
```bash
ls components/ui/ 2>/dev/null
```

## Step 4: Generate the Component

Follow these rules strictly:

### Server vs Client Components
- **Default to Server Components** — no `"use client"` unless needed
- Add `"use client"` only when using: `useState`, `useEffect`, `useRef`, event handlers (`onClick`, `onChange`, etc.), browser APIs
- If a component has both static content and interactive parts, split into a Server Component parent with a Client Component child

### TypeScript
- Always define a `Props` interface
- Export both the component and its types
- Use proper generic types for event handlers

### Tailwind CSS
- Use the `cn()` utility from `@/lib/utils` for conditional classes
- Follow mobile-first responsive design: `base → sm: → md: → lg: → xl:`
- Use design tokens from Tailwind config, not hardcoded colors
- Support `className` prop for external customization

### Accessibility
- Add proper ARIA attributes
- Ensure keyboard navigation works
- Use semantic HTML elements
- Include `role` attributes where needed
- Add `sr-only` text for icon-only buttons

### Component Patterns
- Support `variant` and `size` props using `cva` when appropriate
- Include loading, error, and empty states
- Add `forwardRef` when the component wraps a native element
- Use `Slot` from `@radix-ui/react-slot` for `asChild` pattern

## Step 5: Provide Usage Example

After creating the component, show:
1. Import statement
2. Basic usage
3. Usage with all prop variations
4. Responsive usage example if applicable

## Reference

Consult these guides for patterns and best practices:
- [reference/shadcn-catalog.md](reference/shadcn-catalog.md) — available shadcn/ui components
- [reference/tailwind-cheatsheet.md](reference/tailwind-cheatsheet.md) — common Tailwind patterns
- [reference/accessibility-checklist.md](reference/accessibility-checklist.md) — a11y requirements
- [reference/design-tokens-guide.md](reference/design-tokens-guide.md) — theming and tokens

## Arguments

$ARGUMENTS

If the user specifies a component name or description, use it directly. Otherwise, ask what they want to build.
