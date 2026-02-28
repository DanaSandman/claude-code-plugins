#!/usr/bin/env node
/**
 * scan-aria.js
 * Scans for ARIA correctness and anti-pattern issues.
 * Detects: redundant roles, aria-hidden on focusable, incorrect states, broken references.
 * Usage: node scan-aria.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

// Native implicit roles — adding these roles is redundant
const REDUNDANT_ROLES = {
  'button': 'button',
  'a': 'link',
  'nav': 'navigation',
  'main': 'main',
  'header': 'banner',
  'footer': 'contentinfo',
  'aside': 'complementary',
  'form': 'form',
  'table': 'table',
  'img': 'img',
  'input': 'textbox',
  'select': 'listbox',
  'textarea': 'textbox',
  'ul': 'list',
  'ol': 'list',
  'li': 'listitem',
  'article': 'article',
  'section': 'region'
};

function scanAria() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Collect all IDs for reference checking
    const idPattern = /\bid\s*=\s*["']([^"']+)["']/gi;
    const allIds = new Set();
    let match;
    while ((match = idPattern.exec(content)) !== null) {
      allIds.add(match[1]);
    }

    // Check redundant roles
    for (const [tag, implicitRole] of Object.entries(REDUNDANT_ROLES)) {
      const pattern = new RegExp(`<${tag}\\s[^>]*role\\s*=\\s*["']${implicitRole}["']`, 'gi');
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        issues.push({
          severity: 'low',
          category: 'aria',
          file: relPath,
          line: lineNum,
          problem: `Redundant role="${implicitRole}" on <${tag}> — this is the element's implicit role`,
          impact: 'While not harmful, redundant roles add noise to the code and may confuse developers about ARIA usage.',
          recommendedFix: `Remove role="${implicitRole}" from the <${tag}> element.`,
          autoFixPossible: true,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }
    }

    // aria-hidden on focusable elements
    const ariaHiddenPattern = /aria-hidden\s*=\s*["']true["']/gi;
    while ((match = ariaHiddenPattern.exec(content)) !== null) {
      const tagStart = content.lastIndexOf('<', match.index);
      const tagEnd = content.indexOf('>', match.index);
      if (tagStart === -1 || tagEnd === -1) continue;
      const tag = content.substring(tagStart, tagEnd + 1);
      const lineNum = content.substring(0, tagStart).split('\n').length;

      // Check if the element itself is focusable
      const isFocusable = /\b(href|tabindex)\s*=/.test(tag) ||
                          /^<(button|a|input|select|textarea|details)\s/i.test(tag);

      if (isFocusable) {
        issues.push({
          severity: 'critical',
          category: 'aria',
          file: relPath,
          line: lineNum,
          problem: 'aria-hidden="true" on a focusable element',
          impact: 'The element is hidden from screen readers but still reachable via keyboard, creating a confusing ghost focus trap.',
          recommendedFix: 'Remove aria-hidden if the element should be accessible, or add tabindex="-1" and remove href to also hide from keyboard.',
          autoFixPossible: false,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }

      // Check if aria-hidden container has focusable children
      if (tagEnd < content.length) {
        const tagName = tag.match(/^<(\w+)/);
        if (tagName) {
          const closeTag = `</${tagName[1]}>`;
          const closeIdx = content.indexOf(closeTag, tagEnd);
          if (closeIdx > -1) {
            const innerContent = content.substring(tagEnd + 1, closeIdx);
            const hasFocusableChild = /<(button|a|input|select|textarea)\s/i.test(innerContent) ||
                                       /tabindex\s*=\s*["'](?!-1)[^"']*["']/.test(innerContent);
            if (hasFocusableChild) {
              issues.push({
                severity: 'critical',
                category: 'aria',
                file: relPath,
                line: lineNum,
                problem: 'aria-hidden="true" on container with focusable children',
                impact: 'Focusable elements inside an aria-hidden container are hidden from screen readers but reachable via keyboard.',
                recommendedFix: 'Either remove aria-hidden from the container, or ensure all children have tabindex="-1".',
                autoFixPossible: false,
                wcagCriteria: '4.1.2',
                wcagLevel: 'A'
              });
            }
          }
        }
      }
    }

    // aria-controls referencing missing ID
    const ariaControlsPattern = /aria-controls\s*=\s*["']([^"']+)["']/gi;
    while ((match = ariaControlsPattern.exec(content)) !== null) {
      const referencedId = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;
      if (!allIds.has(referencedId)) {
        issues.push({
          severity: 'medium',
          category: 'aria',
          file: relPath,
          line: lineNum,
          problem: `aria-controls references non-existent ID "${referencedId}"`,
          impact: 'The ARIA relationship is broken. Assistive technology cannot navigate to the controlled element.',
          recommendedFix: `Add id="${referencedId}" to the controlled element, or fix the aria-controls value.`,
          autoFixPossible: false,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }
    }

    // aria-labelledby referencing missing ID
    const ariaLabelledByPattern = /aria-labelledby\s*=\s*["']([^"']+)["']/gi;
    while ((match = ariaLabelledByPattern.exec(content)) !== null) {
      const ids = match[1].split(/\s+/);
      const lineNum = content.substring(0, match.index).split('\n').length;
      for (const id of ids) {
        if (!allIds.has(id)) {
          issues.push({
            severity: 'high',
            category: 'aria',
            file: relPath,
            line: lineNum,
            problem: `aria-labelledby references non-existent ID "${id}"`,
            impact: 'The element has no effective accessible name because the referenced label element does not exist.',
            recommendedFix: `Add an element with id="${id}" containing the label text, or fix the aria-labelledby value.`,
            autoFixPossible: false,
            wcagCriteria: '4.1.2',
            wcagLevel: 'A'
          });
        }
      }
    }

    // aria-describedby referencing missing ID
    const ariaDescribedByPattern = /aria-describedby\s*=\s*["']([^"']+)["']/gi;
    while ((match = ariaDescribedByPattern.exec(content)) !== null) {
      const ids = match[1].split(/\s+/);
      const lineNum = content.substring(0, match.index).split('\n').length;
      for (const id of ids) {
        if (!allIds.has(id)) {
          issues.push({
            severity: 'medium',
            category: 'aria',
            file: relPath,
            line: lineNum,
            problem: `aria-describedby references non-existent ID "${id}"`,
            impact: 'The supplementary description is not provided because the referenced element does not exist.',
            recommendedFix: `Add an element with id="${id}" containing the description, or fix the aria-describedby value.`,
            autoFixPossible: false,
            wcagCriteria: '4.1.2',
            wcagLevel: 'A'
          });
        }
      }
    }

    // Missing aria-expanded on disclosure controls
    const disclosurePattern = /<(button|div|span)\s[^>]*aria-controls\s*=\s*["'][^"']+["'][^>]*>/gi;
    while ((match = disclosurePattern.exec(content)) !== null) {
      const tag = match[0];
      const lineNum = content.substring(0, match.index).split('\n').length;
      if (!/\baria-expanded\s*=/.test(tag)) {
        issues.push({
          severity: 'medium',
          category: 'aria',
          file: relPath,
          line: lineNum,
          problem: 'Element with aria-controls missing aria-expanded state',
          impact: 'Screen readers cannot convey whether the controlled element is currently expanded or collapsed.',
          recommendedFix: 'Add aria-expanded="true" or aria-expanded="false" to indicate the current state.',
          autoFixPossible: false,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }
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
  console.log(JSON.stringify(scanAria(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
