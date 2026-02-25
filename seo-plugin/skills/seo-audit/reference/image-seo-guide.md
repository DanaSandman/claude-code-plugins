# Image SEO Guide

## Alt Text

### Rules
- Every content image MUST have an `alt` attribute
- Alt text should describe the image content concisely
- Decorative images: use `alt=""` with `role="presentation"`
- Avoid: "image of", "picture of" prefixes
- Include keywords naturally, don't stuff

### Examples
- Good: `alt="Golden retriever playing fetch in a park"`
- Bad: `alt="image"`, `alt="photo"`, `alt="IMG_0234.jpg"`
- Decorative: `alt="" role="presentation"`

## Next.js Image Component

### Benefits of `next/image`
- Automatic WebP/AVIF conversion
- Responsive image sizing
- Lazy loading by default
- Prevents Cumulative Layout Shift (CLS)
- Automatic srcset generation

### Usage
```tsx
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Description"
  width={800}
  height={600}
/>
```

### Common Mistakes
- Using native `<img>` instead of `<Image>`
- Missing `alt` prop
- Missing `width`/`height` (required unless using `fill`)
- Using `unoptimized` prop unnecessarily

## Core Web Vitals Impact

| Metric | Image Impact |
|--------|-------------|
| LCP (Largest Contentful Paint) | Large unoptimized images slow LCP |
| CLS (Cumulative Layout Shift) | Missing dimensions cause layout shift |
| FID/INP | Heavy image decoding blocks main thread |

## Best Practices

1. Use framework image components when available
2. Always provide alt text for content images
3. Specify width and height to prevent CLS
4. Use modern formats (WebP, AVIF)
5. Implement lazy loading for below-fold images
6. Compress images before upload
7. Use descriptive filenames (not IMG_0234.jpg)
