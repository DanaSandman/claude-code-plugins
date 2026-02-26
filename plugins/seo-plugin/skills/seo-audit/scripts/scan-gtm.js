#!/usr/bin/env node
/**
 * scan-gtm.js
 * Scans for Google Tag Manager integration issues across all frameworks.
 * Usage: node scan-gtm.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

const GTM_SCRIPT_PATTERN = /googletagmanager\.com\/gtm\.js/;
const GTM_NOSCRIPT_PATTERN = /googletagmanager\.com\/ns\.html/;
const GTM_ID_PATTERN = /GTM-[A-Z0-9]+/;
const HARDCODED_GTM_ID = /['"`]GTM-[A-Z0-9]+['"`]/;

const ENV_VAR_NAMES = [
  'NEXT_PUBLIC_GTM_ID',
  'VITE_GTM_ID',
  'REACT_APP_GTM_ID',
  'GTM_ID',
  'GATSBY_GTM_ID',
  'NG_APP_GTM_ID'
];

function scanGtm() {
  const issues = [];

  switch (framework) {
    case 'nextjs':
      scanNextjsGtm(issues);
      break;
    case 'react':
      scanReactGtm(issues);
      break;
    case 'angular':
      scanAngularGtm(issues);
      break;
    case 'html':
      scanHtmlGtm(issues);
      break;
  }

  return { issues };
}

function scanNextjsGtm(issues) {
  const appDirs = [path.join(projectRoot, 'app'), path.join(projectRoot, 'src', 'app')];
  const pagesDirs = [path.join(projectRoot, 'pages'), path.join(projectRoot, 'src', 'pages')];

  let gtmFound = false;

  // App Router: check layout files
  for (const dir of appDirs) {
    if (!fs.existsSync(dir)) continue;
    const layoutFiles = findFiles(dir, /^layout\.(tsx?|jsx?)$/);

    for (const file of layoutFiles) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;

      const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
      const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

      if (hasGtmScript || hasGtmNoscript) {
        gtmFound = true;
        checkGtmPlacement(content, relPath, issues, 'nextjs-app');
        checkGtmEnvUsage(content, relPath, issues);
      }
    }
  }

  // Pages Router: check _document and _app files
  for (const dir of pagesDirs) {
    if (!fs.existsSync(dir)) continue;
    const docFiles = findFiles(dir, /^_document\.(tsx?|jsx?)$/);
    const appFiles = findFiles(dir, /^_app\.(tsx?|jsx?)$/);

    for (const file of [...docFiles, ...appFiles]) {
      const relPath = path.relative(projectRoot, file);
      const content = readFileSafe(file);
      if (!content) continue;

      const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
      const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

      if (hasGtmScript || hasGtmNoscript) {
        gtmFound = true;
        checkGtmPlacement(content, relPath, issues, 'nextjs-pages');
        checkGtmEnvUsage(content, relPath, issues);
      }
    }
  }

  // Check for @next/third-parties GTM usage
  const allFiles = [];
  for (const dir of [...appDirs, ...pagesDirs]) {
    if (fs.existsSync(dir)) allFiles.push(...findFiles(dir, /\.(tsx?|jsx?)$/));
  }
  for (const file of allFiles) {
    const content = readFileSafe(file);
    if (content && content.includes('@next/third-parties/google')) {
      gtmFound = true;
    }
  }

  if (!gtmFound) {
    const targetFile = detectNextjsTargetFile();
    issues.push({
      severity: 'high',
      category: 'gtm',
      file: targetFile || 'app/layout.tsx',
      line: 1,
      problem: 'Google Tag Manager is not installed',
      seoImpact: 'Without GTM, tracking and analytics cannot collect data. This impacts marketing measurement, conversion tracking, and data-driven SEO decisions.',
      recommendedFix: 'Install GTM by adding the official script snippet to the root layout or _document file.',
      autoFixPossible: true
    });
  }
}

function scanReactGtm(issues) {
  let gtmFound = false;

  // Check public/index.html
  const indexPaths = [
    path.join(projectRoot, 'public', 'index.html'),
    path.join(projectRoot, 'index.html')
  ];

  for (const indexPath of indexPaths) {
    if (!fs.existsSync(indexPath)) continue;
    const relPath = path.relative(projectRoot, indexPath);
    const content = readFileSafe(indexPath);
    if (!content) continue;

    const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
    const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

    if (hasGtmScript || hasGtmNoscript) {
      gtmFound = true;
      checkGtmPlacement(content, relPath, issues, 'html');
      checkGtmEnvUsage(content, relPath, issues);
    }
  }

  // Check src files for programmatic GTM loading
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const srcFiles = findFiles(srcDir, /\.(tsx?|jsx?)$/);
    for (const file of srcFiles) {
      const content = readFileSafe(file);
      if (content && GTM_SCRIPT_PATTERN.test(content)) {
        gtmFound = true;
        const relPath = path.relative(projectRoot, file);
        checkGtmEnvUsage(content, relPath, issues);
      }
    }
  }

  if (!gtmFound) {
    const targetFile = fs.existsSync(path.join(projectRoot, 'public', 'index.html'))
      ? 'public/index.html'
      : 'index.html';
    issues.push({
      severity: 'high',
      category: 'gtm',
      file: targetFile,
      line: 1,
      problem: 'Google Tag Manager is not installed',
      seoImpact: 'Without GTM, tracking and analytics cannot collect data. This impacts marketing measurement, conversion tracking, and data-driven SEO decisions.',
      recommendedFix: 'Install GTM by adding the official script and noscript snippets to index.html.',
      autoFixPossible: true
    });
  }
}

function scanAngularGtm(issues) {
  let gtmFound = false;

  // Check src/index.html
  const indexPath = path.join(projectRoot, 'src', 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = readFileSafe(indexPath);
    if (content) {
      const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
      const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

      if (hasGtmScript || hasGtmNoscript) {
        gtmFound = true;
        checkGtmPlacement(content, 'src/index.html', issues, 'html');
        checkGtmEnvUsage(content, 'src/index.html', issues);
      }
    }
  }

  // Check TypeScript files for programmatic loading
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) {
    const tsFiles = findFiles(srcDir, /\.ts$/);
    for (const file of tsFiles) {
      const content = readFileSafe(file);
      if (content && GTM_SCRIPT_PATTERN.test(content)) {
        gtmFound = true;
        const relPath = path.relative(projectRoot, file);
        checkGtmEnvUsage(content, relPath, issues);
      }
    }
  }

  if (!gtmFound) {
    issues.push({
      severity: 'high',
      category: 'gtm',
      file: 'src/index.html',
      line: 1,
      problem: 'Google Tag Manager is not installed',
      seoImpact: 'Without GTM, tracking and analytics cannot collect data. This impacts marketing measurement, conversion tracking, and data-driven SEO decisions.',
      recommendedFix: 'Install GTM by adding the official script and noscript snippets to src/index.html.',
      autoFixPossible: true
    });
  }
}

function scanHtmlGtm(issues) {
  const htmlFiles = findFiles(projectRoot, /\.html?$/i);

  if (htmlFiles.length === 0) return;

  let gtmFoundInAny = false;

  for (const file of htmlFiles) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;

    const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
    const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

    if (hasGtmScript || hasGtmNoscript) {
      gtmFoundInAny = true;
      checkGtmPlacement(content, relPath, issues, 'html');
      checkGtmEnvUsage(content, relPath, issues);
    }
  }

  if (!gtmFoundInAny) {
    const targetFile = htmlFiles.length > 0 ? path.relative(projectRoot, htmlFiles[0]) : 'index.html';
    issues.push({
      severity: 'high',
      category: 'gtm',
      file: targetFile,
      line: 1,
      problem: 'Google Tag Manager is not installed',
      seoImpact: 'Without GTM, tracking and analytics cannot collect data. This impacts marketing measurement, conversion tracking, and data-driven SEO decisions.',
      recommendedFix: 'Install GTM by adding the official script and noscript snippets to your HTML files.',
      autoFixPossible: true
    });
  }
}

function checkGtmPlacement(content, file, issues, type) {
  const lines = content.split('\n');
  const hasGtmScript = GTM_SCRIPT_PATTERN.test(content);
  const hasGtmNoscript = GTM_NOSCRIPT_PATTERN.test(content);

  // Check: both script and noscript must be present
  if (hasGtmScript && !hasGtmNoscript) {
    issues.push({
      severity: 'medium',
      category: 'gtm',
      file,
      line: findLineNumber(lines, 'googletagmanager.com/gtm.js'),
      problem: 'GTM script tag found but noscript fallback is missing',
      seoImpact: 'The noscript iframe ensures GTM fires for users with JavaScript disabled. Missing it reduces tracking coverage.',
      recommendedFix: 'Add the GTM noscript iframe immediately after the opening <body> tag.',
      autoFixPossible: true
    });
  }

  if (!hasGtmScript && hasGtmNoscript) {
    issues.push({
      severity: 'high',
      category: 'gtm',
      file,
      line: findLineNumber(lines, 'googletagmanager.com/ns.html'),
      problem: 'GTM noscript iframe found but main script tag is missing',
      seoImpact: 'Without the main GTM script, tags will not fire for JavaScript-enabled users. Analytics and tracking will not work.',
      recommendedFix: 'Add the GTM script tag inside the <head> section.',
      autoFixPossible: true
    });
  }

  // Check script placement (should be in head for HTML, or equivalent for JSX)
  if (hasGtmScript && (type === 'html')) {
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch && !GTM_SCRIPT_PATTERN.test(headMatch[1])) {
      issues.push({
        severity: 'medium',
        category: 'gtm',
        file,
        line: findLineNumber(lines, 'googletagmanager.com/gtm.js'),
        problem: 'GTM script is not placed inside the <head> section',
        seoImpact: 'GTM should load as early as possible in the <head> for optimal data collection. Placing it elsewhere delays tag firing.',
        recommendedFix: 'Move the GTM script tag inside the <head> section, as high as possible.',
        autoFixPossible: false
      });
    }
  }

  // Check noscript placement (should be immediately after <body>)
  if (hasGtmNoscript && (type === 'html')) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]{0,500})/i);
    if (bodyMatch) {
      const afterBody = bodyMatch[1];
      if (!GTM_NOSCRIPT_PATTERN.test(afterBody)) {
        issues.push({
          severity: 'low',
          category: 'gtm',
          file,
          line: findLineNumber(lines, 'googletagmanager.com/ns.html'),
          problem: 'GTM noscript iframe is not placed immediately after the opening <body> tag',
          seoImpact: 'Google recommends placing the noscript fallback immediately after <body> for reliable fallback tracking.',
          recommendedFix: 'Move the GTM noscript iframe to immediately after the opening <body> tag.',
          autoFixPossible: false
        });
      }
    }
  }

  // Check for mismatched GTM IDs
  const scriptIds = content.match(/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/g) || [];
  const noscriptIds = content.match(/googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/g) || [];
  const allIds = new Set();
  for (const m of scriptIds) {
    const id = m.match(/GTM-[A-Z0-9]+/);
    if (id) allIds.add(id[0]);
  }
  for (const m of noscriptIds) {
    const id = m.match(/GTM-[A-Z0-9]+/);
    if (id) allIds.add(id[0]);
  }
  if (allIds.size > 1) {
    issues.push({
      severity: 'high',
      category: 'gtm',
      file,
      line: findLineNumber(lines, 'googletagmanager.com'),
      problem: `Mismatched GTM IDs found: ${[...allIds].join(', ')}`,
      seoImpact: 'Different GTM container IDs in the script and noscript tags will cause inconsistent tracking and split analytics data.',
      recommendedFix: 'Use the same GTM container ID in both the script and noscript tags.',
      autoFixPossible: false
    });
  }
}

function checkGtmEnvUsage(content, file, issues) {
  const lines = content.split('\n');

  // Check if a hardcoded GTM ID is used instead of an environment variable
  if (HARDCODED_GTM_ID.test(content)) {
    // Check if env vars are also referenced
    const usesEnvVar = ENV_VAR_NAMES.some(name => content.includes(name)) ||
                       /process\.env\./.test(content) ||
                       /import\.meta\.env\./.test(content);

    if (!usesEnvVar) {
      const match = content.match(HARDCODED_GTM_ID);
      issues.push({
        severity: 'low',
        category: 'gtm',
        file,
        line: findLineNumber(lines, match ? match[0] : 'GTM-'),
        problem: 'GTM container ID is hardcoded instead of using an environment variable',
        seoImpact: 'Hardcoded IDs make it difficult to manage different GTM containers across environments (dev, staging, production).',
        recommendedFix: 'Use an environment variable (e.g., NEXT_PUBLIC_GTM_ID, VITE_GTM_ID, REACT_APP_GTM_ID) for the GTM container ID.',
        autoFixPossible: false
      });
    }
  }
}

function detectNextjsTargetFile() {
  // App Router
  const appLayouts = [
    path.join(projectRoot, 'app', 'layout.tsx'),
    path.join(projectRoot, 'app', 'layout.jsx'),
    path.join(projectRoot, 'src', 'app', 'layout.tsx'),
    path.join(projectRoot, 'src', 'app', 'layout.jsx')
  ];
  for (const f of appLayouts) {
    if (fs.existsSync(f)) return path.relative(projectRoot, f);
  }

  // Pages Router
  const pagesDocs = [
    path.join(projectRoot, 'pages', '_document.tsx'),
    path.join(projectRoot, 'pages', '_document.jsx'),
    path.join(projectRoot, 'src', 'pages', '_document.tsx'),
    path.join(projectRoot, 'src', 'pages', '_document.jsx')
  ];
  for (const f of pagesDocs) {
    if (fs.existsSync(f)) return path.relative(projectRoot, f);
  }

  return null;
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
function findLineNumber(lines, search) { const i = (typeof lines === 'string' ? lines.split('\n') : lines).findIndex(l => l.includes(search)); return i >= 0 ? i + 1 : 1; }

try {
  console.log(JSON.stringify(scanGtm(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
