# Tailwind CSS Cheatsheet

## Responsive Breakpoints (Mobile-First)

```
base    → all screens (start here)
sm:     → 640px+
md:     → 768px+
lg:     → 1024px+
xl:     → 1280px+
2xl:    → 1536px+
```

Example: `className="text-sm md:text-base lg:text-lg"`

## Common Layout Patterns

### Flex Container
```
flex flex-col gap-4                    → vertical stack
flex flex-row items-center gap-2       → horizontal row, centered
flex flex-wrap gap-4                   → wrapping row
flex items-center justify-between      → space between items
```

### Grid
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6   → responsive grid
grid grid-cols-12 gap-4                                  → 12-column grid
```

### Container
```
container mx-auto px-4                → centered container
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8   → common page width
```

## Spacing Scale

| Class | Size |
|-------|------|
| `p-1` / `m-1` | 0.25rem (4px) |
| `p-2` / `m-2` | 0.5rem (8px) |
| `p-3` / `m-3` | 0.75rem (12px) |
| `p-4` / `m-4` | 1rem (16px) |
| `p-6` / `m-6` | 1.5rem (24px) |
| `p-8` / `m-8` | 2rem (32px) |
| `gap-4` | 1rem between flex/grid children |

## Typography

```
text-xs       → 12px
text-sm       → 14px
text-base     → 16px
text-lg       → 18px
text-xl       → 20px
text-2xl      → 24px
text-3xl      → 30px
text-4xl      → 36px

font-normal   → 400
font-medium   → 500
font-semibold → 600
font-bold     → 700

leading-tight   → 1.25
leading-normal  → 1.5
leading-relaxed → 1.625

tracking-tight  → -0.025em
tracking-normal → 0
tracking-wide   → 0.025em
```

## Colors (shadcn/ui CSS Variables)

Use these instead of hardcoded colors:
```
bg-background text-foreground          → page base
bg-primary text-primary-foreground     → primary actions
bg-secondary text-secondary-foreground → secondary
bg-muted text-muted-foreground         → subtle/disabled
bg-accent text-accent-foreground       → highlights
bg-destructive text-destructive-foreground → danger/error
bg-card text-card-foreground           → card surfaces
border-border                          → borders
ring-ring                              → focus rings
```

## Common Patterns

### Card
```
rounded-lg border bg-card p-6 shadow-sm
```

### Input
```
flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

### Truncated Text
```
truncate                → single line ellipsis
line-clamp-2            → 2-line ellipsis
```

### Transitions
```
transition-colors duration-200   → color transitions
transition-all duration-300      → all properties
```

### Focus Ring (Accessibility)
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Screen Reader Only
```
sr-only                 → visually hidden, available to screen readers
not-sr-only             → undo sr-only
```

## Dark Mode

With `next-themes` and `class` strategy:
```
dark:bg-gray-900 dark:text-white       → explicit dark variants
```

With CSS variables (preferred with shadcn/ui):
```
bg-background text-foreground          → auto-switches via CSS variables
```

## cn() Utility Pattern

```tsx
import { cn } from '@/lib/utils'

className={cn(
  'base-classes here',
  condition && 'conditional-class',
  {
    'variant-a': variant === 'a',
    'variant-b': variant === 'b',
  },
  className  // allow external override
)}
```
