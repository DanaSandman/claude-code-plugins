# UI Patterns Accessibility Guide

## Dialogs / Modals

Dialogs must announce themselves and trap focus.

### Required Attributes

```html
<div role="dialog" aria-modal="true" aria-label="Confirm deletion">
  <h2>Delete item?</h2>
  <p>This action cannot be undone.</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

| Attribute | Purpose |
|-----------|---------|
| `role="dialog"` | Announces as a dialog |
| `aria-modal="true"` | Tells AT that content behind is inert |
| `aria-label` or `aria-labelledby` | Provides an accessible title |

### Keyboard Behavior

- **Escape** closes the dialog
- **Tab** cycles within the dialog (focus trap)
- Focus moves to dialog on open, returns to trigger on close

### HTML `<dialog>` Element

The native `<dialog>` element with `.showModal()` provides most of these automatically:

```html
<dialog>
  <h2>Title</h2>
  <button onclick="this.closest('dialog').close()">Close</button>
</dialog>
```

## Tabs

### Required ARIA

```html
<div role="tablist" aria-label="Product info">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Details</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Reviews</button>
</div>
<div role="tabpanel" id="panel-1">...</div>
<div role="tabpanel" id="panel-2" hidden>...</div>
```

### Keyboard Behavior

- **Arrow Left/Right** moves between tabs
- **Home/End** moves to first/last tab
- **Tab** moves from tablist into the active panel

## Menu Buttons

```html
<button aria-expanded="false" aria-haspopup="true" aria-controls="menu">
  Options
</button>
<ul role="menu" id="menu" hidden>
  <li role="menuitem">Edit</li>
  <li role="menuitem">Delete</li>
</ul>
```

### Required Behavior

- `aria-expanded` toggles between `"true"` and `"false"`
- **Escape** closes the menu
- **Arrow Up/Down** navigates menu items

## Accordions

```html
<h3>
  <button aria-expanded="false" aria-controls="section-1">
    Section title
  </button>
</h3>
<div id="section-1" hidden>Content...</div>
```

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 1.3.1 | A | Info and Relationships |
| 2.1.1 | A | Keyboard |
| 2.1.2 | A | No Keyboard Trap |
| 4.1.2 | A | Name, Role, Value |
| 4.1.3 | A | Status Messages |
