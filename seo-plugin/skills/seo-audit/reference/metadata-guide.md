# Metadata SEO Guide

## Title Tag

### Rules
- **Length**: 50-60 characters (Google truncates at ~60)
- **Uniqueness**: Every page must have a unique title
- **Format**: `Primary Keyword - Secondary Info | Brand`
- **Placement**: Inside `<head>` element

### Best Practices
- Front-load important keywords
- Include brand name (usually at end)
- Be descriptive and specific
- Avoid keyword stuffing
- Avoid generic titles ("Home", "Page 1")

### Framework-Specific
| Framework | Method |
|-----------|--------|
| Next.js (App Router) | `export const metadata = { title: '...' }` |
| Next.js (Pages Router) | `<Head><title>...</title></Head>` |
| React | `<Helmet><title>...</title></Helmet>` |
| Angular | `titleService.setTitle('...')` |
| HTML | `<title>...</title>` |

## Meta Description

### Rules
- **Length**: 120-160 characters
- **Uniqueness**: Every page should have a unique description
- **Content**: Summarize page content, include call-to-action
- **Placement**: `<meta name="description" content="...">`

### Best Practices
- Include primary keyword naturally
- Write compelling copy (it's your SERP ad)
- Avoid duplicate descriptions across pages
- Don't use quotes that break the attribute

## Open Graph Tags

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
```

## Canonical URL

```html
<link rel="canonical" href="https://example.com/preferred-url">
```

Prevents duplicate content issues when same content is accessible via multiple URLs.

## Robots Meta

```html
<meta name="robots" content="index, follow">
```

Controls crawling and indexing behavior per page.
