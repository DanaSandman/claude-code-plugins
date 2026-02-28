#!/usr/bin/env node
/**
 * scan-patterns.js
 * Scans for accessibility issues in common UI patterns (dialogs, modals, menus, tabs).
 * Usage: node scan-patterns.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanPatterns() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Dialog / Modal detection
    checkDialogs(content, relPath, issues);

    // Tab pattern detection
    checkTabs(content, relPath, issues);

    // Menu button pattern detection
    checkMenuButtons(content, relPath, issues);
  }

  return { issues };
}

function checkDialogs(content, file, issues) {
  // Detect likely dialog/modal containers by class name
  const dialogClassPattern = /<(div|section)\s[^>]*class\s*=\s*["'][^"']*(modal|dialog|popup|overlay|lightbox)[^"']*["'][^>]*>/gi;
  let match;

  while ((match = dialogClassPattern.exec(content)) !== null) {
    const tagStart = match.index;
    const tagEnd = content.indexOf('>', tagStart);
    const tag = content.substring(tagStart, tagEnd + 1);
    const lineNum = content.substring(0, tagStart).split('\n').length;

    const hasRoleDialog = /\brole\s*=\s*["'](dialog|alertdialog)["']/.test(tag);
    const hasAriaModal = /\baria-modal\s*=\s*["']true["']/.test(tag);
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(tag);
    const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(tag);

    // Skip native <dialog> elements
    if (/^<dialog[\s>]/i.test(tag)) continue;

    if (!hasRoleDialog) {
      issues.push({
        severity: 'high',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Modal/dialog container missing role="dialog" or role="alertdialog"',
        impact: 'Screen readers do not announce this as a dialog. Users may not realize they are in a modal context.',
        recommendedFix: 'Add role="dialog" (or role="alertdialog" for critical confirmations) and aria-modal="true".',
        autoFixPossible: true,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    } else if (!hasAriaModal) {
      issues.push({
        severity: 'medium',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Dialog has role="dialog" but missing aria-modal="true"',
        impact: 'Without aria-modal, screen readers may still interact with background content.',
        recommendedFix: 'Add aria-modal="true" to prevent screen readers from leaving the dialog.',
        autoFixPossible: true,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    }

    if (hasRoleDialog && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        severity: 'high',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Dialog missing accessible title (no aria-label or aria-labelledby)',
        impact: 'Screen readers announce "dialog" without a title. Users cannot identify the dialog purpose.',
        recommendedFix: 'Add aria-labelledby pointing to the dialog heading ID, or add aria-label="Dialog title".',
        autoFixPossible: true,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    }
  }

  // Check native <dialog> elements
  const nativeDialogPattern = /<dialog\s([^>]*?)>/gi;
  while ((match = nativeDialogPattern.exec(content)) !== null) {
    const attrs = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
    const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);

    if (!hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        severity: 'medium',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Native <dialog> missing accessible title',
        impact: 'Screen readers announce the dialog without context about its purpose.',
        recommendedFix: 'Add aria-labelledby pointing to a heading inside the dialog, or add aria-label.',
        autoFixPossible: false,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    }
  }
}

function checkTabs(content, file, issues) {
  // Look for tab patterns by role or class
  const tablistPattern = /role\s*=\s*["']tablist["']/gi;
  let match;

  while ((match = tablistPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;

    // Check if tabs have role="tab" and aria-selected
    const afterTablist = content.substring(match.index, Math.min(content.length, match.index + 2000));
    const tabCount = (afterTablist.match(/role\s*=\s*["']tab["']/g) || []).length;

    if (tabCount === 0) {
      issues.push({
        severity: 'high',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'role="tablist" found but no child elements with role="tab"',
        impact: 'The tab pattern is incomplete. Screen readers announce a tablist but find no tabs inside it.',
        recommendedFix: 'Add role="tab" to each tab element, role="tabpanel" to content panels, and aria-selected to the active tab.',
        autoFixPossible: false,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    } else {
      const hasAriaSelected = /aria-selected\s*=/.test(afterTablist);
      if (!hasAriaSelected) {
        issues.push({
          severity: 'medium',
          category: 'patterns',
          file,
          line: lineNum,
          problem: 'Tab pattern missing aria-selected state',
          impact: 'Screen readers cannot convey which tab is currently active.',
          recommendedFix: 'Add aria-selected="true" to the active tab and aria-selected="false" to inactive tabs.',
          autoFixPossible: false,
          wcagCriteria: '4.1.2',
          wcagLevel: 'A'
        });
      }
    }
  }

  // Detect tab-like patterns by class (common in UI libraries)
  const tabClassPattern = /<(div|ul|nav)\s[^>]*class\s*=\s*["'][^"']*(tabs|tab-list|tablist)[^"']*["'][^>]*>/gi;
  while ((match = tabClassPattern.exec(content)) !== null) {
    const tag = match[0];
    const lineNum = content.substring(0, match.index).split('\n').length;
    if (!/\brole\s*=\s*["']tablist["']/.test(tag)) {
      issues.push({
        severity: 'medium',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Tab-like UI pattern detected but missing ARIA tab roles',
        impact: 'Screen readers see this as a generic list instead of a navigable tab interface.',
        recommendedFix: 'Add role="tablist" to the container, role="tab" to tabs, role="tabpanel" to panels, and manage aria-selected.',
        autoFixPossible: false,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
      });
    }
  }
}

function checkMenuButtons(content, file, issues) {
  // Detect menu buttons (button that controls a dropdown)
  const menuBtnPattern = /<button\s[^>]*aria-controls\s*=\s*["'][^"']+["'][^>]*>/gi;
  let match;

  while ((match = menuBtnPattern.exec(content)) !== null) {
    const tag = match[0];
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (!/\baria-expanded\s*=/.test(tag) && /\baria-haspopup\s*=/.test(tag)) {
      issues.push({
        severity: 'medium',
        category: 'patterns',
        file,
        line: lineNum,
        problem: 'Menu button with aria-haspopup missing aria-expanded state',
        impact: 'Screen readers cannot convey whether the menu is currently open or closed.',
        recommendedFix: 'Add aria-expanded="false" (or "true" when open) to the trigger button.',
        autoFixPossible: false,
        wcagCriteria: '4.1.2',
        wcagLevel: 'A'
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
  console.log(JSON.stringify(scanPatterns(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
