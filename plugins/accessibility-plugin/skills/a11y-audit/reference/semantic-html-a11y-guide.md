# Semantic HTML Accessibility Guide

## Why Semantic HTML Matters for Accessibility

Semantic HTML provides meaning to assistive technologies. Screen readers use semantic tags to:
- Navigate by landmarks (header, nav, main, footer)
- Understand content hierarchy via headings
- Identify interactive elements (buttons, links)
- Skip repetitive content (skip-to-main)

## Interactive Elements

| Element | Purpose | Keyboard |
|---------|---------|----------|
| `<button>` | Actions (toggle, submit, open) | Enter, Space |
| `<a href>` | Navigation to a URL | Enter |
| `<input>` | Data entry | Focus via Tab |
| `<select>` | Dropdown choice | Arrow keys |

### Common Mistake: Clickable `<div>`

```html
<!-- BAD: not focusable, not announced as interactive -->
<div onClick={handleClick}>Delete</div>

<!-- GOOD: focusable, announced as button -->
<button type="button" onClick={handleClick}>Delete</button>
```

A `<div>` with `onClick` is invisible to keyboard and screen reader users unless you also add `role="button"`, `tabindex="0"`, and `onKeyDown` handlers — which is just reinventing `<button>`.

## Heading Hierarchy

Headings must form a logical outline without skipping levels.

```
h1 — Page title (one per page)
  h2 — Section
    h3 — Subsection
    h3 — Subsection
  h2 — Section
```

### Issues Detected
- Multiple `<h1>` elements on the same page
- Skipped levels (e.g. h1 → h3)
- Missing `<h1>` entirely

## Landmark Elements

| Element | ARIA Role | Purpose |
|---------|-----------|---------|
| `<header>` | `banner` | Site header |
| `<nav>` | `navigation` | Navigation links |
| `<main>` | `main` | Primary content |
| `<aside>` | `complementary` | Sidebar content |
| `<footer>` | `contentinfo` | Site footer |

Screen reader users navigate landmarks with shortcut keys. Missing landmarks means they must tab through every element.

## Anchor Elements

```html
<!-- BAD: not a real link -->
<a>Click here</a>
<a onClick={go}>Next</a>

<!-- GOOD: navigable link -->
<a href="/next">Next page</a>
```

An `<a>` without `href` is not focusable or announced as a link.

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 1.3.1 | A | Info and Relationships |
| 2.1.1 | A | Keyboard accessible |
| 2.4.1 | A | Bypass blocks (landmarks) |
| 4.1.2 | A | Name, Role, Value |
