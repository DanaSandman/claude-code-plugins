# Accessibility Checklist (WCAG 2.1 AA)

## Interactive Elements

### Buttons
- [ ] Use `<button>` element (not `<div onClick>`)
- [ ] Add `type="button"` or `type="submit"`
- [ ] Icon-only buttons must have `aria-label` or `sr-only` text
- [ ] Disabled buttons: use `disabled` attribute + `aria-disabled="true"`
- [ ] Visible focus ring: `focus-visible:ring-2 focus-visible:ring-ring`

### Links
- [ ] Use `<a>` for navigation, `<button>` for actions
- [ ] Descriptive text (not "click here")
- [ ] External links: add `target="_blank" rel="noopener noreferrer"` + visual indicator
- [ ] Skip-to-content link as first focusable element on page

### Forms
- [ ] Every input has a `<label>` (use `FormLabel` from shadcn)
- [ ] Error messages linked via `aria-describedby`
- [ ] Required fields: `aria-required="true"` or `required`
- [ ] Form groups wrapped in `<fieldset>` with `<legend>`
- [ ] Autocomplete attributes where applicable

## Keyboard Navigation

- [ ] All interactive elements reachable via Tab
- [ ] Logical tab order (follows visual order)
- [ ] Escape closes modals/popups
- [ ] Arrow keys navigate within groups (tabs, menus, radio)
- [ ] Enter/Space activates buttons and links
- [ ] Focus trapped inside open modals

## Color & Contrast

- [ ] Text contrast: 4.5:1 minimum (3:1 for large text)
- [ ] UI component contrast: 3:1 against background
- [ ] Never use color alone to convey information
- [ ] Dark mode maintains contrast ratios
- [ ] Focus indicators visible in both light and dark modes

## Images & Media

- [ ] Content images: descriptive `alt` text
- [ ] Decorative images: `alt="" role="presentation"`
- [ ] Complex images: `aria-describedby` linking to full description
- [ ] Icons with meaning: `aria-label` or accompanying text

## Semantic HTML

- [ ] One `<main>` per page
- [ ] Headings in order (h1 → h2 → h3, no skipping)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>`
- [ ] Tables use `<th>` with `scope`
- [ ] Navigation in `<nav>` with `aria-label`
- [ ] Sections have headings or `aria-label`

## ARIA Patterns

| Pattern | Required ARIA |
|---------|--------------|
| Modal/Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Menu | `role="menu"`, `role="menuitem"`, `aria-expanded` |
| Alert | `role="alert"` or `role="status"` for non-urgent |
| Loading | `aria-busy="true"`, `aria-live="polite"` |
| Toggle | `aria-pressed="true/false"` |
| Accordion | `aria-expanded`, `aria-controls` |
| Combobox | `role="combobox"`, `aria-expanded`, `aria-activedescendant` |

## Motion & Animation

- [ ] Respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }
  ```
- [ ] No auto-playing animations that can't be paused
- [ ] No flashing content (3 flashes per second max)

## Testing Quick Checks

1. Tab through the entire page — can you reach everything?
2. Use the page with screen reader (VoiceOver: Cmd+F5 on Mac)
3. Zoom to 200% — does layout still work?
4. Turn off CSS — does content order make sense?
