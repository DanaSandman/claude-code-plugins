#!/usr/bin/env node
/**
 * apply-images-fix.js
 * Fixes image accessibility issues.
 * Usage: node apply-images-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

const DECORATIVE_HINTS = /icon|decorat|separator|divider|spacer|background|bg-|ornament/i;

function applyFix() {
  const filePath = path.join(projectRoot, issue.file);
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lineIdx = issue.line ? issue.line - 1 : -1;
  const problem = issue.problem || '';

  if (lineIdx < 0 || lineIdx >= lines.length) {
    return { success: false, reason: 'Could not locate the issue line.' };
  }

  // Decorative img missing alt=""
  if (problem.includes('decorative') && problem.includes('missing alt')) {
    return fixImgAlt(filePath, content, lines, lineIdx, true);
  }

  // img missing alt attribute
  if (problem.includes('<img>') && problem.includes('missing alt')) {
    return fixImgAlt(filePath, content, lines, lineIdx, false);
  }

  // Next.js Image missing alt
  if (problem.includes('Image component missing alt')) {
    return fixNextImageAlt(filePath, content, lines, lineIdx);
  }

  return { success: false, reason: 'This image issue requires manual review.' };
}

function fixImgAlt(filePath, content, lines, lineIdx, isDecorative) {
  const line = lines[lineIdx];
  const imgMatch = /<img\s/i.exec(line);
  if (!imgMatch) {
    return { success: false, reason: 'Could not find <img> on target line.' };
  }

  const tagStart = imgMatch.index;
  const tagEnd = line.indexOf('>', tagStart);
  const tag = line.substring(tagStart, tagEnd + 1);

  if (/\balt\s*=/.test(tag)) {
    return { success: false, reason: 'Image already has an alt attribute.' };
  }

  // Determine if decorative based on src/class hints
  let altValue;
  if (isDecorative) {
    altValue = '';
  } else {
    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/);
    const classMatch = tag.match(/\b(class|className)\s*=\s*["']([^"']+)["']/);
    const looksDecorative = (srcMatch && DECORATIVE_HINTS.test(srcMatch[1])) ||
                             (classMatch && DECORATIVE_HINTS.test(classMatch[2]));
    altValue = looksDecorative ? '' : 'TODO: describe image';
  }

  const insertPos = imgMatch.index + imgMatch[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + `alt="${altValue}" ` + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  const desc = altValue === ''
    ? `Added alt="" (decorative) to <img> in ${issue.file} line ${issue.line}.`
    : `Added alt="TODO: describe image" to <img> in ${issue.file} line ${issue.line}. Please update.`;

  return { success: true, action: desc };
}

function fixNextImageAlt(filePath, content, lines, lineIdx) {
  const line = lines[lineIdx];
  const imgMatch = /<Image\s/.exec(line);
  if (!imgMatch) {
    return { success: false, reason: 'Could not find <Image> on target line.' };
  }

  const tagStart = imgMatch.index;
  const tagEnd = line.indexOf('>', tagStart);
  const tag = tagEnd > -1 ? line.substring(tagStart, tagEnd + 1) : '';

  if (/\balt\s*=/.test(tag) || /\balt\s*=/.test(line)) {
    return { success: false, reason: 'Image component already has an alt attribute.' };
  }

  const insertPos = imgMatch.index + imgMatch[0].length;
  lines[lineIdx] = line.slice(0, insertPos) + 'alt="TODO: describe image" ' + line.slice(insertPos);

  fs.writeFileSync(filePath + '.bak', content);
  fs.writeFileSync(filePath, lines.join('\n'));

  return { success: true, action: `Added alt="TODO: describe image" to <Image> in ${issue.file} line ${issue.line}. Please update.` };
}

try {
  const result = applyFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
