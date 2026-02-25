#!/usr/bin/env node
/**
 * scan-rendering.js
 * Framework-specific rendering strategy analysis.
 * Usage: node scan-rendering.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanRendering() {
  const issues = [];

  switch (framework) {
    case 'nextjs':
      scanNextjs(issues);
      break;
    case 'react':
      scanReact(issues);
      break;
    case 'angular':
      scanAngular(issues);
      break;
    case 'html':
      // Static HTML has no rendering issues
      break;
  }

  return { issues };
}

function scanNextjs(issues) {
  // Find page/layout files in app/ or src/app/
  const appDirs = [
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'src', 'app')
  ];

  const pagesDirs = [
    path.join(projectRoot, 'pages'),
    path.join(projectRoot, 'src', 'pages')
  ];

  // Scan App Router files
  for (const appDir of appDirs) {
    if (!fs.existsSync(appDir)) continue;
    const files = findFiles(appDir, /\.(tsx?|jsx?)$/);

    for (const file of files) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;
      const lines = content.split('\n');

      // Check for "use client" in page/layout files
      const isPage = path.basename(file).match(/^(page|layout)\.(tsx?|jsx?)$/);
      const hasUseClient = lines.findIndex(l => l.trim().match(/^['"]use client['"]/)) !== -1;
      const useClientLine = lines.findIndex(l => l.trim().match(/^['"]use client['"]/));

      if (isPage && hasUseClient) {
        // Check if it renders SEO-critical content (h1, title, meta-like patterns)
        const hasSeoContent = content.match(/<h1|<title|metadata|generateMetadata|<meta/i);
        if (hasSeoContent) {
          issues.push({
            severity: 'critical',
            category: 'rendering',
            file: relPath,
            line: useClientLine + 1,
            problem: "Page/layout uses 'use client' but contains SEO-critical content",
            seoImpact: 'Search engines may not index client-rendered SEO content. Server Components are preferred for SEO-critical pages.',
            recommendedFix: "Move SEO-critical content to a Server Component. Extract interactive parts into separate client components.",
            autoFixPossible: false
          });
        } else {
          issues.push({
            severity: 'medium',
            category: 'rendering',
            file: relPath,
            line: useClientLine + 1,
            problem: "Page/layout uses 'use client' directive",
            seoImpact: 'Client-rendered pages may have delayed indexing. Consider if server rendering is more appropriate.',
            recommendedFix: "Evaluate if this page needs client-side interactivity. If not, remove 'use client' to leverage Server Components.",
            autoFixPossible: false
          });
        }
      }

      // Check for missing generateStaticParams in dynamic routes
      const isDynamicRoute = relPath.includes('[');
      if (isDynamicRoute && isPage) {
        const hasGenerateStaticParams = content.includes('generateStaticParams');
        if (!hasGenerateStaticParams) {
          issues.push({
            severity: 'high',
            category: 'rendering',
            file: relPath,
            line: 1,
            problem: 'Dynamic route page missing generateStaticParams',
            seoImpact: 'Without generateStaticParams, dynamic pages use SSR instead of SSG. Static generation provides faster loading and better crawlability.',
            recommendedFix: "Add generateStaticParams() to pre-generate static pages for known paths.",
            autoFixPossible: false
          });
        }
      }

      // Check fetch caching strategy
      const fetchMatches = [...content.matchAll(/fetch\s*\(/g)];
      for (const match of fetchMatches) {
        const fetchStart = match.index;
        const fetchContext = content.substring(fetchStart, fetchStart + 200);

        if (!fetchContext.includes('cache') && !fetchContext.includes('revalidate') && !fetchContext.includes('next:')) {
          const lineNum = content.substring(0, fetchStart).split('\n').length;
          issues.push({
            severity: 'low',
            category: 'rendering',
            file: relPath,
            line: lineNum,
            problem: 'fetch() call without explicit caching strategy',
            seoImpact: 'Without explicit cache configuration, fetch behavior depends on defaults. Explicit caching improves performance and SEO.',
            recommendedFix: "Add cache: 'force-cache' for static data, or next: { revalidate: N } for ISR.",
            autoFixPossible: false
          });
        }
      }
    }
  }

  // Scan Pages Router files
  for (const pagesDir of pagesDirs) {
    if (!fs.existsSync(pagesDir)) continue;
    const files = findFiles(pagesDir, /\.(tsx?|jsx?)$/);

    for (const file of files) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;

      const hasGetStaticProps = content.includes('getStaticProps');
      const hasGetServerSideProps = content.includes('getServerSideProps');
      const hasGetStaticPaths = content.includes('getStaticPaths');
      const isDynamic = relPath.includes('[');

      // Page with neither static nor server-side data fetching
      if (!hasGetStaticProps && !hasGetServerSideProps && !path.basename(file).startsWith('_')) {
        issues.push({
          severity: 'medium',
          category: 'rendering',
          file: relPath,
          line: 1,
          problem: 'Page has no data fetching method (getStaticProps or getServerSideProps)',
          seoImpact: 'Page renders client-side only. Content may not be available to search engine crawlers.',
          recommendedFix: "Add getStaticProps for static content or getServerSideProps for dynamic content.",
          autoFixPossible: false
        });
      }

      // SSR page that could be SSG
      if (hasGetServerSideProps && !isDynamic) {
        issues.push({
          severity: 'medium',
          category: 'rendering',
          file: relPath,
          line: content.split('\n').findIndex(l => l.includes('getServerSideProps')) + 1,
          problem: 'Non-dynamic page uses getServerSideProps instead of getStaticProps',
          seoImpact: 'SSR is slower than SSG. Static pages load faster and are more reliably indexed.',
          recommendedFix: "Consider using getStaticProps with revalidate for ISR if data changes periodically.",
          autoFixPossible: false
        });
      }

      // Dynamic route without getStaticPaths
      if (isDynamic && hasGetStaticProps && !hasGetStaticPaths) {
        issues.push({
          severity: 'high',
          category: 'rendering',
          file: relPath,
          line: 1,
          problem: 'Dynamic route with getStaticProps but missing getStaticPaths',
          seoImpact: 'Without getStaticPaths, dynamic pages cannot be pre-rendered at build time.',
          recommendedFix: "Add getStaticPaths to define which dynamic routes to pre-generate.",
          autoFixPossible: false
        });
      }
    }
  }
}

function scanReact(issues) {
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch {}
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

  // Check for React Helmet
  if (!deps['react-helmet'] && !deps['react-helmet-async']) {
    issues.push({
      severity: 'high',
      category: 'rendering',
      file: 'package.json',
      line: 1,
      problem: 'No metadata management library detected (react-helmet or react-helmet-async)',
      seoImpact: 'Without server-side metadata rendering, search engines may not see page titles and descriptions.',
      recommendedFix: "Install react-helmet-async for managing document head metadata.",
      autoFixPossible: false
    });
  }

  // Check for prerender strategy
  const hasPrerender = deps['react-snap'] || deps['react-snapshot'] || deps['prerender-spa-plugin'];
  if (!hasPrerender) {
    issues.push({
      severity: 'critical',
      category: 'rendering',
      file: 'package.json',
      line: 1,
      problem: 'React SPA with no pre-rendering strategy detected',
      seoImpact: 'Single Page Applications render content client-side. Search engines may not index JavaScript-rendered content reliably.',
      recommendedFix: "Consider adding react-snap for pre-rendering, or migrating to Next.js/Remix for server-side rendering.",
      autoFixPossible: false
    });
  }

  // Warn about SPA SEO limitations
  issues.push({
    severity: 'medium',
    category: 'rendering',
    file: 'package.json',
    line: 1,
    problem: 'Project is a React SPA — SEO capabilities are inherently limited',
    seoImpact: 'SPAs rely on client-side JavaScript rendering. While Google can index JavaScript content, other search engines may not. Initial page load and Time to First Contentful Paint are slower.',
    recommendedFix: "For SEO-critical applications, consider migrating to Next.js or Remix for server-side rendering support.",
    autoFixPossible: false
  });
}

function scanAngular(issues) {
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch {}
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

  // Check for Angular Universal
  const hasUniversal = deps['@angular/platform-server'] || deps['@nguniversal/express-engine'];
  if (!hasUniversal) {
    issues.push({
      severity: 'critical',
      category: 'rendering',
      file: 'package.json',
      line: 1,
      problem: 'Angular project without server-side rendering (Angular Universal not detected)',
      seoImpact: 'Client-only Angular apps render all content via JavaScript. Search engines may not index the content.',
      recommendedFix: "Add @angular/platform-server and configure Angular Universal for SSR.",
      autoFixPossible: false
    });
  }

  // Check for Angular SSR configuration
  const angularJsonPath = path.join(projectRoot, 'angular.json');
  if (fs.existsSync(angularJsonPath)) {
    try {
      const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
      const projects = angularJson.projects || {};
      for (const [name, config] of Object.entries(projects)) {
        const architect = config.architect || {};
        if (!architect.server && hasUniversal) {
          issues.push({
            severity: 'high',
            category: 'rendering',
            file: 'angular.json',
            line: 1,
            problem: `Project "${name}" has Angular Universal dependency but no server build target`,
            seoImpact: 'SSR dependency is installed but not configured. Server-side rendering is not active.',
            recommendedFix: "Configure the 'server' build target in angular.json for SSR.",
            autoFixPossible: false
          });
        }
      }
    } catch {}
  }
}

function findFiles(dir, pattern, maxDepth = 10, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.next') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, maxDepth, currentDepth + 1));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

try {
  const result = scanRendering();
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
