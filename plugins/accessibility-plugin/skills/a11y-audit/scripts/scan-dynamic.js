#!/usr/bin/env node
/**
 * scan-dynamic.js
 * Scans for dynamic content announcement issues.
 * Detects: missing live regions, toast/notification patterns, loading spinners.
 * Usage: node scan-dynamic.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanDynamic() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Toast / notification / snackbar patterns
    checkToastPatterns(content, relPath, issues);

    // Loading spinners
    checkLoadingPatterns(content, relPath, issues);

    // Status update containers
    checkStatusPatterns(content, relPath, issues);
  }

  return { issues };
}

function checkToastPatterns(content, file, issues) {
  const toastPattern = /<(div|span|section)\s[^>]*class\s*=\s*["'][^"']*(toast|notification|snackbar|alert-banner|flash-message)[^"']*["'][^>]*>/gi;
  let match;

  while ((match = toastPattern.exec(content)) !== null) {
    const tag = match[0];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const hasAriaLive = /\baria-live\s*=/.test(tag);
    const hasRole = /\brole\s*=\s*["'](alert|status|log)["']/.test(tag);

    if (!hasAriaLive && !hasRole) {
      issues.push({
        severity: 'high',
        category: 'dynamic',
        file,
        line: lineNum,
        problem: 'Toast/notification element missing aria-live or role="status"',
        impact: 'Screen readers will not announce dynamic toast messages. Users will miss important notifications.',
        recommendedFix: 'Add role="status" and aria-live="polite" for non-urgent messages, or role="alert" for urgent ones.',
        autoFixPossible: false,
        wcagCriteria: '4.1.3',
        wcagLevel: 'AA'
      });
    }
  }
}

function checkLoadingPatterns(content, file, issues) {
  // Loading spinners by class
  const loadingPattern = /<(div|span)\s[^>]*class\s*=\s*["'][^"']*(loading|spinner|loader|skeleton|progress)[^"']*["'][^>]*>/gi;
  let match;

  while ((match = loadingPattern.exec(content)) !== null) {
    const tagStart = match.index;
    const tagEnd = content.indexOf('>', tagStart);
    const tag = content.substring(tagStart, tagEnd + 1);
    const lineNum = content.substring(0, tagStart).split('\n').length;

    const hasAriaLabel = /\baria-label\s*=/.test(tag);
    const hasRole = /\brole\s*=\s*["'](status|progressbar|alert)["']/.test(tag);
    const hasAriaLive = /\baria-live\s*=/.test(tag);
    const hasAriaHidden = /\baria-hidden\s*=\s*["']true["']/.test(tag);

    // Get inner text
    const closeIdx = content.indexOf('</', tagEnd);
    const innerText = closeIdx > tagEnd ? content.substring(tagEnd + 1, closeIdx).replace(/<[^>]*>/g, '').trim() : '';

    if (!hasAriaHidden && !hasAriaLabel && !hasRole && !hasAriaLive && !innerText) {
      issues.push({
        severity: 'medium',
        category: 'dynamic',
        file,
        line: lineNum,
        problem: 'Loading indicator has no accessible text or ARIA attributes',
        impact: 'Screen reader users see nothing when content is loading. They may think the page is broken or empty.',
        recommendedFix: 'Add aria-label="Loading" and role="status" or aria-live="polite" to announce loading state.',
        autoFixPossible: false,
        wcagCriteria: '4.1.3',
        wcagLevel: 'AA'
      });
    }
  }

  // aria-busy without aria-live
  const ariaBusyPattern = /aria-busy\s*=\s*["']true["']/gi;
  while ((match = ariaBusyPattern.exec(content)) !== null) {
    const tagStart = content.lastIndexOf('<', match.index);
    const tagEnd = content.indexOf('>', match.index);
    const tag = content.substring(tagStart, tagEnd + 1);
    const lineNum = content.substring(0, tagStart).split('\n').length;

    if (!/\baria-live\s*=/.test(tag) && !/\brole\s*=\s*["'](status|alert|log)["']/.test(tag)) {
      issues.push({
        severity: 'low',
        category: 'dynamic',
        file,
        line: lineNum,
        problem: 'aria-busy="true" used without aria-live region',
        impact: 'aria-busy suppresses announcements, but without a live region, there is nothing to suppress or resume.',
        recommendedFix: 'Add aria-live="polite" to the container so screen readers announce content when loading completes.',
        autoFixPossible: false,
        wcagCriteria: '4.1.3',
        wcagLevel: 'AA'
      });
    }
  }
}

function checkStatusPatterns(content, file, issues) {
  // Success/error/warning message patterns
  const statusPattern = /<(div|span|p)\s[^>]*class\s*=\s*["'][^"']*(success-message|error-message|warning-message|status-message|feedback|result-text)[^"']*["'][^>]*>/gi;
  let match;

  while ((match = statusPattern.exec(content)) !== null) {
    const tag = match[0];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const hasAriaLive = /\baria-live\s*=/.test(tag);
    const hasRole = /\brole\s*=\s*["'](alert|status|log)["']/.test(tag);

    if (!hasAriaLive && !hasRole) {
      issues.push({
        severity: 'medium',
        category: 'dynamic',
        file,
        line: lineNum,
        problem: 'Status/feedback message element missing live region semantics',
        impact: 'Dynamically updated status messages are not announced to screen reader users.',
        recommendedFix: 'Add role="status" with aria-live="polite" for success messages, or role="alert" for errors.',
        autoFixPossible: false,
        wcagCriteria: '4.1.3',
        wcagLevel: 'AA'
      });
    }
  }
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
      const files = [];
      for (const dir of ['src', 'components']) {
        const fullDir = path.join(projectRoot, dir);
        if (fs.existsSync(fullDir)) files.push(...findFiles(fullDir, /\.(tsx?|jsx?)$/));
      }
      return files;
    },
    angular: () => {
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.(html|ts)$/) : [];
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
  console.log(JSON.stringify(scanDynamic(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
