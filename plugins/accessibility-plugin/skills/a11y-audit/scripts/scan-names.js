#!/usr/bin/env node
/**
 * scan-names.js
 * Scans for accessible name issues on interactive elements.
 * Detects: buttons/links with no name, icon-only buttons, SVGs, empty aria-label.
 * Usage: node scan-names.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanNames() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Buttons with no accessible name
    const buttonPattern = /<button\s([^>]*?)>([\s\S]*?)<\/button>/gi;
    let match;
    while ((match = buttonPattern.exec(content)) !== null) {
      const attrs = match[1];
      const innerContent = match[2].trim();
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);
      const hasTitle = /\btitle\s*=\s*["'][^"']+["']/.test(attrs);
      const hasVisibleText = innerContent.replace(/<[^>]*>/g, '').trim().length > 0;

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasVisibleText) {
        // Icon-only button
        const hasSvg = /<svg[\s>]/i.test(innerContent);
        const hasIcon = /icon|Icon|<i[\s>]|<span[^>]*class[^>]*(icon|fa-|material)/i.test(innerContent);
        if (hasSvg || hasIcon) {
          issues.push({
            severity: 'critical',
            category: 'accessible-names',
            file: relPath,
            line: lineNum,
            problem: 'Icon-only button missing accessible name',
            impact: 'Screen readers announce this as "button" with no label. Users cannot determine its purpose.',
            recommendedFix: 'Add aria-label="descriptive label" to the button, e.g., aria-label="Close" or aria-label="Menu".',
            autoFixPossible: true,
            wcagCriteria: '4.1.2',
            wcagLevel: 'A'
          });
        } else {
          issues.push({
            severity: 'critical',
            category: 'accessible-names',
            file: relPath,
            line: lineNum,
            problem: 'Button has no accessible name (no text content, aria-label, or title)',
            impact: 'Screen readers cannot convey the purpose of this button to users.',
            recommendedFix: 'Add visible text content inside the button, or add aria-label="descriptive label".',
            autoFixPossible: true,
            wcagCriteria: '4.1.2',
            wcagLevel: 'A'
          });
        }
      }
    }

    // Self-closing buttons (JSX)
    const selfClosingBtnPattern = /<button\s([^>]*?)\/>/gi;
    while ((match = selfClosingBtnPattern.exec(content)) !== null) {
      const attrs = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);
      if (!hasAriaLabel && !hasAriaLabelledBy) {
        issues.push({
          severity: 'critical',
          category: 'accessible-names',
          file: relPath,
          line: lineNum,
          problem: 'Self-closing <button /> has no accessible name',
          impact: 'Screen readers announce this as an unlabeled button.',
          recommendedFix: 'Add aria-label="descriptive label" to the button.',
          autoFixPossible: true,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }
    }

    // Links with no accessible name
    const linkPattern = /<a\s([^>]*?)>([\s\S]*?)<\/a>/gi;
    while ((match = linkPattern.exec(content)) !== null) {
      const attrs = match[1];
      const innerContent = match[2].trim();
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);
      const hasVisibleText = innerContent.replace(/<[^>]*>/g, '').trim().length > 0;

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText) {
        issues.push({
          severity: 'critical',
          category: 'accessible-names',
          file: relPath,
          line: lineNum,
          problem: 'Link has no accessible name (no text, aria-label, or aria-labelledby)',
          impact: 'Screen readers announce "link" with no description. Users cannot determine where the link goes.',
          recommendedFix: 'Add visible text inside the link, or add aria-label="descriptive label".',
          autoFixPossible: true,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
          });
      }
    }

    // SVGs used as controls without accessible name
    const svgPattern = /<svg\s([^>]*?)>/gi;
    while ((match = svgPattern.exec(content)) !== null) {
      const attrs = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasRole = /\brole\s*=\s*["']img["']/.test(attrs);
      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaHidden = /\baria-hidden\s*=\s*["']true["']/.test(attrs);
      const hasTitleChild = content.substring(match.index, content.indexOf('</svg>', match.index)).match(/<title[^>]*>[^<]+<\/title>/);

      if (hasRole && !hasAriaLabel && !hasAriaLabelledBy && !hasTitleChild) {
        issues.push({
          severity: 'high',
          category: 'accessible-names',
          file: relPath,
          line: lineNum,
          problem: 'SVG with role="img" missing accessible name',
          impact: 'Screen readers announce the SVG as an image but cannot describe it.',
          recommendedFix: 'Add aria-label="description" to the SVG, or include a <title> child element.',
          autoFixPossible: false,
          wcagCriteria: '1.1.1',
          wcagLevel: 'A'
        });
      }

      // SVG that is not hidden and not labelled (informational SVG without role)
      if (!hasAriaHidden && !hasRole && !hasAriaLabel && !hasAriaLabelledBy && !hasTitleChild) {
        // Check if it's inside a button/link (those provide the name)
        const before = content.substring(Math.max(0, match.index - 200), match.index);
        const isInsideInteractive = /<(button|a)\s[^>]*$/.test(before);
        if (!isInsideInteractive) {
          issues.push({
            severity: 'low',
            category: 'accessible-names',
            file: relPath,
            line: lineNum,
            problem: 'SVG without aria-hidden="true" or accessible name — may confuse screen readers',
            impact: 'Unlabeled, non-hidden SVGs are announced but without meaning. Decorative SVGs should have aria-hidden="true".',
            recommendedFix: 'Add aria-hidden="true" if decorative, or add role="img" and aria-label="description" if meaningful.',
            autoFixPossible: false,
            wcagCriteria: '1.1.1',
            wcagLevel: 'A'
          });
        }
      }
    }

    // Empty aria-label
    const emptyAriaPattern = /aria-label\s*=\s*["']\s*["']/gi;
    while ((match = emptyAriaPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      issues.push({
        severity: 'high',
        category: 'accessible-names',
        file: relPath,
        line: lineNum,
        problem: 'Empty aria-label provides no accessible name',
        impact: 'An empty aria-label overrides any visible text, making the element unnamed to screen readers.',
        recommendedFix: 'Add a descriptive value to aria-label, or remove it if the element has visible text.',
        autoFixPossible: true,
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
  console.log(JSON.stringify(scanNames(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
