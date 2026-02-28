# ARIA Accessibility Guide

## First Rule of ARIA

> No ARIA is better than bad ARIA.

Use native HTML elements first. Only add ARIA when native semantics are insufficient.

## Redundant Roles

Adding a role that matches the element's implicit role is redundant and should be removed:

| Element | Implicit Role | Redundant |
|---------|--------------|-----------|
| `<button>` | `button` | `role="button"` |
| `<nav>` | `navigation` | `role="navigation"` |
| `<main>` | `main` | `role="main"` |
| `<header>` | `banner` | `role="banner"` |
| `<footer>` | `contentinfo` | `role="contentinfo"` |
| `<aside>` | `complementary` | `role="complementary"` |
| `<a href>` | `link` | `role="link"` |
| `<input type="text">` | `textbox` | `role="textbox"` |
| `<input type="checkbox">` | `checkbox` | `role="checkbox"` |
| `<select>` | `listbox` | `role="listbox"` |
| `<table>` | `table` | `role="table"` |

## aria-hidden

`aria-hidden="true"` hides an element from assistive technologies.

### Danger: aria-hidden on focusable elements

```html
<!-- BAD: button is hidden but still focusable via Tab -->
<button aria-hidden="true">Close</button>

<!-- BAD: container is hidden but child is focusable -->
<div aria-hidden="true">
  <a href="/home">Home</a>
</div>
```

If an element is aria-hidden, it and all descendants must NOT be focusable.

## ARIA References

`aria-controls`, `aria-labelledby`, and `aria-describedby` reference other element IDs.

```html
<!-- The referenced ID must exist in the same document -->
<button aria-controls="menu-panel">Menu</button>
<div id="menu-panel">...</div>
```

Broken references (pointing to non-existent IDs) silently fail and provide no accessibility benefit.

## aria-expanded

Disclosure controls (buttons that show/hide content) must have `aria-expanded`:

```html
<button aria-expanded="false" aria-controls="details">
  Show details
</button>
<div id="details" hidden>...</div>
```

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 1.3.1 | A | Info and Relationships |
| 4.1.2 | A | Name, Role, Value |
