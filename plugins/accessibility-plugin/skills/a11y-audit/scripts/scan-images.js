#!/usr/bin/env node
/**
 * scan-images.js
 * Scans for image accessibility issues.
 * Detects: missing alt, decorative images without alt="", role="img" without name.
 * Usage: node scan-images.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

const DECORATIVE_HINTS = /icon|decorat|separator|divider|spacer|background|bg-|ornament/i;

function scanImages() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    // Find all <img> tags
    const imgPattern = /<img\s([^>]*?)\/?\s*>/gi;
    let match;

    while ((match = imgPattern.exec(content)) !== null) {
      const attrs = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;

      const hasAlt = /\balt\s*=/.test(attrs);
      if (!hasAlt) {
        // Check if likely decorative
        const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/);
        const classMatch = attrs.match(/\b(class|className)\s*=\s*["']([^"']+)["']/);
        const isLikelyDecorative = (srcMatch && DECORATIVE_HINTS.test(srcMatch[1])) ||
                                    (classMatch && DECORATIVE_HINTS.test(classMatch[2]));

        if (isLikelyDecorative) {
          issues.push({
            severity: 'medium',
            category: 'images',
            file: relPath,
            line: lineNum,
            problem: 'Likely decorative <img> missing alt="" — should have empty alt to be ignored by screen readers',
            impact: 'Without alt="", screen readers may announce the filename, which is confusing for decorative images.',
            recommendedFix: 'Add alt="" to mark this image as decorative.',
            autoFixPossible: true,
            wcagCriteria: '1.1.1',
            wcagLevel: 'A'
          });
        } else {
          issues.push({
            severity: 'critical',
            category: 'images',
            file: relPath,
            line: lineNum,
            problem: '<img> tag missing alt attribute',
            impact: 'Screen readers cannot describe this image. Depending on browser, they may read the filename or URL, which is meaningless.',
            recommendedFix: 'Add a descriptive alt attribute. If decorative, add alt="".',
            autoFixPossible: true,
            wcagCriteria: '1.1.1',
            wcagLevel: 'A'
          });
        }
      }
    }

    // Next.js Image component
    if (framework === 'nextjs') {
      const imageCompPattern = /<Image\s([^>]*?)\/?\s*>/gi;
      while ((match = imageCompPattern.exec(content)) !== null) {
        const attrs = match[1];
        const lineNum = content.substring(0, match.index).split('\n').length;
        const hasAlt = /\balt\s*=/.test(attrs);
        if (!hasAlt) {
          issues.push({
            severity: 'critical',
            category: 'images',
            file: relPath,
            line: lineNum,
            problem: 'Next.js Image component missing alt attribute',
            impact: 'Screen readers cannot describe this image.',
            recommendedFix: 'Add alt="descriptive text" or alt="" if decorative.',
            autoFixPossible: true,
            wcagCriteria: '1.1.1',
            wcagLevel: 'A'
          });
        }
      }
    }

    // role="img" without accessible name
    const roleImgPattern = /role\s*=\s*["']img["']/gi;
    while ((match = roleImgPattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      // Get the full tag
      const tagStart = content.lastIndexOf('<', match.index);
      const tagEnd = content.indexOf('>', match.index);
      const tag = content.substring(tagStart, tagEnd + 1);

      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(tag);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(tag);
      const hasAlt = /\balt\s*=\s*["'][^"']+["']/.test(tag);

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasAlt) {
        issues.push({
          severity: 'high',
          category: 'images',
          file: relPath,
          line: lineNum,
          problem: 'Element with role="img" has no accessible name',
          impact: 'Screen readers identify this as an image but have no description to announce.',
          recommendedFix: 'Add aria-label="description" or aria-labelledby pointing to a visible label.',
          autoFixPossible: false,
          wcagCriteria: '1.1.1',
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
  console.log(JSON.stringify(scanImages(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
