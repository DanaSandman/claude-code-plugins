# Static HTML SEO Guide

## Advantages

Static HTML is inherently SEO-friendly:
- Content immediately available to crawlers
- No JavaScript execution required
- Fast loading times
- Simple URL structure

## Essential SEO Elements

### Required in Every Page
1. `<!DOCTYPE html>` declaration
2. `<html lang="en">` with language attribute
3. `<title>` — unique per page
4. `<meta name="description">` — unique per page
5. `<meta name="viewport">` — responsive design
6. Single `<h1>` tag
7. Semantic HTML structure

### Recommended Elements
- Canonical URL: `<link rel="canonical" href="...">`
- Open Graph tags for social sharing
- Structured data (JSON-LD)
- Sitemap.xml
- robots.txt

## Detection Checklist

- [ ] Every HTML file has a `<title>` tag
- [ ] Every HTML file has a `<meta name="description">`
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Semantic landmarks (header, nav, main, footer)
- [ ] All images have alt attributes
- [ ] Internal links are not broken
- [ ] Clean, descriptive filenames (kebab-case)

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Missing title | Page won't display properly in SERPs | Add unique title per page |
| Duplicate titles | Confuses search engines | Make titles unique |
| No meta description | Auto-generated snippets | Add descriptive meta tag |
| Missing alt text | Images not indexed | Add alt to all content images |
| Broken links | Wasted crawl budget | Fix or remove broken hrefs |
