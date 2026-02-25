#!/usr/bin/env node
/**
 * apply-image-fix.js
 * Fixes image SEO issues (alt attributes, framework components).
 * Usage: node apply-image-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyImageFix() {
  const filePath = path.join(projectRoot, issue.file);

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Fix: Missing alt attribute on <img>
  if (issue.problem.includes('missing alt attribute') || issue.problem.includes('missing alt')) {
    const targetLine = issue.line - 1;
    if (targetLine >= 0 && targetLine < lines.length) {
      const line = lines[targetLine];

      // Add alt="" placeholder to <img> tag
      if (line.match(/<img\s/i)) {
        const newLine = line.replace(/<img\s/i, '<img alt="TODO: Add descriptive alt text" ');
        lines[targetLine] = newLine;

        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, lines.join('\n'));
        return { success: true, action: `Added placeholder alt attribute at line ${issue.line}. Please update with descriptive text.` };
      }

      // Add alt="" to <Image> component
      if (line.match(/<Image\s/)) {
        const newLine = line.replace(/<Image\s/, '<Image alt="TODO: Add descriptive alt text" ');
        lines[targetLine] = newLine;

        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, lines.join('\n'));
        return { success: true, action: `Added placeholder alt prop to Image component at line ${issue.line}. Please update.` };
      }
    }
    return { success: false, reason: 'Could not locate image tag at specified line' };
  }

  // Fix: Convert <img> to next/image
  if (issue.problem.includes('native <img>') && issue.problem.includes('next/image')) {
    // Check if next/image is already imported
    const hasImport = content.includes("from 'next/image'") || content.includes('from "next/image"');

    let newContent = content;

    // Add import if needed
    if (!hasImport) {
      const importMatch = content.match(/^(import\s+.*\n)*/m);
      const insertPos = importMatch ? importMatch.index + importMatch[0].length : 0;
      newContent = newContent.slice(0, insertPos) +
        "import Image from 'next/image';\n" +
        newContent.slice(insertPos);
    }

    // Replace <img> with <Image> at the specific line
    const newLines = newContent.split('\n');
    const targetLine = issue.line - 1;
    if (targetLine >= 0 && targetLine < newLines.length) {
      const line = newLines[targetLine];
      if (line.match(/<img\s/i)) {
        // Convert <img to <Image
        let newLine = line.replace(/<img\s/i, '<Image ');
        // Ensure self-closing
        if (!newLine.includes('/>')) {
          newLine = newLine.replace(/>$/, ' />');
        }
        newLines[targetLine] = newLine;

        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, newLines.join('\n'));
        return { success: true, action: `Converted <img> to <Image> at line ${issue.line}. Verify width/height props are set.` };
      }
    }

    return { success: false, reason: 'Could not locate <img> tag to convert' };
  }

  return { success: false, reason: 'Image fix pattern not recognized' };
}

try {
  const result = applyImageFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
