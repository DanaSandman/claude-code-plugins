#!/usr/bin/env node
/**
 * scan-images.js
 * Scans for image SEO issues (alt attributes, framework image components).
 * Usage: node scan-images.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanImages() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Find all <img> tags (self-closing and standard)
    const imgPattern = /<img\s([^>]*?)\/?\s*>/gi;
    let match;

    while ((match = imgPattern.exec(content)) !== null) {
      const attrs = match[1];
      const lineNum = content.substring(0, match.index).split('\n').length;

      // Check for missing alt attribute
      const hasAlt = /\balt\s*=/.test(attrs);
      if (!hasAlt) {
        issues.push({
          severity: 'high',
          category: 'images',
          file: relPath,
          line: lineNum,
          problem: '<img> tag missing alt attribute',
          seoImpact: 'Images without alt text cannot be indexed by search engines and are inaccessible to screen readers.',
          recommendedFix: 'Add a descriptive alt attribute: <img alt="Description of image" />',
          autoFixPossible: true
        });
      } else {
        // Check for empty alt on potentially non-decorative images
        const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/);
        if (altMatch && altMatch[1].trim() === '') {
          // Check if it's likely decorative (has role="presentation" or aria-hidden)
          const isDecorative = /role\s*=\s*["']presentation["']/.test(attrs) || /aria-hidden\s*=\s*["']true["']/.test(attrs);
          if (!isDecorative) {
            issues.push({
              severity: 'medium',
              category: 'images',
              file: relPath,
              line: lineNum,
              problem: '<img> tag has empty alt attribute (may not be decorative)',
              seoImpact: 'Empty alt text should only be used for decorative images. Content images need descriptive alt text.',
              recommendedFix: 'Add descriptive alt text, or if decorative, add role="presentation".',
              autoFixPossible: false
            });
          }
        }
      }

      // Check for missing width/height (causes layout shift)
      const hasWidth = /\bwidth\s*=/.test(attrs);
      const hasHeight = /\bheight\s*=/.test(attrs);
      if (!hasWidth || !hasHeight) {
        issues.push({
          severity: 'low',
          category: 'images',
          file: relPath,
          line: lineNum,
          problem: '<img> tag missing explicit width/height attributes',
          seoImpact: 'Missing dimensions cause Cumulative Layout Shift (CLS), a Core Web Vital that affects SEO ranking.',
          recommendedFix: 'Add width and height attributes to prevent layout shift.',
          autoFixPossible: false
        });
      }

      // Framework-specific: check for native <img> instead of framework component
      if (framework === 'nextjs') {
        const hasNextImage = content.includes('next/image') || content.includes('next/legacy/image');
        if (!hasNextImage) {
          issues.push({
            severity: 'high',
            category: 'images',
            file: relPath,
            line: lineNum,
            problem: 'Using native <img> tag instead of next/image component',
            seoImpact: 'next/image provides automatic optimization, lazy loading, responsive images, and WebP/AVIF conversion. Native <img> misses these SEO and performance benefits.',
            recommendedFix: "Import Image from 'next/image' and replace <img> with <Image>.",
            autoFixPossible: true
          });
        }
      }
    }

    // For Next.js: Check Image components for alt
    if (framework === 'nextjs') {
      const imageComponentPattern = /<Image\s([^>]*?)\/?\s*>/gi;
      while ((match = imageComponentPattern.exec(content)) !== null) {
        const attrs = match[1];
        const lineNum = content.substring(0, match.index).split('\n').length;

        const hasAlt = /\balt\s*=/.test(attrs);
        if (!hasAlt) {
          issues.push({
            severity: 'high',
            category: 'images',
            file: relPath,
            line: lineNum,
            problem: 'Next.js Image component missing alt attribute',
            seoImpact: 'Images without alt text cannot be indexed and harm accessibility.',
            recommendedFix: 'Add a descriptive alt prop: <Image alt="Description" />',
            autoFixPossible: true
          });
        }
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
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.(tsx?|jsx?)$/) : [];
    },
    angular: () => {
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.html$/) : [];
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
