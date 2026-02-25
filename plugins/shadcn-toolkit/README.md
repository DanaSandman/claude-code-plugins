# shadcn-toolkit

A Claude Code plugin for building UIs with shadcn/ui and Tailwind CSS in Next.js/React projects.

## Skills

### ui-generate

Auto-triggers when you ask Claude to create any UI component. Detects your project setup (shadcn, Tailwind, installed components) and generates production-ready components with TypeScript, accessibility, and responsive design.

**Triggers**: "create a component", "build a UI", "make a button", "add a card", "create a navbar", "build a dashboard", "design a page"

### ui-theme

Auto-triggers when you ask about theming or styling. Sets up dark mode, changes color palettes, configures fonts, and manages design tokens.

**Triggers**: "set up dark mode", "change the theme", "update colors", "configure design tokens", "customize tailwind", "change fonts"

## Commands

| Command | Description |
|---------|-------------|
| `/add-shadcn-component` | Install a shadcn/ui component and show usage |
| `/create-custom-component` | Generate a custom React component with Tailwind |
| `/create-form` | Create a form with react-hook-form + Zod validation |

## Hooks

Auto-checks every `.tsx`/`.jsx` file after Claude writes or edits it:

- Hardcoded colors in inline styles (use Tailwind/tokens instead)
- `<button>` without `type` attribute
- `<img>` without `alt` attribute
- `onClick` on non-interactive elements (`<div>`, `<span>`)
- React hooks used without `"use client"` directive
- Template literal className instead of `cn()` utility

## Usage

```
# Let Claude auto-detect what to do
"create a responsive pricing card with 3 tiers"
"set up dark mode for my app"
"build a sidebar navigation with icons"

# Use commands directly
/add-shadcn-component dialog
/create-custom-component
/create-form
```

## Requirements

- Node.js
- Next.js or React project
- Claude Code CLI

## Local Testing

```bash
claude --plugin-dir ./plugins/shadcn-toolkit
```
