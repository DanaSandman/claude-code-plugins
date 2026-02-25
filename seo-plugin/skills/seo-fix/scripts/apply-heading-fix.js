#!/usr/bin/env node
/**
 * apply-heading-fix.js
 * Fixes heading hierarchy issues.
 * Usage: node apply-heading-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyHeadingFix() {
  const filePath = path.join(projectRoot, issue.file);

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Fix: Multiple H1 tags — convert extras to H2
  if (issue.problem.includes('Multiple H1')) {
    let h1Count = 0;
    let modified = false;
    const newLines = lines.map(line => {
      if (line.match(/<h1[\s>]/i)) {
        h1Count++;
        if (h1Count > 1) {
          modified = true;
          return line.replace(/<h1/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
        }
      }
      return line;
    });

    if (modified) {
      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newLines.join('\n'));
      return { success: true, action: `Converted ${h1Count - 1} extra H1 tag(s) to H2.` };
    }
    return { success: false, reason: 'Could not locate extra H1 tags to fix' };
  }

  // Fix: Skipped heading level
  if (issue.problem.includes('Skipped heading level')) {
    const match = issue.problem.match(/H(\d)\s*→\s*H(\d)\s*\(expected\s*H(\d)\)/i);
    if (match) {
      const actualLevel = parseInt(match[2]);
      const expectedLevel = parseInt(match[3]);
      const targetLine = issue.line - 1; // 0-indexed

      if (targetLine >= 0 && targetLine < lines.length) {
        const line = lines[targetLine];
        const oldTag = `h${actualLevel}`;
        const newTag = `h${expectedLevel}`;

        if (line.toLowerCase().includes(`<${oldTag}`)) {
          const regex = new RegExp(`<${oldTag}`, 'gi');
          const closeRegex = new RegExp(`</${oldTag}>`, 'gi');
          lines[targetLine] = line.replace(regex, `<${newTag}`).replace(closeRegex, `</${newTag}>`);

          fs.writeFileSync(filePath + '.bak', content);
          fs.writeFileSync(filePath, lines.join('\n'));
          return { success: true, action: `Changed <${oldTag}> to <${newTag}> at line ${issue.line}.` };
        }
      }
    }
    return { success: false, reason: 'Could not locate the heading tag to fix' };
  }

  return { success: false, reason: 'Heading fix pattern not recognized' };
}

try {
  const result = applyHeadingFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
