#!/usr/bin/env node
/**
 * scan-semantics.js
 * Scans for semantic HTML and landmark accessibility issues.
 * Detects: div/span onClick, missing button/link semantics, heading issues, missing landmarks.
 * Usage: node scan-semantics.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanSemantics() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // A) div/span with onClick used as interactive control
    const divClickPattern = /<(div|span)\s([^>]*?)onClick/gi;
    let match;
    while ((match = divClickPattern.exec(content)) !== null) {
      const tagStart = match.index;
      const tagEnd = content.indexOf('>', tagStart);
      const tag = content.substring(tagStart, tagEnd + 1);
      const lineNum = content.substring(0, tagStart).split('\n').length;
      const hasRole = /\brole\s*=\s*["'](button|link|menuitem|tab|switch)["']/.test(tag);
      const hasTabindex = /\btabindex\s*=/.test(tag);
      const hasKeyHandler = /\b(onKeyDown|onKeyUp|onKeyPress)\s*=/.test(tag);

      if (!hasRole) {
        issues.push({
          severity: 'critical',
          category: 'semantics',
          file: relPath,
          line: lineNum,
          problem: `<${match[1]}> with onClick handler used as interactive control without semantic role`,
          impact: 'Screen readers announce this as generic text, not a clickable element. Keyboard users cannot activate it without explicit tabindex and key handlers.',
          recommendedFix: `Replace <${match[1]} onClick> with <button type="button" onClick>. If it navigates, use <a href>. Preserve className and handlers.`,
          autoFixPossible: true,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      } else if (!hasTabindex) {
        issues.push({
          severity: 'high',
          category: 'semantics',
          file: relPath,
          line: lineNum,
          problem: `<${match[1]}> with role but missing tabindex for keyboard accessibility`,
          impact: 'Element has a role but is not reachable via keyboard Tab navigation.',
          recommendedFix: 'Add tabindex="0" to make the element keyboard-focusable.',
          autoFixPossible: true,
          wcagCriteria: '2.1.1',
          wcagLevel: 'A'
        });
      }

      if (hasRole && !hasKeyHandler) {
        issues.push({
          severity: 'high',
          category: 'semantics',
          file: relPath,
          line: lineNum,
          problem: `<${match[1]}> with role and onClick but no keyboard event handler`,
          impact: 'Keyboard users cannot activate this control. onClick alone does not fire on Enter/Space for non-button elements.',
          recommendedFix: 'Add onKeyDown handler that triggers on Enter and Space keys, or replace with <button>.',
          autoFixPossible: false,
          wcagCriteria: '2.1.1',
          wcagLevel: 'A'
        });
      }
    }

    // Heading structure — multiple H1
    const h1Count = (content.match(/<h1[\s>]/gi) || []).length;
    if (h1Count > 1 && isPageFile(file)) {
      issues.push({
        severity: 'medium',
        category: 'semantics',
        file: relPath,
        line: findTagLine(lines, '<h1'),
        problem: `Multiple <h1> tags found (${h1Count}) — only one H1 per page recommended`,
        impact: 'Screen reader users rely on a single H1 to identify the main topic. Multiple H1s reduce navigability.',
        recommendedFix: 'Keep one <h1> for the main page heading. Demote others to <h2> or lower.',
        autoFixPossible: false,
        wcagCriteria: '1.3.1',
        wcagLevel: 'A'
      });
    }

    // Heading hierarchy — skipped levels
    const headingPattern = /<h([1-6])[\s>]/gi;
    const headings = [];
    while ((match = headingPattern.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        line: content.substring(0, match.index).split('\n').length
      });
    }
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level > headings[i - 1].level + 1) {
        issues.push({
          severity: 'medium',
          category: 'semantics',
          file: relPath,
          line: headings[i].line,
          problem: `Skipped heading level: H${headings[i - 1].level} → H${headings[i].level} (expected H${headings[i - 1].level + 1})`,
          impact: 'Screen reader users navigate by heading level. Skipped levels break the document outline and cause confusion.',
          recommendedFix: `Change <h${headings[i].level}> to <h${headings[i - 1].level + 1}> or add intermediate headings.`,
          autoFixPossible: false,
          wcagCriteria: '1.3.1',
          wcagLevel: 'A'
        });
      }
    }

    // Missing landmarks (page-level files only)
    if (isPageFile(file)) {
      const hasMain = /<main[\s>]/i.test(content) || /role\s*=\s*["']main["']/.test(content);
      if (!hasMain) {
        issues.push({
          severity: 'medium',
          category: 'semantics',
          file: relPath,
          line: 1,
          problem: 'Missing <main> landmark region',
          impact: 'Screen reader users cannot quickly skip to the main content area. Landmark navigation is a primary orientation method.',
          recommendedFix: 'Wrap the primary content in a <main> element.',
          autoFixPossible: false,
          wcagCriteria: '1.3.1',
          wcagLevel: 'A'
        });
      }

      const hasNav = /<nav[\s>]/i.test(content) || /role\s*=\s*["']navigation["']/.test(content);
      const linkCount = (content.match(/<a\s/gi) || []).length;
      if (!hasNav && linkCount >= 3) {
        issues.push({
          severity: 'low',
          category: 'semantics',
          file: relPath,
          line: 1,
          problem: 'Navigation links present but no <nav> landmark',
          impact: 'Screen reader users cannot quickly identify and jump to navigation sections.',
          recommendedFix: 'Wrap navigation link groups in a <nav> element with an aria-label.',
          autoFixPossible: false,
          wcagCriteria: '1.3.1',
          wcagLevel: 'A'
        });
      }
    }

    // Anchor tags without href used as buttons
    const anchorNoHrefPattern = /<a\s(?![^>]*href\s*=)([^>]*?)onClick/gi;
    while ((match = anchorNoHrefPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      issues.push({
        severity: 'high',
        category: 'semantics',
        file: relPath,
        line: lineNum,
        problem: '<a> tag with onClick but no href — should be a <button>',
        impact: 'Links without href have no semantic meaning. Screen readers may ignore them or announce incorrectly.',
        recommendedFix: 'Replace <a onClick> with <button type="button" onClick> if it performs an action, or add an href if it navigates.',
        autoFixPossible: false,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
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

function isPageFile(filePath) {
  const basename = path.basename(filePath);
  const relPath = path.relative(projectRoot, filePath);
  if (framework === 'nextjs') return basename.match(/^(page|layout)\.(tsx?|jsx?)$/) || (relPath.includes('pages/') && !basename.startsWith('_'));
  if (framework === 'react') return relPath.match(/(pages?|views?|routes?)\//i) || basename.match(/^App\.(tsx?|jsx?)$/);
  if (framework === 'angular') return basename.endsWith('.component.html');
  return true;
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
  console.log(JSON.stringify(scanSemantics(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
