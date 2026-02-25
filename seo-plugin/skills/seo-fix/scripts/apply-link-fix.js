#!/usr/bin/env node
/**
 * apply-link-fix.js
 * Fixes internal link issues (converts <a> to framework Link component).
 * Usage: node apply-link-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyLinkFix() {
  const filePath = path.join(projectRoot, issue.file);

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Fix: Convert <a> to framework Link component
  if (issue.problem.includes('instead of next/link') || issue.problem.includes('instead of routerLink') || issue.problem.includes('instead of React Router')) {
    const targetLine = issue.line - 1;

    if (targetLine < 0 || targetLine >= lines.length) {
      return { success: false, reason: 'Target line out of range' };
    }

    const line = lines[targetLine];

    // Determine framework and apply conversion
    if (issue.framework === 'nextjs' || issue.problem.includes('next/link')) {
      return convertToNextLink(filePath, content, lines, targetLine);
    }

    if (issue.framework === 'angular' || issue.problem.includes('routerLink')) {
      return convertToRouterLink(filePath, content, lines, targetLine);
    }

    if (issue.framework === 'react' || issue.problem.includes('React Router')) {
      return convertToReactRouterLink(filePath, content, lines, targetLine);
    }
  }

  return { success: false, reason: 'Link fix pattern not recognized' };
}

function convertToNextLink(filePath, content, lines, targetLine) {
  const line = lines[targetLine];

  // Extract href from <a> tag
  const hrefMatch = line.match(/<a\s[^>]*href=["']([^"']+)["']/i);
  if (!hrefMatch) {
    return { success: false, reason: 'Could not extract href from <a> tag' };
  }

  // Replace <a with <Link and </a> with </Link>
  let newLine = line.replace(/<a\s/i, '<Link ');
  newLine = newLine.replace(/<\/a>/gi, '</Link>');

  lines[targetLine] = newLine;
  let newContent = lines.join('\n');

  // Add import if not present
  if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
    const importMatch = newContent.match(/^(import\s+.*\n)*/m);
    const insertPos = importMatch ? importMatch.index + importMatch[0].length : 0;
    newContent = newContent.slice(0, insertPos) +
      "import Link from 'next/link';\n" +
      newContent.slice(insertPos);
  }

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, newContent);
  return { success: true, action: `Converted <a> to <Link> at line ${targetLine + 1} and added next/link import.` };
}

function convertToRouterLink(filePath, content, lines, targetLine) {
  const line = lines[targetLine];

  // Extract href and convert to routerLink
  const hrefMatch = line.match(/href=["']([^"']+)["']/i);
  if (!hrefMatch) {
    return { success: false, reason: 'Could not extract href from <a> tag' };
  }

  const href = hrefMatch[1];
  let newLine = line.replace(/href=["'][^"']+["']/i, `routerLink="${href}"`);
  lines[targetLine] = newLine;

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));
  return { success: true, action: `Converted href to routerLink="${href}" at line ${targetLine + 1}.` };
}

function convertToReactRouterLink(filePath, content, lines, targetLine) {
  const line = lines[targetLine];

  const hrefMatch = line.match(/<a\s[^>]*href=["']([^"']+)["']/i);
  if (!hrefMatch) {
    return { success: false, reason: 'Could not extract href from <a> tag' };
  }

  const href = hrefMatch[1];

  // Replace <a href="..." with <Link to="..."
  let newLine = line.replace(/<a\s/i, '<Link ');
  newLine = newLine.replace(/href=/i, 'to=');
  newLine = newLine.replace(/<\/a>/gi, '</Link>');

  lines[targetLine] = newLine;
  let newContent = lines.join('\n');

  // Add import if not present
  if (!content.includes("from 'react-router-dom'") && !content.includes('from "react-router-dom"')) {
    const importMatch = newContent.match(/^(import\s+.*\n)*/m);
    const insertPos = importMatch ? importMatch.index + importMatch[0].length : 0;
    newContent = newContent.slice(0, insertPos) +
      "import { Link } from 'react-router-dom';\n" +
      newContent.slice(insertPos);
  }

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, newContent);
  return { success: true, action: `Converted <a> to React Router <Link> at line ${targetLine + 1}.` };
}

try {
  const result = applyLinkFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
