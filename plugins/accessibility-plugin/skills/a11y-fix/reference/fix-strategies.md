# Accessibility Fix Strategies

## Safety Principles

1. **Always backup** before modifying files (`.bak` extension)
2. **Never auto-fix dynamic content** — live regions require context-specific decisions
3. **Verify after fixing** — read the file after modification to ensure correctness
4. **Prefer minimal changes** — change only what's needed, preserve surrounding code
5. **Use TODO placeholders** — never guess at labels or descriptions

## Fix Strategies by Category

### Semantics (Partially Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| `<div onClick>` without role | Replace with `<button type="button">` | Yes |
| Missing tabindex on role element | Add `tabindex="0"` | Yes |
| Missing landmarks | Needs manual identification | No |
| Heading hierarchy | Needs content decision | No |
| Anchor without href | Needs manual review | No |

### Accessible Names (Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| Button with no name | Add `aria-label="TODO: label"` | Yes |
| Link with no name | Add `aria-label="TODO: label"` | Yes |
| Self-closing button | Add `aria-label="TODO: label"` before `/>` | Yes |
| Empty aria-label (has visible text) | Remove empty aria-label | Yes |
| Empty aria-label (no visible text) | Replace with `aria-label="TODO: label"` | Yes |
| Icon-only button | Add `aria-label="TODO: label"` | Yes |
| SVG missing accessible name | Needs manual review | No |

### Images (Partially Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| `<img>` missing alt | Add `alt="TODO: describe image"` or `alt=""` (decorative) | Yes |
| Next.js Image missing alt | Add `alt="TODO: describe image"` | Yes |
| Decorative img missing `alt=""` | Add `alt=""` | Yes |
| `role="img"` without name | Needs manual review | No |

**Decorative detection**: If the `src` or `class` contains hints like `icon`, `decorat`, `separator`, `divider`, `spacer`, `background`, `bg-`, `ornament`, the image is treated as decorative and gets `alt=""`.

### Forms (Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| Placeholder as only label | Add `aria-label` with placeholder value | Yes |
| Input with no label | Add `aria-label="TODO: label"` | Yes |
| Missing fieldset/legend | Needs manual grouping | No |
| Missing error association | Needs manual review | No |

### ARIA (Partially Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| Redundant role | Remove the redundant `role` attribute | Yes |
| aria-hidden on focusable | Needs manual review | No |
| Broken ARIA references | Needs manual review | No |
| Missing aria-expanded | Needs manual review | No |

### Keyboard (Partially Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| `tabindex > 0` | Change to `tabindex="0"` | Yes |
| Missing tabindex on keyed element | Add `tabindex="0"` | Yes |
| onClick without keyboard handler | Needs manual review (use `<button>`) | No |
| CSS focus removal | Needs manual review | No |

### Patterns (Partially Auto-fixable)

| Issue | Fix | Auto? |
|-------|-----|-------|
| Dialog missing `role="dialog"` | Add `role="dialog" aria-modal="true"` | Yes |
| Dialog missing `aria-modal` | Add `aria-modal="true"` after role | Yes |
| Dialog missing title | Add `aria-label="Dialog"` | Yes |
| Tabs missing ARIA | Needs manual review | No |
| Menu button missing aria-expanded | Needs manual review | No |

### Dynamic Content (MANUAL ONLY)

Dynamic content fixes are **never auto-applied**. Always present recommendations:

| Issue | Recommendation |
|-------|---------------|
| Toast missing aria-live | Add `aria-live="polite"` to toast container |
| Spinner without text | Add `aria-label` or visually hidden text |
| Status missing live region | Add `role="status"` or `aria-live="polite"` |
| aria-busy without live region | Wrap in `aria-live` region |

## Post-Fix Verification

After applying fixes:
1. Read modified files to verify changes
2. Check that no syntax errors were introduced
3. Recommend running `/a11y-audit` again to verify improvements
4. List any remaining manual fixes and TODO placeholders
