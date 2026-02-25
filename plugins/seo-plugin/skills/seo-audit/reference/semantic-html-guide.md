# Semantic HTML SEO Guide

## Why Semantic HTML Matters for SEO

Semantic HTML provides meaning and structure to content. Search engines use semantic tags to:
- Understand content hierarchy and relationships
- Identify primary vs. supplementary content
- Determine navigation structure
- Improve accessibility (which correlates with SEO)

## Essential Landmark Elements

| Element | Purpose | Usage |
|---------|---------|-------|
| `<header>` | Introductory content, site header | One per page for site header; can nest in sections |
| `<nav>` | Navigation links | Primary and secondary navigation |
| `<main>` | Primary content area | **One per page**, must be unique |
| `<section>` | Thematic grouping | Group related content with a heading |
| `<article>` | Self-contained content | Blog posts, news articles, comments |
| `<aside>` | Supplementary content | Sidebars, related links, ads |
| `<footer>` | Footer content | Copyright, contact info, site links |

## Correct Page Structure

```html
<body>
  <header>
    <nav>...</nav>
  </header>
  <main>
    <article>
      <h1>Page Title</h1>
      <section>
        <h2>Section Title</h2>
        ...
      </section>
    </article>
    <aside>...</aside>
  </main>
  <footer>...</footer>
</body>
```

## Div-itis Detection

**Div-itis**: Over-reliance on `<div>` elements where semantic tags would be appropriate.

### Signs of Div-itis
- More than 70% of container elements are `<div>`
- No `<main>`, `<header>`, `<footer>` present
- Navigation links wrapped only in `<div>` (not `<nav>`)
- Content sections using `<div>` instead of `<section>` or `<article>`

### When `<div>` Is Appropriate
- Layout/styling containers with no semantic meaning
- Wrapper elements for CSS grid/flexbox
- Generic grouping where no semantic tag fits

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Missing `<main>` | Crawlers can't identify primary content | Wrap main content in `<main>` |
| Multiple `<main>` | Invalid HTML, confuses parsers | Keep only one `<main>` |
| No `<nav>` for navigation | Navigation not machine-identifiable | Wrap nav links in `<nav>` |
| `<div>` soup | Poor semantic signal | Replace with appropriate semantic tags |
