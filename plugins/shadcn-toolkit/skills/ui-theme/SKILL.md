---
name: ui-theme
description: >
  Configure theming, styling, and design systems. Use when the user asks to
  "set up dark mode", "change the theme", "update colors", "configure design tokens",
  "customize tailwind", "set up a design system", "change fonts",
  "update the color palette", mentions theming, styling configuration,
  design tokens, or CSS variables.
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# UI Theme & Design System

You are configuring theming, design tokens, and styling for a Next.js/React project using Tailwind CSS and shadcn/ui.

## Current Project State

- Tailwind config: !`cat tailwind.config.ts 2>/dev/null | head -20 || cat tailwind.config.js 2>/dev/null | head -20 || echo "Not found"`
- CSS variables: !`grep -l "\\-\\-" app/globals.css 2>/dev/null || grep -l "\\-\\-" src/app/globals.css 2>/dev/null || echo "Not found"`
- shadcn theme: !`cat components.json 2>/dev/null | head -10 || echo "Not found"`

## Step 1: Audit Current Theme

Check the existing setup:

1. Read `tailwind.config.ts` / `tailwind.config.js` for custom theme extensions
2. Read `globals.css` / `app/globals.css` for CSS custom properties
3. Read `components.json` for shadcn/ui style configuration (default vs new-york)
4. Check for existing color scheme: `@media (prefers-color-scheme: dark)`
5. Check for `next-themes` in `package.json`

## Step 2: Understand the Request

Determine what the user wants:
- **Dark mode setup** — install next-themes, configure ThemeProvider, add toggle
- **Color palette change** — update CSS variables and Tailwind config
- **Typography** — font family, sizes, line heights
- **Spacing system** — custom spacing scale
- **Custom components theme** — variant colors, sizes
- **Full design system** — complete tokens, scales, and documentation

## Step 3: Apply Changes

### Dark Mode Setup

1. Install next-themes:
```bash
npm install next-themes
```

2. Create ThemeProvider wrapper component
3. Add to root layout
4. Create theme toggle component using shadcn/ui dropdown
5. Ensure CSS variables support both light and dark in `globals.css`:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

### Color Palette

shadcn/ui uses HSL CSS variables. When changing colors:

1. Update `:root` and `.dark` blocks in `globals.css`
2. Use HSL format without the `hsl()` wrapper: `220 14% 96%`
3. Key variables to update:
   - `--background`, `--foreground` — page base
   - `--primary`, `--primary-foreground` — primary actions
   - `--secondary`, `--secondary-foreground` — secondary elements
   - `--accent`, `--accent-foreground` — highlights
   - `--destructive`, `--destructive-foreground` — error/danger
   - `--muted`, `--muted-foreground` — subtle text/backgrounds
   - `--card`, `--card-foreground` — card surfaces
   - `--border`, `--input`, `--ring` — borders and focus rings

### Typography

Update `tailwind.config.ts` theme extend:
```ts
fontFamily: {
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
}
```

Load fonts in `layout.tsx` using `next/font`.

### Custom Design Tokens

For project-specific tokens, extend Tailwind config:
```ts
theme: {
  extend: {
    colors: {
      brand: {
        50: 'hsl(var(--brand-50))',
        500: 'hsl(var(--brand-500))',
        900: 'hsl(var(--brand-900))',
      }
    },
    borderRadius: {
      lg: 'var(--radius)',
    },
    spacing: {
      // Custom spacing if needed
    }
  }
}
```

## Step 4: Verify

After making changes:
1. Check that both light and dark modes render correctly
2. Verify contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text)
3. Ensure all shadcn/ui components pick up the new theme
4. Test responsive breakpoints

## Reference

- [reference/design-tokens-guide.md](reference/design-tokens-guide.md) — token architecture
- [reference/tailwind-cheatsheet.md](reference/tailwind-cheatsheet.md) — utility reference
- [reference/accessibility-checklist.md](reference/accessibility-checklist.md) — contrast and a11y

## Arguments

$ARGUMENTS
