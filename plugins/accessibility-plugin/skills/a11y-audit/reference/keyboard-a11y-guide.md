# Keyboard Accessibility Guide

## Why Keyboard Access Matters

Many users navigate entirely by keyboard: screen reader users, motor-impaired users, and power users. Every interactive element must be reachable and operable via keyboard.

## Focus Order

Focus should follow a logical reading order (usually left-to-right, top-to-bottom in LTR languages).

### tabindex Values

| Value | Behavior |
|-------|----------|
| `tabindex="0"` | Element is focusable in DOM order (correct) |
| `tabindex="-1"` | Focusable via script only, not via Tab (correct for programmatic focus) |
| `tabindex="1+"` | Element jumps ahead in focus order (almost always wrong) |

**Positive tabindex** creates unpredictable focus order. Use `tabindex="0"` and rely on DOM order instead.

## Focus Visibility

Users must see which element is focused. Removing focus outlines makes the page unusable for keyboard users.

```css
/* BAD: removes all focus indicators */
*:focus { outline: none; }
button:focus { outline: 0; }

/* GOOD: custom focus style */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

WCAG 2.4.7 requires visible focus indicators. If you remove the default outline, replace it with a visible alternative.

## Keyboard Handlers

Interactive custom elements need keyboard support:

```html
<!-- BAD: mouse-only interaction -->
<div onClick={handleClick}>Action</div>

<!-- GOOD: keyboard + mouse -->
<button type="button" onClick={handleClick}>Action</button>

<!-- If you must use a div: -->
<div
  role="button"
  tabindex="0"
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
>
  Action
</div>
```

### Mouse-Only Events

These events have no keyboard equivalent without explicit handling:
- `onMouseDown` / `onMouseUp`
- `onMouseEnter` / `onMouseLeave`
- `onHover`

## Common Issues

| Issue | Fix |
|-------|-----|
| `tabindex > 0` | Change to `tabindex="0"` |
| `outline: none` without replacement | Add `:focus-visible` style |
| `onClick` without `onKeyDown` | Use `<button>` or add keyboard handler |
| `onKeyDown` without `tabindex` | Add `tabindex="0"` |

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 2.1.1 | A | Keyboard |
| 2.1.2 | A | No Keyboard Trap |
| 2.4.3 | A | Focus Order |
| 2.4.7 | AA | Focus Visible |
