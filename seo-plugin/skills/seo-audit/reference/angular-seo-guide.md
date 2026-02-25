# Angular SEO Guide

## Core Challenge

Angular applications render content client-side by default. Without Angular Universal (SSR), search engines must execute JavaScript to see content.

## Angular Universal (SSR)

### Required Packages
- `@angular/platform-server`
- `@nguniversal/express-engine` (or other engine)

### Detection
- Check `package.json` for `@angular/platform-server`
- Check `angular.json` for `server` build target
- Check for `server.ts` or `main.server.ts`

### Benefits
- Server-rendered HTML for search engines
- Faster First Contentful Paint
- Full metadata available on initial load

## Dynamic Metadata

### Title Service
```typescript
import { Title } from '@angular/platform-browser';

constructor(private titleService: Title) {
  this.titleService.setTitle('Page Title');
}
```

### Meta Service
```typescript
import { Meta } from '@angular/platform-browser';

constructor(private metaService: Meta) {
  this.metaService.updateTag({ name: 'description', content: 'Page description' });
}
```

## Detection Checklist

- [ ] Check for Angular Universal packages
- [ ] Verify server build target in angular.json
- [ ] Check for Title service usage across route components
- [ ] Check for Meta service usage across route components
- [ ] Verify SSR is producing correct HTML output

## Common Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No Angular Universal | Content invisible to crawlers | Add @angular/platform-server |
| Missing Title service | All pages share same title | Use Title service per route |
| Missing Meta service | No per-page descriptions | Use Meta service per route |
| Client-only routing | Hash-based URLs not indexable | Use PathLocationStrategy |
