# Forms Accessibility Guide

## Every Input Needs a Label

Screen readers announce the label when an input is focused. Without a label, users don't know what to enter.

### Methods of Labeling (in order of preference)

1. **Visible `<label>` with `htmlFor`** (best):
```html
<label for="email">Email address</label>
<input id="email" type="email" />
```

2. **Wrapping `<label>`**:
```html
<label>
  Email address
  <input type="email" />
</label>
```

3. **`aria-labelledby`** (references visible text):
```html
<h2 id="contact-heading">Contact us</h2>
<input aria-labelledby="contact-heading" type="text" />
```

4. **`aria-label`** (invisible label, last resort):
```html
<input aria-label="Search" type="search" />
```

## Placeholder Is Not a Label

```html
<!-- BAD: placeholder disappears on focus -->
<input placeholder="Enter your name" />

<!-- GOOD: visible label + optional placeholder -->
<label for="name">Name</label>
<input id="name" placeholder="e.g. John Smith" />
```

Placeholders disappear when the user starts typing, leaving no indication of what the field expects.

## Error Handling

### Associate errors with inputs

```html
<label for="email">Email</label>
<input id="email" type="email" aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Please enter a valid email.</span>
```

### Error containers need aria-live

```html
<div role="alert" aria-live="assertive">
  Please fix the errors below.
</div>
```

## Fieldset and Legend

Group related controls (radio buttons, checkboxes) with `<fieldset>` and `<legend>`:

```html
<fieldset>
  <legend>Notification preferences</legend>
  <label><input type="checkbox" /> Email</label>
  <label><input type="checkbox" /> SMS</label>
</fieldset>
```

## WCAG Criteria

| Criterion | Level | Description |
|-----------|-------|-------------|
| 1.3.1 | A | Info and Relationships |
| 3.3.1 | A | Error Identification |
| 3.3.2 | A | Labels or Instructions |
| 4.1.2 | A | Name, Role, Value |
