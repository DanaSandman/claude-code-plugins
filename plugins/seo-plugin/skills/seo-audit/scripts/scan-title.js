#!/usr/bin/env node
/**
 * scan-title.js
 * Scans for title tag issues across all frameworks.
 * Usage: node scan-title.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanTitles() {
  const issues = [];
  const titles = []; // Track for duplicate detection

  switch (framework) {
    case 'nextjs':
      scanNextjsTitles(issues, titles);
      break;
    case 'react':
      scanReactTitles(issues, titles);
      break;
    case 'angular':
      scanAngularTitles(issues, titles);
      break;
    case 'html':
      scanHtmlTitles(issues, titles);
      break;
  }

  // Check for duplicate titles
  const titleMap = {};
  for (const t of titles) {
    const key = t.title.toLowerCase().trim();
    if (!titleMap[key]) titleMap[key] = [];
    titleMap[key].push(t);
  }
  for (const [title, entries] of Object.entries(titleMap)) {
    if (entries.length > 1) {
      for (const entry of entries) {
        issues.push({
          severity: 'medium',
          category: 'title',
          file: entry.file,
          line: entry.line,
          problem: `Duplicate title: "${entry.title}" (found in ${entries.length} files)`,
          seoImpact: 'Duplicate titles confuse search engines and reduce click-through rates in search results.',
          recommendedFix: 'Make each page title unique and descriptive of its specific content.',
          autoFixPossible: false
        });
      }
    }
  }

  return { issues };
}

function scanNextjsTitles(issues, titles) {
  const appDirs = [
    path.join(projectRoot, 'app'),
    path.join(projectRoot, 'src', 'app')
  ];
  const pagesDirs = [
    path.join(projectRoot, 'pages'),
    path.join(projectRoot, 'src', 'pages')
  ];

  // App Router: Check for metadata.title or generateMetadata
  for (const dir of appDirs) {
    if (!fs.existsSync(dir)) continue;
    const layoutsAndPages = findFiles(dir, /^(layout|page)\.(tsx?|jsx?)$/);

    for (const file of layoutsAndPages) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;
      const lines = content.split('\n');

      const hasMetadataTitle = content.match(/metadata\s*[:=]\s*\{[^}]*title/s);
      const hasGenerateMetadata = content.includes('generateMetadata');
      const hasTitleTemplate = content.match(/title\s*:\s*\{[^}]*template/s);

      if (path.basename(file).startsWith('layout')) {
        // Root layout should have a title or template
        if (!hasMetadataTitle && !hasGenerateMetadata) {
          issues.push({
            severity: 'high',
            category: 'title',
            file: relPath,
            line: 1,
            problem: 'Layout file missing metadata title or generateMetadata',
            seoImpact: 'Pages without titles appear poorly in search results and may not be indexed properly.',
            recommendedFix: "Add metadata export: export const metadata = { title: 'Your Title' }",
            autoFixPossible: true
          });
        }
      }

      if (path.basename(file).startsWith('page')) {
        if (!hasMetadataTitle && !hasGenerateMetadata) {
          issues.push({
            severity: 'high',
            category: 'title',
            file: relPath,
            line: 1,
            problem: 'Page missing metadata title',
            seoImpact: 'Pages without unique titles rank poorly and have reduced click-through rates.',
            recommendedFix: "Add metadata export: export const metadata = { title: 'Page Title' }",
            autoFixPossible: true
          });
        } else if (hasMetadataTitle) {
          const titleMatch = content.match(/title\s*:\s*['"`]([^'"`]+)['"`]/);
          if (titleMatch) {
            titles.push({ title: titleMatch[1], file: relPath, line: findLineNumber(lines, 'title') });
          }
        }
      }
    }
  }

  // Pages Router: Check for Head component with title
  for (const dir of pagesDirs) {
    if (!fs.existsSync(dir)) continue;
    const pageFiles = findFiles(dir, /\.(tsx?|jsx?)$/);

    for (const file of pageFiles) {
      if (path.basename(file).startsWith('_')) continue;
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;
      const lines = content.split('\n');

      const hasHeadImport = content.includes('next/head');
      const hasTitleTag = content.match(/<title[^>]*>/i);

      if (!hasHeadImport && !hasTitleTag) {
        issues.push({
          severity: 'high',
          category: 'title',
          file: relPath,
          line: 1,
          problem: 'Page missing title (no Head component or title tag found)',
          seoImpact: 'Pages without titles are poorly represented in search results.',
          recommendedFix: "Import Head from 'next/head' and add a <title> tag.",
          autoFixPossible: true
        });
      } else if (hasTitleTag) {
        const titleContentMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleContentMatch) {
          titles.push({ title: titleContentMatch[1], file: relPath, line: findLineNumber(lines, '<title') });
        }
      }
    }
  }
}

function scanReactTitles(issues, titles) {
  const srcDirs = [
    path.join(projectRoot, 'src'),
    projectRoot
  ];

  for (const dir of srcDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = findFiles(dir, /\.(tsx?|jsx?)$/);

    for (const file of files) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;
      const lines = content.split('\n');

      // Check for Helmet title usage
      const hasHelmet = content.includes('Helmet');
      const hasTitleTag = content.match(/<title[^>]*>/i);

      if (hasHelmet && hasTitleTag) {
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          titles.push({ title: titleMatch[1], file: relPath, line: findLineNumber(lines, '<title') });
        }
      }
    }
  }

  // Check index.html for default title
  const indexHtml = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexHtml)) {
    const content = readFileSafe(indexHtml);
    if (content) {
      const hasTitleTag = content.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (!hasTitleTag || !hasTitleTag[1].trim() || hasTitleTag[1].includes('React App')) {
        issues.push({
          severity: 'high',
          category: 'title',
          file: 'public/index.html',
          line: findLineNumber(content.split('\n'), '<title'),
          problem: 'Default or missing title in index.html',
          seoImpact: 'The default "React App" title provides no SEO value.',
          recommendedFix: "Set a descriptive title in public/index.html and use react-helmet for per-page titles.",
          autoFixPossible: true
        });
      }
    }
  }
}

function scanAngularTitles(issues, titles) {
  // Check index.html
  const indexHtml = path.join(projectRoot, 'src', 'index.html');
  if (fs.existsSync(indexHtml)) {
    const content = readFileSafe(indexHtml);
    if (content) {
      const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (!titleMatch || !titleMatch[1].trim()) {
        issues.push({
          severity: 'high',
          category: 'title',
          file: 'src/index.html',
          line: findLineNumber(content.split('\n'), '<title'),
          problem: 'Missing or empty title tag in index.html',
          seoImpact: 'Pages without titles are poorly represented in search results.',
          recommendedFix: "Add a descriptive <title> tag and use Angular's Title service for dynamic titles.",
          autoFixPossible: true
        });
      }
    }
  }

  // Check for Title service usage in components
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const tsFiles = findFiles(srcDir, /\.ts$/);
    let titleServiceUsed = false;

    for (const file of tsFiles) {
      const content = readFileSafe(file);
      if (content && content.includes('Title') && content.includes('@angular/platform-browser')) {
        titleServiceUsed = true;
        break;
      }
    }

    if (!titleServiceUsed) {
      issues.push({
        severity: 'medium',
        category: 'title',
        file: 'src/',
        line: 1,
        problem: "Angular Title service not used for dynamic page titles",
        seoImpact: 'Without dynamic titles, all pages share the same title from index.html.',
        recommendedFix: "Import Title from '@angular/platform-browser' and use titleService.setTitle() in route components.",
        autoFixPossible: false
      });
    }
  }
}

function scanHtmlTitles(issues, titles) {
  const htmlFiles = findFiles(projectRoot, /\.html?$/i);

  for (const file of htmlFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (!titleMatch) {
      issues.push({
        severity: 'critical',
        category: 'title',
        file: relPath,
        line: 1,
        problem: 'HTML file missing <title> tag',
        seoImpact: 'Pages without title tags cannot be properly indexed or displayed in search results.',
        recommendedFix: "Add a <title> tag inside <head> with a descriptive, unique title.",
        autoFixPossible: true
      });
    } else if (!titleMatch[1].trim()) {
      issues.push({
        severity: 'critical',
        category: 'title',
        file: relPath,
        line: findLineNumber(lines, '<title'),
        problem: 'Empty <title> tag',
        seoImpact: 'An empty title is equivalent to having no title for SEO purposes.',
        recommendedFix: "Add descriptive text inside the <title> tag.",
        autoFixPossible: true
      });
    } else {
      titles.push({ title: titleMatch[1], file: relPath, line: findLineNumber(lines, '<title') });
    }
  }

  if (htmlFiles.length === 0) {
    issues.push({
      severity: 'low',
      category: 'title',
      file: '.',
      line: 1,
      problem: 'No HTML files found in project',
      seoImpact: 'Cannot verify title tags without HTML files.',
      recommendedFix: "Ensure HTML files are in the project root or a public directory.",
      autoFixPossible: false
    });
  }
}

function findFiles(dir, pattern, maxDepth = 10, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build' || entry.name === '.next') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, maxDepth, currentDepth + 1));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

function readFileSafe(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function findLineNumber(lines, search) {
  const idx = lines.findIndex(l => l.includes(search));
  return idx >= 0 ? idx + 1 : 1;
}

try {
  const result = scanTitles();
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
