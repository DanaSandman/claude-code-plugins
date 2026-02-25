#!/usr/bin/env node
/**
 * apply-semantic-fix.js
 * Fixes semantic HTML structure issues.
 * Usage: node apply-semantic-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applySemanticFix() {
  const filePath = path.join(projectRoot, issue.file);

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Fix: Missing <main> tag
  if (issue.problem.includes('Missing <main>')) {
    // Try to find the main content area and wrap it
    // For HTML: look for content between header and footer
    // For JSX/TSX: look for the return statement's main content

    const ext = path.extname(filePath);

    if (ext === '.html' || ext === '.htm') {
      // Strategy: wrap content between </header> and <footer> with <main>
      let newContent = content;
      const hasHeader = content.includes('</header>');
      const hasFooter = content.includes('<footer');

      if (hasHeader && hasFooter) {
        newContent = content.replace('</header>', '</header>\n<main>');
        newContent = newContent.replace(/<footer/i, '</main>\n<footer');
      } else if (content.includes('<body')) {
        // No header/footer, wrap the body content
        newContent = content.replace(/<body([^>]*)>/, '<body$1>\n<main>');
        newContent = newContent.replace('</body>', '</main>\n</body>');
      } else {
        return { success: false, reason: 'Could not identify where to insert <main> tag' };
      }

      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newContent);
      return { success: true, action: 'Added <main> wrapper around primary content area.' };
    }

    // For JSX/TSX files, this is harder to do safely
    return { success: false, reason: 'Automatic <main> insertion in JSX/TSX requires manual review for safety.' };
  }

  // Fix: Missing <header>
  if (issue.problem.includes('Missing <header>')) {
    const ext = path.extname(filePath);
    if (ext === '.html' || ext === '.htm') {
      // Look for nav element or first content after body
      if (content.includes('<nav')) {
        const newContent = content.replace(/<nav/i, '<header>\n<nav');
        const withClose = newContent.replace(/<\/nav>/i, '</nav>\n</header>');
        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, withClose);
        return { success: true, action: 'Wrapped <nav> element in a <header> tag.' };
      }
    }
    return { success: false, reason: 'Could not safely add <header> tag.' };
  }

  // Fix: Missing <nav>
  if (issue.problem.includes('no <nav>')) {
    return { success: false, reason: 'Navigation wrapping requires manual review to identify the correct element.' };
  }

  // Fix: Missing <footer>
  if (issue.problem.includes('Missing <footer>')) {
    return { success: false, reason: 'Footer wrapping requires manual identification of footer content.' };
  }

  return { success: false, reason: 'Semantic fix pattern not recognized' };
}

try {
  const result = applySemanticFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
