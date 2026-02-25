# Design Tokens Guide

## What Are Design Tokens

Design tokens are the single source of truth for visual design decisions — colors, spacing, typography, shadows, radii. They ensure consistency across components and enable theming (light/dark mode).

## shadcn/ui Token Architecture

shadcn/ui uses CSS custom properties (variables) in HSL format, consumed by Tailwind utility classes.

### Flow

```
globals.css (CSS variables) → tailwind.config.ts (maps to utilities) → Components (use utilities)
```

### CSS Variables (globals.css)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark variants of all tokens */
  }
}
```

### Format Rules

- HSL values **without** the `hsl()` wrapper: `220 14% 96%`
- Tailwind config maps them: `hsl(var(--primary))`
- Every color token has a `-foreground` pair for text on that background

## Token Categories

### Color Tokens

| Token | Purpose | Usage |
|-------|---------|-------|
| `background` / `foreground` | Page base | `bg-background text-foreground` |
| `primary` / `primary-foreground` | Primary buttons, links | `bg-primary text-primary-foreground` |
| `secondary` / `secondary-foreground` | Secondary actions | `bg-secondary text-secondary-foreground` |
| `muted` / `muted-foreground` | Disabled, subtle text | `bg-muted text-muted-foreground` |
| `accent` / `accent-foreground` | Highlights, hover states | `bg-accent text-accent-foreground` |
| `destructive` / `destructive-foreground` | Errors, delete actions | `bg-destructive text-destructive-foreground` |
| `card` / `card-foreground` | Card surfaces | `bg-card text-card-foreground` |
| `popover` / `popover-foreground` | Popover/dropdown surfaces | `bg-popover text-popover-foreground` |
| `border` | Default borders | `border-border` |
| `input` | Form input borders | `border-input` |
| `ring` | Focus ring color | `ring-ring` |

### Radius Token

```css
--radius: 0.5rem;
```

Used in Tailwind config:
```ts
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)',
}
```

## Adding Custom Tokens

### Step 1: Define CSS Variable

```css
:root {
  --brand-primary: 245 58% 51%;
  --brand-primary-foreground: 0 0% 100%;
  --sidebar-width: 16rem;
}
.dark {
  --brand-primary: 245 70% 65%;
}
```

### Step 2: Map in Tailwind Config

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      brand: {
        primary: 'hsl(var(--brand-primary))',
        'primary-foreground': 'hsl(var(--brand-primary-foreground))',
      }
    },
    width: {
      sidebar: 'var(--sidebar-width)',
    }
  }
}
```

### Step 3: Use in Components

```tsx
<div className="bg-brand-primary text-brand-primary-foreground w-sidebar">
```

## Best Practices

1. **Always use tokens** — never hardcode `#hex` or `rgb()` in components
2. **Pair colors** — every background token needs a foreground token
3. **Test both modes** — verify light and dark with every token change
4. **Maintain contrast** — 4.5:1 minimum for text, 3:1 for UI elements
5. **Use semantic names** — `destructive` not `red`, `primary` not `blue`
6. **Keep it minimal** — only add custom tokens when shadcn defaults don't fit
