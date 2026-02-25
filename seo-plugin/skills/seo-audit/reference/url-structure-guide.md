# URL Structure SEO Guide

## SEO-Friendly URL Rules

1. **Use lowercase only**: `/about-us` not `/About-Us`
2. **Use hyphens, not underscores**: `/blog-post` not `/blog_post`
3. **Be descriptive**: `/products/running-shoes` not `/products/item-12345`
4. **Keep it short**: 3-5 words per URL segment
5. **Avoid special characters**: No spaces, ampersands, or encoded characters
6. **Avoid query parameters for content**: `/blog/seo-tips` not `/blog?id=123`
7. **Use slugs over IDs**: `/users/john-doe` not `/users/507f1f77bcf86cd`

## Framework-Specific Patterns

### Next.js File-Based Routing
```
app/
  page.tsx          → /
  about/page.tsx    → /about
  blog/
    page.tsx        → /blog
    [slug]/page.tsx → /blog/my-post-title
```

**Rules**:
- Directory names become URL segments
- Use kebab-case for directory names
- Dynamic routes should prefer slugs over IDs

### React Router
```jsx
<Route path="/products/:slug" />  // Good: uses slug
<Route path="/products/:id" />    // Less ideal: uses numeric ID
```

### Angular Routes
```typescript
{ path: 'products/:slug', component: ProductComponent }
```

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `/page?id=123` | Query params are less SEO-friendly | Use path segments: `/page/item-name` |
| `/CamelCasePath` | Uppercase in URLs | Use lowercase with hyphens |
| `/path_with_underscores` | Underscores in URLs | Replace with hyphens |
| `/p/5f3a2b` | Random IDs | Use descriptive slugs |
| `/a/b/c` | Non-descriptive segments | Use meaningful names |

## Detection Checklist

- [ ] Route segments are lowercase
- [ ] Route segments use hyphens (not underscores)
- [ ] No random IDs in static routes
- [ ] Dynamic routes prefer slugs over numeric IDs
- [ ] No query parameter routing for content pages
- [ ] File names (HTML) follow kebab-case convention
