# Internal Linking SEO Guide

## Why Internal Links Matter

- Distribute page authority (PageRank) across the site
- Help search engines discover and index pages
- Establish content hierarchy and relationships
- Improve user navigation and engagement

## Framework Link Components

| Framework | Component | Import |
|-----------|-----------|--------|
| Next.js | `<Link>` | `import Link from 'next/link'` |
| React Router | `<Link>` | `import { Link } from 'react-router-dom'` |
| Angular | `routerLink` | `routerLink="/path"` directive |
| HTML | `<a>` | Native element |

## Why Use Framework Link Components

### Next.js `<Link>`
- Client-side navigation (no full page reload)
- Automatic prefetching of linked pages
- Preserves client-side state
- Better performance and UX

### React Router `<Link>`
- SPA navigation without reload
- Preserves application state
- Programmatic navigation support

### Angular `routerLink`
- SPA navigation
- Active link styling support
- Route parameter binding

## Best Practices

1. **Use descriptive anchor text**: "Read our pricing guide" not "click here"
2. **Link to related content**: Help users and crawlers find related pages
3. **Fix broken links**: Regularly audit for 404s
4. **Avoid orphan pages**: Every page should be linked from at least one other page
5. **Use framework components**: Always use Link/routerLink for internal navigation
6. **Avoid empty links**: Every link must have text content or aria-label

## Detection Checklist

- [ ] Internal links use framework Link component (not `<a>` for SPA navigation)
- [ ] No broken internal links (target exists)
- [ ] Links have descriptive anchor text
- [ ] No empty links (missing text content)
- [ ] Important pages are linked from navigation or content
