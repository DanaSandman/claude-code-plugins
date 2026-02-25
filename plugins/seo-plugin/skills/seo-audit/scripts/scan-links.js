#!/usr/bin/env node
/**
 * scan-links.js
 * Scans for internal link issues.
 * Usage: node scan-links.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanLinks() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Find all <a> tags with href
    const anchorPattern = /<a\s([^>]*href\s*=\s*["']([^"']+)["'][^>]*)>/gi;
    let match;

    while ((match = anchorPattern.exec(content)) !== null) {
      const attrs = match[1];
      const href = match[2];
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Skip external links, anchors, mailto, tel
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//') ||
          href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
          href.startsWith('javascript:')) {
        continue;
      }

      // This is an internal link
      const isInternalLink = href.startsWith('/') || (!href.includes('://') && !href.startsWith('#'));

      if (isInternalLink) {
        // Framework-specific: Should use Link component instead of <a>
        if (framework === 'nextjs') {
          const hasNextLink = content.includes('next/link');
          if (!hasNextLink) {
            issues.push({
              severity: 'high',
              category: 'internal-links',
              file: relPath,
              line: lineNum,
              problem: `Using <a href="${href}"> for internal navigation instead of next/link`,
              seoImpact: 'next/link provides client-side navigation with prefetching, improving performance and user experience which impacts SEO.',
              recommendedFix: "Import Link from 'next/link' and replace <a> with <Link>.",
              autoFixPossible: true
            });
          }
        }

        if (framework === 'angular') {
          const hasRouterLink = /routerLink/i.test(attrs);
          if (!hasRouterLink) {
            issues.push({
              severity: 'high',
              category: 'internal-links',
              file: relPath,
              line: lineNum,
              problem: `Using <a href="${href}"> for internal navigation instead of routerLink`,
              seoImpact: 'routerLink enables SPA navigation without full page reloads, improving performance.',
              recommendedFix: 'Use routerLink directive: <a routerLink="/path">.',
              autoFixPossible: true
            });
          }
        }

        if (framework === 'react') {
          // Check if react-router Link is used in the file
          const hasRouterLink = content.includes('react-router') || content.includes('Link');
          const isUsingATag = true; // We already found an <a> tag
          if (hasRouterLink && isUsingATag) {
            issues.push({
              severity: 'medium',
              category: 'internal-links',
              file: relPath,
              line: lineNum,
              problem: `Using <a href="${href}"> for internal navigation instead of React Router Link`,
              seoImpact: 'React Router Link enables SPA navigation without full page reloads.',
              recommendedFix: "Replace <a> with <Link to=\"/path\"> from react-router-dom.",
              autoFixPossible: true
            });
          }
        }

        // Check for broken internal links (basic file existence check)
        if (framework === 'html' && !href.startsWith('/')) {
          const targetPath = path.resolve(path.dirname(file), href);
          if (!fs.existsSync(targetPath)) {
            issues.push({
              severity: 'high',
              category: 'internal-links',
              file: relPath,
              line: lineNum,
              problem: `Potentially broken internal link: "${href}" — target file not found`,
              seoImpact: 'Broken links create poor user experience and waste crawl budget.',
              recommendedFix: 'Fix the href to point to an existing file or remove the link.',
              autoFixPossible: false
            });
          }
        }
      }
    }

    // Check for links without text content (empty links)
    const emptyLinkPattern = /<a\s[^>]*>\s*<\/a>/gi;
    while ((match = emptyLinkPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      issues.push({
        severity: 'medium',
        category: 'internal-links',
        file: relPath,
        line: lineNum,
        problem: 'Empty link found (no anchor text)',
        seoImpact: 'Links without anchor text provide no context to search engines about the linked page.',
        recommendedFix: 'Add descriptive text inside the link or an aria-label attribute.',
        autoFixPossible: false
      });
    }
  }

  return { issues };
}

function getSourceFiles() {
  const patterns = {
    nextjs: () => {
      const files = [];
      for (const dir of ['app', 'src/app', 'src/components', 'components', 'pages', 'src/pages']) {
        const fullDir = path.join(projectRoot, dir);
        if (fs.existsSync(fullDir)) files.push(...findFiles(fullDir, /\.(tsx?|jsx?)$/));
      }
      return files;
    },
    react: () => {
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.(tsx?|jsx?)$/) : [];
    },
    angular: () => {
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.html$/) : [];
    },
    html: () => findFiles(projectRoot, /\.html?$/i)
  };
  return (patterns[framework] || patterns.html)();
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
  console.log(JSON.stringify(scanLinks(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
