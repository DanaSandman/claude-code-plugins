# Images Accessibility Guide

## Every Image Needs an Alt Attribute

The `alt` attribute provides a text alternative for screen reader users and when images fail to load.

### Content Images

Content images convey information. Their alt text should describe the image's meaning:

```html
<!-- GOOD -->
<img src="chart.png" alt="Sales increased 40% from Q1 to Q3 2025" />

<!-- BAD: describes appearance, not meaning -->
<img src="chart.png" alt="A bar chart" />
```

### Decorative Images

Decorative images add visual flair but no information. Use empty alt:

```html
<!-- GOOD: screen readers skip this -->
<img src="separator.svg" alt="" />
<img src="bg-pattern.png" alt="" role="presentation" />
```

### How to Decide

| Image Purpose | Alt Text |
|--------------|----------|
| Informs the user | Describe the meaning |
| Icon with adjacent text label | `alt=""` (decorative) |
| Icon-only (no text) | Describe the action |
| Background/separator | `alt=""` |
| Complex chart/diagram | Describe data + link to text version |

## Decorative Detection Hints

The scanner uses filename and class hints to guess decorative images:

`icon`, `decorat`, `separator`, `divider`, `spacer`, `background`, `bg-`, `ornament`

If matched, `alt=""` is applied. Otherwise `alt="TODO: describe image"` is used.

## Next.js Image Component

Next.js `<Image>` requires an `alt` prop:

```jsx
import Image from 'next/image';

<Image src="/hero.jpg" alt="Team working in the office" width={800} height={400} />
```

## SVG Accessibility

SVGs used as images need a text alternative:

```html
<!-- SVG as img -->
<img src="logo.svg" alt="Company logo" />

<!-- Inline SVG -->
<svg role="img" aria-label="Company logo">
  <title>Company logo</title>
  ...
</svg>

<!-- Decorative inline SVG -->
<svg aria-hidden="true">...</svg>
```

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 1.1.1 | A | Non-text Content |
| 1.4.5 | AA | Images of Text |
