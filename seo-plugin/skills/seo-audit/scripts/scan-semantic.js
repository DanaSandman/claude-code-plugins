#!/usr/bin/env node
/**
 * scan-semantic.js
 * Scans for semantic HTML structure issues.
 * Usage: node scan-semantic.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

const SEMANTIC_TAGS = ['header', 'nav', 'main', 'section', 'article', 'footer', 'aside'];
const DIV_THRESHOLD = 0.7; // Flag if divs make up more than 70% of container elements

function scanSemantic() {
  const issues = [];
  const pageFiles = getPageFiles();

  for (const file of pageFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Count semantic tags
    const semanticCounts = {};
    for (const tag of SEMANTIC_TAGS) {
      const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
      const matches = content.match(regex);
      semanticCounts[tag] = matches ? matches.length : 0;
    }

    // Count div tags
    const divMatches = content.match(/<div[\s>]/gi);
    const divCount = divMatches ? divMatches.length : 0;

    // Count total container elements
    const totalSemantic = Object.values(semanticCounts).reduce((a, b) => a + b, 0);
    const totalContainers = divCount + totalSemantic;

    // Only analyze page-level files for missing landmarks
    if (isPageFile(file)) {
      // Check for missing <main> tag
      if (semanticCounts.main === 0) {
        issues.push({
          severity: 'medium',
          category: 'semantic-html',
          file: relPath,
          line: 1,
          problem: 'Missing <main> landmark element',
          seoImpact: 'The <main> tag helps search engines identify the primary content area of the page.',
          recommendedFix: 'Wrap the primary content area in a <main> tag.',
          autoFixPossible: true
        });
      }

      // Check for multiple <main> tags
      if (semanticCounts.main > 1) {
        issues.push({
          severity: 'medium',
          category: 'semantic-html',
          file: relPath,
          line: findTagLine(lines, '<main'),
          problem: `Multiple <main> tags found (${semanticCounts.main})`,
          seoImpact: 'Only one <main> element should exist per page.',
          recommendedFix: 'Keep only one <main> element that wraps the primary content.',
          autoFixPossible: false
        });
      }

      // Check for missing <header>
      if (semanticCounts.header === 0 && framework !== 'nextjs') {
        issues.push({
          severity: 'low',
          category: 'semantic-html',
          file: relPath,
          line: 1,
          problem: 'Missing <header> landmark element',
          seoImpact: 'The <header> tag identifies the introductory content or navigational aids.',
          recommendedFix: 'Wrap site header/navigation area in a <header> tag.',
          autoFixPossible: true
        });
      }

      // Check for missing <nav>
      if (semanticCounts.nav === 0 && hasNavigationContent(content)) {
        issues.push({
          severity: 'low',
          category: 'semantic-html',
          file: relPath,
          line: 1,
          problem: 'Navigation links found but no <nav> landmark element',
          seoImpact: 'The <nav> tag helps search engines identify navigation sections.',
          recommendedFix: 'Wrap navigation links in a <nav> element.',
          autoFixPossible: true
        });
      }

      // Check for missing <footer>
      if (semanticCounts.footer === 0 && framework !== 'nextjs') {
        issues.push({
          severity: 'low',
          category: 'semantic-html',
          file: relPath,
          line: 1,
          problem: 'Missing <footer> landmark element',
          seoImpact: 'The <footer> tag helps identify site-wide footer content.',
          recommendedFix: 'Wrap footer content in a <footer> tag.',
          autoFixPossible: true
        });
      }
    }

    // Check for excessive div usage (div-itis)
    if (totalContainers > 5 && divCount / totalContainers > DIV_THRESHOLD) {
      issues.push({
        severity: 'medium',
        category: 'semantic-html',
        file: relPath,
        line: 1,
        problem: `Excessive <div> usage: ${divCount} divs vs ${totalSemantic} semantic elements (${Math.round(divCount / totalContainers * 100)}% divs)`,
        seoImpact: 'Over-reliance on <div> tags reduces semantic meaning. Search engines use semantic tags to understand content structure.',
        recommendedFix: 'Replace <div> elements with appropriate semantic tags (section, article, aside, etc.) where meaningful.',
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
      for (const dir of ['app', 'src/app', 'pages', 'src/pages']) {
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

function isPageFile(filePath) {
  const basename = path.basename(filePath);
  const relPath = path.relative(projectRoot, filePath);
  if (framework === 'nextjs') return basename.match(/^(page|layout)\.(tsx?|jsx?)$/) || (relPath.includes('pages/') && !basename.startsWith('_'));
  if (framework === 'react') return relPath.match(/(pages?|views?|routes?)\//i) || basename.match(/^App\.(tsx?|jsx?)$/);
  if (framework === 'angular') return basename.endsWith('.component.html');
  return true;
}

function hasNavigationContent(content) {
  // Check for patterns that suggest navigation (multiple links in a list or cluster)
  const linkCount = (content.match(/<a\s/gi) || []).length;
  const hasLinkList = content.match(/<(ul|ol)[^>]*>[\s\S]*?<a\s/i);
  return linkCount >= 3 || hasLinkList;
}

function findTagLine(lines, tag) {
  const i = lines.findIndex(l => l.toLowerCase().includes(tag.toLowerCase()));
  return i >= 0 ? i + 1 : 1;
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
  console.log(JSON.stringify(scanSemantic(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
