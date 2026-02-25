#!/usr/bin/env node
/**
 * scan-meta.js
 * Scans for meta description issues across all frameworks.
 * Usage: node scan-meta.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

const MIN_DESC_LENGTH = 70;
const MAX_DESC_LENGTH = 160;

function scanMeta() {
  const issues = [];
  const descriptions = [];

  switch (framework) {
    case 'nextjs':
      scanNextjsMeta(issues, descriptions);
      break;
    case 'react':
      scanReactMeta(issues, descriptions);
      break;
    case 'angular':
      scanAngularMeta(issues, descriptions);
      break;
    case 'html':
      scanHtmlMeta(issues, descriptions);
      break;
  }

  // Check for duplicate descriptions
  const descMap = {};
  for (const d of descriptions) {
    const key = d.description.toLowerCase().trim();
    if (!descMap[key]) descMap[key] = [];
    descMap[key].push(d);
  }
  for (const [desc, entries] of Object.entries(descMap)) {
    if (entries.length > 1) {
      for (const entry of entries) {
        issues.push({
          severity: 'medium',
          category: 'meta-description',
          file: entry.file,
          line: entry.line,
          problem: `Duplicate meta description found in ${entries.length} files`,
          seoImpact: 'Duplicate descriptions reduce uniqueness signals for search engines and lower click-through rates.',
          recommendedFix: 'Write a unique description for each page that summarizes its specific content.',
          autoFixPossible: false
        });
      }
    }
  }

  return { issues };
}

function scanNextjsMeta(issues, descriptions) {
  const appDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src', 'app')];
  const pagesDirs = [path.join(projectRoot, 'pages'), path.join(projectRoot, 'src', 'pages')];

  // App Router
  for (const dir of appDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = findFiles(dir, /^(layout|page)\.(tsx?|jsx?)$/);

    for (const file of files) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;
      const lines = content.split('\n');

      if (!path.basename(file).startsWith('page')) continue;

      const hasMetadataDesc = content.match(/metadata\s*[:=]\s*\{[^}]*description/s);
      const hasGenerateMetadata = content.includes('generateMetadata');

      if (!hasMetadataDesc && !hasGenerateMetadata) {
        issues.push({
          severity: 'high',
          category: 'meta-description',
          file: relPath,
          line: 1,
          problem: 'Page missing meta description in metadata export',
          seoImpact: 'Pages without meta descriptions show auto-generated snippets in search results, reducing click-through rates.',
          recommendedFix: "Add description to metadata: export const metadata = { description: 'Your description here' }",
          autoFixPossible: true
        });
      } else if (hasMetadataDesc) {
        const descMatch = content.match(/description\s*:\s*['"`]([^'"`]+)['"`]/);
        if (descMatch) {
          checkDescriptionLength(descMatch[1], relPath, findLineNumber(lines, 'description'), issues);
          descriptions.push({ description: descMatch[1], file: relPath, line: findLineNumber(lines, 'description') });
        }
      }
    }
  }

  // Pages Router
  for (const dir of pagesDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = findFiles(dir, /\.(tsx?|jsx?)$/);

    for (const file of files) {
      if (path.basename(file).startsWith('_')) continue;
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;

      const hasMetaDesc = content.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          content.match(/content=["']([^"']+)["'][^>]*name=["']description["']/i);

      if (!hasMetaDesc) {
        issues.push({
          severity: 'high',
          category: 'meta-description',
          file: relPath,
          line: 1,
          problem: 'Page missing meta description',
          seoImpact: 'Without a meta description, search engines generate their own snippet which may not represent the page well.',
          recommendedFix: "Add <meta name='description' content='...' /> inside the Head component.",
          autoFixPossible: true
        });
      }
    }
  }
}

function scanReactMeta(issues, descriptions) {
  // Check index.html
  const indexHtml = path.join(projectRoot, 'public', 'index.html');
  if (fs.existsSync(indexHtml)) {
    const content = readFileSafe(indexHtml);
    if (content) {
      const metaDesc = content.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i);
      if (!metaDesc || !metaDesc[1].trim()) {
        issues.push({
          severity: 'high',
          category: 'meta-description',
          file: 'public/index.html',
          line: findLineNumber(content.split('\n'), 'description') || 1,
          problem: 'Missing or empty meta description in index.html',
          seoImpact: 'The default page has no description for search engines.',
          recommendedFix: "Add <meta name='description' content='Your site description' /> to index.html.",
          autoFixPossible: true
        });
      }
    }
  }

  // Check for Helmet usage with descriptions
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const files = findFiles(srcDir, /\.(tsx?|jsx?)$/);
    let helmetDescCount = 0;

    for (const file of files) {
      const content = readFileSafe(file);
      if (!content) continue;
      if (content.includes('Helmet') && content.match(/name=["']description["']/)) {
        helmetDescCount++;
        const descMatch = content.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch) {
          const relPath = path.relative(projectRoot, file);
          checkDescriptionLength(descMatch[1], relPath, findLineNumber(content.split('\n'), 'description'), issues);
          descriptions.push({ description: descMatch[1], file: relPath, line: findLineNumber(content.split('\n'), 'description') });
        }
      }
    }
  }
}

function scanAngularMeta(issues, descriptions) {
  const indexHtml = path.join(projectRoot, 'src', 'index.html');
  if (fs.existsSync(indexHtml)) {
    const content = readFileSafe(indexHtml);
    if (content) {
      const metaDesc = content.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i);
      if (!metaDesc || !metaDesc[1].trim()) {
        issues.push({
          severity: 'high',
          category: 'meta-description',
          file: 'src/index.html',
          line: 1,
          problem: 'Missing or empty meta description in index.html',
          seoImpact: 'Without a meta description, search results show auto-generated snippets.',
          recommendedFix: "Add <meta name='description' content='Your description' /> to src/index.html.",
          autoFixPossible: true
        });
      }
    }
  }

  // Check for Meta service usage
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const tsFiles = findFiles(srcDir, /\.ts$/);
    let metaServiceUsed = false;

    for (const file of tsFiles) {
      const content = readFileSafe(file);
      if (content && content.includes('Meta') && content.includes('@angular/platform-browser')) {
        metaServiceUsed = true;
        break;
      }
    }

    if (!metaServiceUsed) {
      issues.push({
        severity: 'medium',
        category: 'meta-description',
        file: 'src/',
        line: 1,
        problem: 'Angular Meta service not used for dynamic meta descriptions',
        seoImpact: 'All pages share the same meta description from index.html.',
        recommendedFix: "Import Meta from '@angular/platform-browser' and use metaService.updateTag() in route components.",
        autoFixPossible: false
      });
    }
  }
}

function scanHtmlMeta(issues, descriptions) {
  const htmlFiles = findFiles(projectRoot, /\.html?$/i);

  for (const file of htmlFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    const metaDesc = content.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                     content.match(/content=["']([^"']*)["'][^>]*name=["']description["']/i);

    if (!metaDesc) {
      issues.push({
        severity: 'high',
        category: 'meta-description',
        file: relPath,
        line: 1,
        problem: 'HTML file missing meta description tag',
        seoImpact: 'Search engines cannot generate meaningful snippets without a meta description.',
        recommendedFix: "Add <meta name='description' content='Page description here' /> inside <head>.",
        autoFixPossible: true
      });
    } else if (!metaDesc[1].trim()) {
      issues.push({
        severity: 'high',
        category: 'meta-description',
        file: relPath,
        line: findLineNumber(lines, 'description'),
        problem: 'Empty meta description',
        seoImpact: 'An empty description is equivalent to having none.',
        recommendedFix: "Add descriptive content to the meta description tag.",
        autoFixPossible: true
      });
    } else {
      checkDescriptionLength(metaDesc[1], relPath, findLineNumber(lines, 'description'), issues);
      descriptions.push({ description: metaDesc[1], file: relPath, line: findLineNumber(lines, 'description') });
    }
  }
}

function checkDescriptionLength(desc, file, line, issues) {
  if (desc.length < MIN_DESC_LENGTH) {
    issues.push({
      severity: 'medium',
      category: 'meta-description',
      file,
      line,
      problem: `Meta description too short (${desc.length} chars, minimum ${MIN_DESC_LENGTH})`,
      seoImpact: 'Short descriptions may not provide enough context in search results.',
      recommendedFix: `Expand the description to at least ${MIN_DESC_LENGTH} characters.`,
      autoFixPossible: false
    });
  } else if (desc.length > MAX_DESC_LENGTH) {
    issues.push({
      severity: 'low',
      category: 'meta-description',
      file,
      line,
      problem: `Meta description too long (${desc.length} chars, maximum ${MAX_DESC_LENGTH})`,
      seoImpact: 'Long descriptions get truncated in search results.',
      recommendedFix: `Shorten the description to under ${MAX_DESC_LENGTH} characters.`,
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

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }
function findLineNumber(lines, search) { const i = lines.findIndex(l => l.includes(search)); return i >= 0 ? i + 1 : 1; }

try {
  console.log(JSON.stringify(scanMeta(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
