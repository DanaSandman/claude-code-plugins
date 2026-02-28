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

### accessibility-plugin

Audits and fixes WCAG 2.2 accessibility issues across all frontend frameworks — Next.js, React, Angular, and Static HTML. Scans 8 categories: semantic HTML, accessible names, images, forms, ARIA, keyboard & focus, UI patterns (dialogs/tabs/menus), and dynamic content (live regions). Optional runtime audits via Playwright + axe-core or Lighthouse.

**Commands:**

```
/a11y-audit                     # Full project audit → generates a11y-report.json + a11y-report.md
/a11y-fix all                   # Fix all auto-fixable issues
/a11y-fix A11Y-003              # Fix a specific issue by ID
/a11y-fix images                # Fix all issues in a category
/a11y-check src/app/page.tsx    # Quick inline check on a single file
/a11y-run http://localhost:3000 # Runtime audit via Playwright/axe-core or Lighthouse
```

**Hooks:** Automatically warns about accessibility mistakes (missing alt, div onClick without role, inputs without labels, aria-hidden on focusable, tabindex > 0, empty aria-label) whenever Claude edits a frontend file.

---

*More plugins coming soon.*

## Getting Started

Load a plugin:

```bash
claude --plugin-dir ./plugins/seo-plugin
```

## Requirements

- Claude Code CLI
- Node.js (plugins use built-in modules only — no npm install needed)

## Author

Dana Sandman (sandmandana1@gmail.com)
