# Claude Code Plugins

A curated collection of Claude Code plugins. Each plugin adds specialized skills, commands, and hooks to Claude Code. More plugins will be added over time.

## Plugins

### seo-plugin

Audits and fixes technical SEO issues across all frontend frameworks — Next.js, React, Angular, and Static HTML. Detects the framework automatically and scans 9 SEO categories: rendering strategy, titles, meta descriptions, headings, semantic HTML, URL structure, images, internal links, and Google Tag Manager integration.

**Commands:**

```
/seo-audit                    # Full project audit → generates seo-report.json + seo-report.md
/seo-fix all                  # Fix all auto-fixable issues
/seo-fix SEO-012              # Fix a specific issue by ID
/seo-fix images               # Fix all issues in a category
/seo-check src/app/page.tsx   # Quick inline check on a single file
```

**Hooks:** Automatically warns about SEO mistakes (missing alt, multiple H1, empty titles, duplicate GTM) whenever Claude edits a frontend file.

---

### shadcn-toolkit

Generates UI components with shadcn/ui and Tailwind CSS for Next.js/React projects. Auto-detects your project setup, creates accessible, responsive, type-safe components, and manages theming (dark mode, color palettes, design tokens).

**Commands:**

```
/add-shadcn-component dialog    # Install a shadcn/ui component
/create-custom-component        # Generate a custom React component
/create-form                    # Create a form with validation
```

**Skills:** Auto-triggers on "create a component", "build a UI", "set up dark mode", "change the theme", etc.

**Hooks:** Checks every edited `.tsx`/`.jsx` for hardcoded colors, missing button types, accessibility issues, and missing `"use client"`.

---

*More plugins coming soon.*

## Getting Started

Load a plugin:

```bash
claude --plugin-dir ./plugins/seo-plugin
claude --plugin-dir ./plugins/shadcn-toolkit
```

## Requirements

- Claude Code CLI
- Node.js (plugins use built-in modules only — no npm install needed)

## Author

Dana Sandman (sandmandana1@gmail.com)
