# React SPA SEO Guide

## Core Challenge

React SPAs render content client-side via JavaScript. Search engines must execute JavaScript to see content, which leads to:
- Delayed or incomplete indexing
- Missing metadata in initial HTML
- Slower First Contentful Paint

## Mitigation Strategies

### 1. Pre-rendering (react-snap, react-snapshot)
- Generates static HTML at build time
- Search engines see fully rendered content
- Best option for SPAs that cannot migrate to SSR

### 2. React Helmet / React Helmet Async
- Manages `<head>` tags per route
- Provides title, meta description, Open Graph tags
- **Required** for any React SPA with SEO needs

### 3. Static Site Generation (Gatsby, etc.)
- Generates static HTML pages at build time
- Full SSG capabilities with React components

### 4. Migration to SSR Framework
- Next.js or Remix for full server-side rendering
- Best long-term solution for SEO-critical React apps

## Detection Checklist

- [ ] Check for react-helmet or react-helmet-async dependency
- [ ] Check for pre-rendering library (react-snap, react-snapshot)
- [ ] Verify index.html has meaningful title and meta description
- [ ] Check if content is visible without JavaScript

## Key Limitations

| Aspect | Impact |
|--------|--------|
| No SSR | Google can index JS-rendered content but other engines may not |
| Client routing | Each route may share same initial HTML |
| Dynamic metadata | Requires Helmet; not available in initial HTML without prerender |
| Core Web Vitals | Larger JS bundles increase LCP and TBT |
