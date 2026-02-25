#!/usr/bin/env node
/**
 * scan-url.js
 * Scans for URL structure issues.
 * Usage: node scan-url.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

// Patterns that indicate poor URL structure
const BAD_URL_PATTERNS = [
  { pattern: /[A-Z]/, message: 'contains uppercase characters', fix: 'Use lowercase-only URL segments' },
  { pattern: /[_]/, message: 'uses underscores', fix: 'Replace underscores with hyphens in URL segments' },
  { pattern: /\s/, message: 'contains spaces', fix: 'Replace spaces with hyphens' },
  { pattern: /[^a-zA-Z0-9\-\[\].]/, message: 'contains special characters', fix: 'Use only lowercase letters, numbers, and hyphens' }
];

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const RANDOM_ID_PATTERN = /^[a-z0-9]{20,}$/i;

function scanUrls() {
  const issues = [];

  switch (framework) {
    case 'nextjs':
      scanNextjsUrls(issues);
      break;
    case 'angular':
      scanAngularUrls(issues);
      break;
    case 'react':
      scanReactUrls(issues);
      break;
    case 'html':
      scanHtmlUrls(issues);
      break;
  }

  return { issues };
}

function scanNextjsUrls(issues) {
  // Check App Router directory structure
  const appDirs = ['app', 'src/app'];
  for (const appDir of appDirs) {
    const fullDir = path.join(projectRoot, appDir);
    if (!fs.existsSync(fullDir)) continue;

    scanRouteDirectory(fullDir, issues, appDir);
  }

  // Check Pages Router directory structure
  const pagesDirs = ['pages', 'src/pages'];
  for (const pagesDir of pagesDirs) {
    const fullDir = path.join(projectRoot, pagesDir);
    if (!fs.existsSync(fullDir)) continue;

    scanRouteDirectory(fullDir, issues, pagesDir);
  }
}

function scanRouteDirectory(dir, issues, basePath) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name === 'node_modules' || entry.name === 'api') continue;

      const fullPath = path.join(dir, entry.name);
      const routeSegment = entry.name;

      if (entry.isDirectory()) {
        // Skip dynamic route segments for some checks (they use [param] syntax)
        const isDynamic = routeSegment.startsWith('[') && routeSegment.endsWith(']');
        const isGroupRoute = routeSegment.startsWith('(') && routeSegment.endsWith(')');

        if (!isDynamic && !isGroupRoute) {
          // Check for bad URL patterns in directory names
          for (const check of BAD_URL_PATTERNS) {
            if (check.pattern.test(routeSegment)) {
              issues.push({
                severity: 'medium',
                category: 'url-structure',
                file: path.relative(projectRoot, fullPath),
                line: 1,
                problem: `Route segment "${routeSegment}" ${check.message}`,
                seoImpact: 'Poorly formatted URLs reduce readability and may affect search rankings.',
                recommendedFix: check.fix,
                autoFixPossible: false
              });
              break; // Only report first matching pattern per segment
            }
          }

          // Check for non-descriptive names
          if (routeSegment.length <= 2 && !['id', 'en', 'de', 'fr', 'es', 'ja', 'zh'].includes(routeSegment.toLowerCase())) {
            issues.push({
              severity: 'low',
              category: 'url-structure',
              file: path.relative(projectRoot, fullPath),
              line: 1,
              problem: `Route segment "${routeSegment}" is too short to be descriptive`,
              seoImpact: 'Short, non-descriptive URL segments provide no context to search engines.',
              recommendedFix: 'Use descriptive, keyword-rich URL segments.',
              autoFixPossible: false
            });
          }
        }

        // Check dynamic segments for random IDs
        if (isDynamic) {
          const paramName = routeSegment.slice(1, -1).replace('...', '');
          if (paramName === 'id' || paramName.match(/^[a-z]*id$/i)) {
            issues.push({
              severity: 'low',
              category: 'url-structure',
              file: path.relative(projectRoot, fullPath),
              line: 1,
              problem: `Dynamic route uses generic ID parameter: [${routeSegment.slice(1, -1)}]`,
              seoImpact: 'URLs with only numeric IDs are not descriptive. Slugs are preferred for SEO.',
              recommendedFix: 'Consider using descriptive slugs (e.g., [slug]) instead of numeric IDs.',
              autoFixPossible: false
            });
          }
        }

        scanRouteDirectory(fullPath, issues, basePath);
      }
    }
  } catch {}
}

function scanReactUrls(issues) {
  // Check for React Router routes
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) return;

  const files = findFiles(srcDir, /\.(tsx?|jsx?)$/);
  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;
    const relPath = path.relative(projectRoot, file);
    const lines = content.split('\n');

    // Find Route path definitions
    const routePattern = /path=["']([^"']+)["']/g;
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const routePath = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Check for query-heavy routing
      if (routePath.includes('?') || routePath.includes('&')) {
        issues.push({
          severity: 'medium',
          category: 'url-structure',
          file: relPath,
          line: lineNum,
          problem: `Route uses query parameters: "${routePath}"`,
          seoImpact: 'Query-based routing is less SEO-friendly than clean URL paths.',
          recommendedFix: 'Use path-based routing instead of query parameters for content pages.',
          autoFixPossible: false
        });
      }

      // Check segments
      const segments = routePath.split('/').filter(Boolean);
      for (const segment of segments) {
        if (segment.startsWith(':')) continue; // Skip params
        for (const check of BAD_URL_PATTERNS) {
          if (check.pattern.test(segment)) {
            issues.push({
              severity: 'medium',
              category: 'url-structure',
              file: relPath,
              line: lineNum,
              problem: `Route segment "${segment}" ${check.message}`,
              seoImpact: 'Poorly formatted URLs reduce readability.',
              recommendedFix: check.fix,
              autoFixPossible: false
            });
            break;
          }
        }
      }
    }
  }
}

function scanAngularUrls(issues) {
  // Check Angular routing modules
  const srcDir = path.join(projectRoot, 'src');
  if (!fs.existsSync(srcDir)) return;

  const files = findFiles(srcDir, /routing\.module\.ts$|\.routes\.ts$/);
  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;
    const relPath = path.relative(projectRoot, file);

    const pathPattern = /path:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = pathPattern.exec(content)) !== null) {
      const routePath = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;

      const segments = routePath.split('/').filter(Boolean);
      for (const segment of segments) {
        if (segment.startsWith(':')) continue;
        for (const check of BAD_URL_PATTERNS) {
          if (check.pattern.test(segment)) {
            issues.push({
              severity: 'medium',
              category: 'url-structure',
              file: relPath,
              line: lineNum,
              problem: `Route segment "${segment}" ${check.message}`,
              seoImpact: 'Poorly formatted URLs reduce readability.',
              recommendedFix: check.fix,
              autoFixPossible: false
            });
            break;
          }
        }
      }
    }
  }
}

function scanHtmlUrls(issues) {
  const htmlFiles = findFiles(projectRoot, /\.html?$/i);

  for (const file of htmlFiles) {
    const relPath = path.relative(projectRoot, file);
    const basename = path.basename(file, path.extname(file));

    // Check filename conventions
    if (basename !== 'index') {
      for (const check of BAD_URL_PATTERNS) {
        if (check.pattern.test(basename)) {
          issues.push({
            severity: 'medium',
            category: 'url-structure',
            file: relPath,
            line: 1,
            problem: `Filename "${path.basename(file)}" ${check.message}`,
            seoImpact: 'File names directly map to URLs. Clean filenames create clean URLs.',
            recommendedFix: check.fix,
            autoFixPossible: false
          });
          break;
        }
      }
    }
  }
}

function findFiles(dir, pattern, maxDepth = 10, depth = 0) {
  const results = [];
  if (depth > maxDepth || !fs.existsSync(dir)) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.next') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findFiles(fullPath, pattern, maxDepth, depth + 1));
      else if (pattern.test(entry.name)) results.push(fullPath);
    }
  } catch {}
  return results;
}

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

try {
  console.log(JSON.stringify(scanUrls(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
