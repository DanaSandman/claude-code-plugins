#!/usr/bin/env node
/**
 * apply-meta-fix.js
 * Fixes title and meta description issues.
 * Usage: node apply-meta-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyMetaFix() {
  const filePath = path.join(projectRoot, issue.file);

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const backup = content; // Keep backup in memory

  // Determine fix type based on category and framework
  if (issue.category === 'title') {
    return fixTitle(filePath, content, issue);
  } else if (issue.category === 'meta-description') {
    return fixMetaDescription(filePath, content, issue);
  }

  return { success: false, reason: 'Unknown meta fix type' };
}

function fixTitle(filePath, content, issue) {
  const ext = path.extname(filePath);

  // HTML files: add or fix title tag
  if (ext === '.html' || ext === '.htm') {
    if (!content.includes('<title')) {
      // Add title tag inside <head>
      const headMatch = content.match(/<head[^>]*>/i);
      if (headMatch) {
        const insertPos = headMatch.index + headMatch[0].length;
        const newContent = content.slice(0, insertPos) +
          '\n  <title>Page Title - Update This</title>' +
          content.slice(insertPos);

        // Backup and write
        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, newContent);
        return { success: true, action: 'Added placeholder <title> tag. Please update with a descriptive title.' };
      }
      return { success: false, reason: 'No <head> tag found to insert title' };
    }

    // Fix empty title
    if (content.match(/<title[^>]*>\s*<\/title>/i)) {
      const newContent = content.replace(/<title[^>]*>\s*<\/title>/i, '<title>Page Title - Update This</title>');
      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newContent);
      return { success: true, action: 'Added placeholder text to empty <title> tag. Please update with a descriptive title.' };
    }
  }

  // TSX/JSX files (Next.js App Router): add metadata export
  if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
    const hasMetadata = content.includes('metadata');
    const hasGenerateMetadata = content.includes('generateMetadata');

    if (!hasMetadata && !hasGenerateMetadata) {
      // Add metadata export at the top of the file (after imports)
      const importEndMatch = content.match(/^(import\s+.*\n)*\n/m);
      const insertPos = importEndMatch ? importEndMatch.index + importEndMatch[0].length : 0;

      const metadataExport = "export const metadata = {\n  title: 'Page Title - Update This',\n};\n\n";
      const newContent = content.slice(0, insertPos) + metadataExport + content.slice(insertPos);

      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newContent);
      return { success: true, action: 'Added metadata export with placeholder title. Please update with a descriptive title.' };
    }
  }

  return { success: false, reason: 'Could not determine how to fix title in this file type' };
}

function fixMetaDescription(filePath, content, issue) {
  const ext = path.extname(filePath);

  // HTML files
  if (ext === '.html' || ext === '.htm') {
    if (!content.match(/<meta\s+name=["']description["']/i)) {
      const headMatch = content.match(/<head[^>]*>/i);
      if (headMatch) {
        const insertPos = headMatch.index + headMatch[0].length;
        const newContent = content.slice(0, insertPos) +
          '\n  <meta name="description" content="Page description - Update this with a relevant description of 120-160 characters">' +
          content.slice(insertPos);

        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, newContent);
        return { success: true, action: 'Added placeholder meta description. Please update with relevant content.' };
      }
      return { success: false, reason: 'No <head> tag found' };
    }

    // Fix empty description
    if (content.match(/<meta\s+name=["']description["'][^>]*content=["']\s*["']/i)) {
      const newContent = content.replace(
        /(<meta\s+name=["']description["'][^>]*content=["'])\s*(["'])/i,
        '$1Page description - Update this with a relevant description$2'
      );
      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newContent);
      return { success: true, action: 'Added placeholder text to empty meta description. Please update.' };
    }
  }

  // TSX/JSX files (Next.js App Router)
  if (ext === '.tsx' || ext === '.ts' || ext === '.jsx' || ext === '.js') {
    // Check if metadata export exists but missing description
    const metadataMatch = content.match(/export\s+const\s+metadata\s*=\s*\{/);
    if (metadataMatch) {
      // Add description to existing metadata
      const insertPos = metadataMatch.index + metadataMatch[0].length;
      const afterBrace = content.slice(insertPos);

      if (!afterBrace.match(/description\s*:/)) {
        const newContent = content.slice(0, insertPos) +
          "\n  description: 'Page description - Update this with relevant content'," +
          content.slice(insertPos);

        fs.writeFileSync(filePath + '.bak', content);
        fs.writeFileSync(filePath, newContent);
        return { success: true, action: 'Added placeholder description to existing metadata export. Please update.' };
      }
    }

    // No metadata export — add one with description
    if (!content.includes('metadata') && !content.includes('generateMetadata')) {
      const importEndMatch = content.match(/^(import\s+.*\n)*\n/m);
      const insertPos = importEndMatch ? importEndMatch.index + importEndMatch[0].length : 0;

      const metadataExport = "export const metadata = {\n  description: 'Page description - Update this with relevant content',\n};\n\n";
      const newContent = content.slice(0, insertPos) + metadataExport + content.slice(insertPos);

      fs.writeFileSync(filePath + '.bak', content);
      fs.writeFileSync(filePath, newContent);
      return { success: true, action: 'Added metadata export with placeholder description. Please update.' };
    }
  }

  return { success: false, reason: 'Could not determine how to fix meta description in this file' };
}

try {
  const result = applyMetaFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
