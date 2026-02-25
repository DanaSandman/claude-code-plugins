# Next.js Rendering & SEO Guide

## Rendering Priority (Best to Worst for SEO)

1. **SSG (Static Site Generation)** — Best for SEO
   - Pages pre-rendered at build time
   - Fastest TTFB, fully indexable
   - Use `generateStaticParams` (App Router) or `getStaticPaths` + `getStaticProps` (Pages Router)

2. **ISR (Incremental Static Regeneration)** — Excellent for SEO
   - Static pages that revalidate periodically
   - Use `revalidate` option in fetch or route segment config
   - Combines static speed with dynamic freshness

3. **SSR (Server-Side Rendering)** — Good for SEO
   - Rendered on each request
   - Use when data must be fresh on every request
   - Slower than SSG/ISR but fully indexable

4. **Client Components** — Worst for SEO
   - Content rendered via JavaScript in browser
   - Search engines may not index client-rendered content
   - Use only for interactive UI that doesn't contain SEO content

## App Router Patterns

### Server Components (Default)
- All components in `app/` are Server Components by default
- Server Components can fetch data directly
- Content is fully indexable by search engines

### Client Components
- Marked with `"use client"` directive
- Required for: useState, useEffect, event handlers, browser APIs
- **Rule**: Push `"use client"` as low as possible in the component tree

### Metadata API
```tsx
// Static metadata
export const metadata = {
  title: 'Page Title',
  description: 'Page description'
};

// Dynamic metadata
export async function generateMetadata({ params }) {
  return { title: `Dynamic - ${params.slug}` };
}
```

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| `"use client"` on page.tsx | SEO content client-rendered | Extract interactive parts to child components |
| Missing `generateStaticParams` | Dynamic routes use SSR | Add param generation for known paths |
| fetch() without cache config | Unpredictable caching | Add `cache: 'force-cache'` or `next: { revalidate: N }` |
| getServerSideProps on static content | Unnecessary SSR | Switch to getStaticProps + revalidate |

## Detection Checklist

- [ ] Check for `"use client"` in page/layout files
- [ ] Verify dynamic routes have `generateStaticParams`
- [ ] Check fetch calls have explicit cache strategy
- [ ] Verify Pages Router pages have data fetching methods
- [ ] Check SSR pages that could be SSG
