#!/usr/bin/env node
/**
 * scan-keyboard.js
 * Scans for keyboard accessibility issues (static heuristics).
 * Detects: tabindex > 0, focus styles removed, missing keyboard handlers.
 * Usage: node scan-keyboard.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanKeyboard() {
  const issues = [];
  const sourceFiles = getSourceFiles();
  const cssFiles = getCssFiles();

  // Scan source files for keyboard issues
  for (const file of sourceFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // tabindex > 0
    const tabindexPattern = /tabindex\s*=\s*["']?(\d+)["']?/gi;
    let match;
    while ((match = tabindexPattern.exec(content)) !== null) {
      const value = parseInt(match[1], 10);
      if (value > 0) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          severity: 'high',
          category: 'keyboard',
          file: relPath,
          line: lineNum,
          problem: `tabindex="${value}" — positive tabindex disrupts natural focus order`,
          impact: 'Positive tabindex values override the natural DOM order, making keyboard navigation unpredictable and confusing.',
          recommendedFix: 'Use tabindex="0" to add to normal tab order, or tabindex="-1" for programmatic focus only. Reorder DOM instead.',
          autoFixPossible: true,
          wcagCriteria: '2.4.3',
          wcagLevel: 'A'
        });
      }
    }

    // Interactive div/span with onClick but no keyboard handlers
    const interactivePattern = /<(div|span)\s([^>]*?)onClick/gi;
    while ((match = interactivePattern.exec(content)) !== null) {
      const tagStart = match.index;
      const tagEnd = content.indexOf('>', tagStart);
      const tag = content.substring(tagStart, tagEnd + 1);
      const lineNum = content.substring(0, tagStart).split('\n').length;

      const hasKeyHandler = /\b(onKeyDown|onKeyUp|onKeyPress)\s*=/.test(tag);
      const hasTabindex = /\btabindex\s*=/.test(tag);

      if (!hasKeyHandler) {
        issues.push({
          severity: 'high',
          category: 'keyboard',
          file: relPath,
          line: lineNum,
          problem: `<${match[1]}> with onClick but no keyboard event handler`,
          impact: 'Keyboard users cannot activate this control. Mouse-only interactions exclude keyboard and switch users.',
          recommendedFix: 'Replace with <button> (handles keyboard automatically), or add onKeyDown for Enter/Space support.',
          autoFixPossible: false,
          wcagCriteria: '2.1.1',
          wcagLevel: 'A'
        });
      }

      if (hasKeyHandler && !hasTabindex) {
        issues.push({
          severity: 'medium',
          category: 'keyboard',
          file: relPath,
          line: lineNum,
          problem: `<${match[1]}> has keyboard handler but no tabindex — not keyboard-focusable`,
          impact: 'The element handles key events but cannot receive focus via Tab, so keyboard users cannot reach it.',
          recommendedFix: 'Add tabindex="0" to make the element focusable, or replace with <button>.',
          autoFixPossible: true,
          wcagCriteria: '2.1.1',
          wcagLevel: 'A'
        });
      }
    }

    // Check for mouse-only event handlers (onMouseDown/onMouseOver) without keyboard equivalents
    const mouseOnlyPattern = /<\w+\s[^>]*(onMouseDown|onMouseOver|onMouseEnter)\s*=[^>]*>/gi;
    while ((match = mouseOnlyPattern.exec(content)) !== null) {
      const tag = match[0];
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasKeyHandler = /\b(onKeyDown|onKeyUp|onKeyPress|onFocus|onBlur)\s*=/.test(tag);

      if (!hasKeyHandler) {
        issues.push({
          severity: 'medium',
          category: 'keyboard',
          file: relPath,
          line: lineNum,
          problem: 'Mouse-only event handler without keyboard equivalent',
          impact: 'Functionality triggered by mouse events is not available to keyboard users.',
          recommendedFix: 'Add equivalent keyboard/focus event handlers (onKeyDown, onFocus/onBlur for hover effects).',
          autoFixPossible: false,
          wcagCriteria: '2.1.1',
          wcagLevel: 'A'
        });
      }
    }
  }

  // Scan CSS files for focus style removal
  for (const file of cssFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Detect outline: none / outline: 0 without replacement
    const outlineNonePattern = /:focus\s*\{[^}]*outline\s*:\s*(none|0)[^}]*\}/gi;
    while ((match = outlineNonePattern.exec(content)) !== null) {
      const block = match[0];
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Check if there's a replacement focus style
      const hasReplacement = /box-shadow|border|background|color|text-decoration/.test(block);
      if (!hasReplacement) {
        issues.push({
          severity: 'high',
          category: 'keyboard',
          file: relPath,
          line: lineNum,
          problem: 'Focus outline removed without visible replacement',
          impact: 'Keyboard users cannot see which element is focused, making navigation impossible.',
          recommendedFix: 'Add a visible focus indicator: box-shadow, border, or custom outline style.',
          autoFixPossible: false,
          wcagCriteria: '2.4.7',
          wcagLevel: 'AA'
        });
      }
    }

    // Global wildcard focus removal
    const globalOutlinePattern = /\*\s*\{[^}]*outline\s*:\s*(none|0)/gi;
    while ((match = globalOutlinePattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      issues.push({
        severity: 'critical',
        category: 'keyboard',
        file: relPath,
        line: lineNum,
        problem: 'Global focus outline removed (outline: none on *)',
        impact: 'Removes focus indicators from ALL elements, making keyboard navigation completely invisible.',
        recommendedFix: 'Remove the global outline reset. Add focused styles per-component instead, or use :focus-visible.',
        autoFixPossible: false,
        wcagCriteria: '2.4.7',
        wcagLevel: 'AA'
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

function getCssFiles() {
  const dirs = framework === 'angular'
    ? [path.join(projectRoot, 'src')]
    : [path.join(projectRoot, 'src'), path.join(projectRoot, 'app'), path.join(projectRoot, 'styles'), projectRoot];

  const files = [];
  for (const dir of dirs) {
    if (fs.existsSync(dir)) files.push(...findFiles(dir, /\.(css|scss|less)$/));
  }
  return files;
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
  console.log(JSON.stringify(scanKeyboard(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
