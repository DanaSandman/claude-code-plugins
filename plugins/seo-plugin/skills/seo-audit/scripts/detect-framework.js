#!/usr/bin/env node
/**
 * detect-framework.js
 * Detects the frontend framework used in a project.
 * Usage: node detect-framework.js [project-root]
 * Output: JSON { framework, version, evidence[] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();

function detectFramework() {
  const result = {
    framework: 'html',
    version: null,
    evidence: []
  };

  // Try reading package.json
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkg = null;

  try {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    pkg = JSON.parse(raw);
  } catch {
    // No package.json — check for HTML files
    result.evidence.push('No package.json found');
    const htmlFiles = findFiles(projectRoot, /\.html?$/i, 3);
    if (htmlFiles.length > 0) {
      result.evidence.push(`Found ${htmlFiles.length} HTML file(s)`);
    }
    return result;
  }

  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

  // Check Next.js
  if (deps['next']) {
    result.framework = 'nextjs';
    result.version = deps['next'].replace(/[\^~>=<]/g, '');
    result.evidence.push(`"next" found in dependencies: ${deps['next']}`);

    // Detect App Router vs Pages Router
    const hasAppDir = fs.existsSync(path.join(projectRoot, 'app')) ||
                      fs.existsSync(path.join(projectRoot, 'src', 'app'));
    const hasPagesDir = fs.existsSync(path.join(projectRoot, 'pages')) ||
                        fs.existsSync(path.join(projectRoot, 'src', 'pages'));

    if (hasAppDir) result.evidence.push('App Router detected (app/ directory)');
    if (hasPagesDir) result.evidence.push('Pages Router detected (pages/ directory)');

    return result;
  }

  // Check Angular
  if (deps['@angular/core']) {
    result.framework = 'angular';
    result.version = deps['@angular/core'].replace(/[\^~>=<]/g, '');
    result.evidence.push(`"@angular/core" found in dependencies: ${deps['@angular/core']}`);

    if (deps['@angular/platform-server'] || deps['@nguniversal/express-engine']) {
      result.evidence.push('Angular Universal (SSR) detected');
    }

    return result;
  }

  // Check React (without Next.js)
  if (deps['react']) {
    result.framework = 'react';
    result.version = deps['react'].replace(/[\^~>=<]/g, '');
    result.evidence.push(`"react" found in dependencies: ${deps['react']}`);

    if (deps['react-helmet'] || deps['react-helmet-async']) {
      result.evidence.push('React Helmet detected for metadata management');
    }
    if (deps['gatsby']) {
      result.evidence.push('Gatsby detected (SSG framework)');
    }
    if (deps['react-snap'] || deps['react-snapshot']) {
      result.evidence.push('Pre-rendering library detected');
    }

    return result;
  }

  // Fallback: Static HTML
  result.evidence.push('No known framework detected in package.json');
  const htmlFiles = findFiles(projectRoot, /\.html?$/i, 3);
  if (htmlFiles.length > 0) {
    result.evidence.push(`Found ${htmlFiles.length} HTML file(s)`);
  }

  return result;
}

function findFiles(dir, pattern, maxDepth, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, maxDepth, currentDepth + 1));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Permission error or other issue
  }
  return results;
}

try {
  const result = detectFramework();
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
