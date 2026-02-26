# SEO Fix Strategies

## Safety Principles

1. **Always backup** before modifying files (`.bak` extension)
2. **Never auto-fix rendering** — rendering changes can break functionality
3. **Verify after fixing** — read the file after modification to ensure correctness
4. **Prefer minimal changes** — change only what's needed, preserve surrounding code

## Fix Strategies by Category

### Rendering (MANUAL ONLY)

Rendering fixes are **never auto-applied**. Always present recommendations:

| Issue | Recommendation |
|-------|---------------|
| `use client` on page.tsx | Extract interactive parts to child client components |
| Missing generateStaticParams | Add the function with known parameter values |
| No caching strategy on fetch | Add `cache: 'force-cache'` or `next: { revalidate: N }` |
| SSR page that could be SSG | Switch getServerSideProps to getStaticProps |
| React SPA without prerender | Recommend react-snap or migration to Next.js |
| Angular without Universal | Recommend adding @angular/platform-server |

### Title Fixes (Auto-fixable)

| Scenario | Fix |
|----------|-----|
| Missing title in HTML | Insert `<title>Placeholder</title>` after `<head>` |
| Empty title tag | Add placeholder text |
| Missing metadata in Next.js | Add `export const metadata = { title: '...' }` |
| Missing Head in Pages Router | Add Head import and title tag |

**Note**: All title fixes insert placeholder text that the user must update.

### Meta Description Fixes (Auto-fixable)

| Scenario | Fix |
|----------|-----|
| Missing meta tag in HTML | Insert `<meta name="description" content="...">` |
| Empty meta description | Add placeholder content |
| Missing in Next.js metadata | Add description to metadata export |

**Note**: Length issues (too short/long) cannot be auto-fixed — requires human content writing.

### Heading Fixes (Auto-fixable)

| Scenario | Fix |
|----------|-----|
| Multiple H1 tags | Convert extra H1 to H2 |
| Skipped heading level | Change tag to expected level |
| Missing H1 | Cannot auto-fix (needs content decision) |

### Semantic HTML Fixes (Partially Auto-fixable)

| Scenario | Fix | Auto? |
|----------|-----|-------|
| Missing `<main>` in HTML | Wrap content between header/footer | Yes |
| Missing `<header>` in HTML | Wrap nav in header | Yes |
| Missing `<nav>` | Needs manual identification | No |
| Missing `<footer>` | Needs manual identification | No |
| Excessive divs | Needs semantic analysis | No |

### Image Fixes (Partially Auto-fixable)

| Scenario | Fix | Auto? |
|----------|-----|-------|
| Missing alt attribute | Add `alt="TODO"` placeholder | Yes |
| Empty alt (non-decorative) | Needs content decision | No |
| `<img>` instead of next/image | Convert tag + add import | Yes |
| Missing width/height | Needs image dimensions | No |

### Internal Link Fixes (Auto-fixable)

| Scenario | Fix |
|----------|-----|
| `<a>` instead of next/link | Convert to `<Link>` + add import |
| `<a>` instead of routerLink | Add routerLink directive |
| `<a>` instead of React Router Link | Convert to `<Link to>` + add import |
| Broken internal links | Cannot auto-fix (needs content decision) |

### Google Tag Manager Fixes (Partially Auto-fixable)

| Scenario | Fix | Auto? |
|----------|-----|-------|
| GTM not installed | Add official script + noscript snippets | Yes |
| Missing noscript fallback | Add noscript iframe after `<body>` | Yes |
| Missing script tag | Add script tag in `<head>` | Yes |
| Script not in `<head>` | Needs manual relocation | No |
| Noscript not after `<body>` | Needs manual relocation | No |
| Hardcoded container ID | Needs manual env var migration | No |
| Mismatched GTM IDs | Needs manual verification | No |

**Framework-specific installation:**

| Framework | Script Method | Target File |
|-----------|--------------|-------------|
| Next.js (App Router) | `next/script` with `strategy="afterInteractive"` | `app/layout.tsx` |
| Next.js (Pages Router) | Inline `<script>` in `<Head>` | `pages/_document.tsx` |
| React / Vite / Angular / HTML | Direct HTML snippet | `index.html` |

**Note**: GTM fixes use environment variables when available (NEXT_PUBLIC_GTM_ID, VITE_GTM_ID, REACT_APP_GTM_ID). A `.env.example` file is created or updated with a placeholder entry.

## Post-Fix Verification

After applying fixes:
1. Read modified files to verify changes
2. Check that no syntax errors were introduced
3. Recommend running `seo-audit` again to verify improvements
4. List any remaining manual fixes needed
