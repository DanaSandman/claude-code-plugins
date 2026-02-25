#!/usr/bin/env node
/**
 * scan-headings.js
 * Scans for heading structure issues (H1-H6 hierarchy).
 * Usage: node scan-headings.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanHeadings() {
  const issues = [];
  const pageFiles = getPageFiles();

  for (const file of pageFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Find all heading tags (HTML and JSX)
    const headingPattern = /<(h[1-6])[^>]*>/gi;
    const headings = [];
    let match;

    while ((match = headingPattern.exec(content)) !== null) {
      const level = parseInt(match[1].charAt(1));
      const lineNum = content.substring(0, match.index).split('\n').length;
      headings.push({ level, line: lineNum, tag: match[1] });
    }

    if (headings.length === 0) continue;

    // Check for multiple H1 tags
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count > 1) {
      const h1Headings = headings.filter(h => h.level === 1);
      for (let i = 1; i < h1Headings.length; i++) {
        issues.push({
          severity: 'high',
          category: 'headings',
          file: relPath,
          line: h1Headings[i].line,
          problem: `Multiple H1 tags found (${h1Count} total). Only one H1 per page is recommended.`,
          seoImpact: 'Multiple H1 tags dilute the main topic signal for search engines.',
          recommendedFix: 'Keep only one H1 tag per page. Convert additional H1 tags to H2 or lower.',
          autoFixPossible: true
        });
      }
    }

    // Check for missing H1
    if (h1Count === 0) {
      // Only flag for page-level files, not components
      if (isPageFile(file)) {
        issues.push({
          severity: 'high',
          category: 'headings',
          file: relPath,
          line: 1,
          problem: 'Page is missing an H1 tag',
          seoImpact: 'The H1 tag is a primary signal for page topic. Missing H1 weakens SEO.',
          recommendedFix: 'Add a single H1 tag that describes the main content of the page.',
          autoFixPossible: false
        });
      }
    }

    // Check heading hierarchy (no skipped levels)
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1].level;
      const curr = headings[i].level;

      // Allow going back up to any level, but going down should not skip
      if (curr > prev && curr - prev > 1) {
        issues.push({
          severity: 'medium',
          category: 'headings',
          file: relPath,
          line: headings[i].line,
          problem: `Skipped heading level: H${prev} → H${curr} (expected H${prev + 1})`,
          seoImpact: 'Skipped heading levels break the document outline and reduce accessibility and SEO structure.',
          recommendedFix: `Change <h${curr}> to <h${prev + 1}> or add intermediate heading levels.`,
          autoFixPossible: true
        });
      }
    }

    // Check that first heading is H1 (if headings exist)
    if (headings.length > 0 && headings[0].level !== 1 && isPageFile(file)) {
      issues.push({
        severity: 'medium',
        category: 'headings',
        file: relPath,
        line: headings[0].line,
        problem: `First heading is H${headings[0].level} instead of H1`,
        seoImpact: 'The first heading on a page should be H1 to establish the main topic.',
        recommendedFix: 'Add an H1 tag before other headings, or change the first heading to H1.',
        autoFixPossible: false
      });
    }
  }

  return { issues };
}

function getPageFiles() {
  const patterns = {
    nextjs: () => {
      const files = [];
      const dirs = ['app', 'src/app', 'pages', 'src/pages'];
      for (const dir of dirs) {
        const fullDir = path.join(projectRoot, dir);
        if (fs.existsSync(fullDir)) {
          files.push(...findFiles(fullDir, /\.(tsx?|jsx?)$/));
        }
      }
      return files;
    },
    react: () => findFiles(path.join(projectRoot, 'src'), /\.(tsx?|jsx?)$/),
    angular: () => findFiles(path.join(projectRoot, 'src'), /\.html$/),
    html: () => findFiles(projectRoot, /\.html?$/i)
  };

  const getter = patterns[framework] || patterns.html;
  return getter();
}

function isPageFile(filePath) {
  const basename = path.basename(filePath);
  const relPath = path.relative(projectRoot, filePath);

  if (framework === 'nextjs') {
    return basename.match(/^(page|layout)\.(tsx?|jsx?)$/) ||
           (relPath.includes('pages/') && !basename.startsWith('_'));
  }
  if (framework === 'react') {
    // Heuristic: files in pages/ or views/ or routes/ directories, or App.tsx/jsx
    return relPath.match(/(pages?|views?|routes?)\//i) || basename.match(/^App\.(tsx?|jsx?)$/);
  }
  if (framework === 'angular') {
    return basename.endsWith('.component.html');
  }
  return true; // HTML files are all pages
}

function findFiles(dir, pattern, maxDepth = 10, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;
  if (!fs.existsSync(dir)) return results;
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

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

try {
  console.log(JSON.stringify(scanHeadings(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
