# Changelog — seo-plugin

All notable changes to the SEO plugin will be documented in this file.

---

## [1.0.0] - 2026-02-26

Initial release.

### Added
- SEO audit skill: scans 9 categories (rendering, titles, meta, headings, semantic HTML, URLs, images, internal links, GTM).
- SEO fix skill: auto-fixes detected issues by ID, category, or all at once.
- Commands: `/seo-audit`, `/seo-fix`, `/seo-check`.
- Hook: auto-lint on every edited frontend file (missing alt, multiple H1, empty titles, duplicate GTM, use client on SEO pages).
