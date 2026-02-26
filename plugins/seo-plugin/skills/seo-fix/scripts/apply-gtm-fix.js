#!/usr/bin/env node
/**
 * apply-gtm-fix.js
 * Fixes Google Tag Manager integration issues.
 * Usage: node apply-gtm-fix.js '<issue-json>' [project-root]
 * Output: JSON { success: boolean, action?: string, reason?: string }
 */

const fs = require('fs');
const path = require('path');

const issue = JSON.parse(process.argv[2]);
const projectRoot = process.argv[3] || process.cwd();

function applyGtmFix() {
  const problem = issue.problem || '';

  if (problem.includes('not installed')) {
    return installGtm();
  }

  if (problem.includes('noscript fallback is missing')) {
    return addNoscriptFallback();
  }

  if (problem.includes('main script tag is missing')) {
    return addScriptTag();
  }

  return { success: false, reason: 'Cannot auto-fix this GTM issue. Manual review required.' };
}

function installGtm() {
  const gtmId = detectGtmEnvVar();

  // Detect framework from file path and project structure
  const filePath = path.join(projectRoot, issue.file);
  const ext = path.extname(issue.file);

  // Next.js App Router layout
  if (issue.file.includes('layout.') && (ext === '.tsx' || ext === '.jsx' || ext === '.ts' || ext === '.js')) {
    return installNextjsAppRouter(filePath, gtmId);
  }

  // Next.js Pages Router _document
  if (issue.file.includes('_document.')) {
    return installNextjsPagesRouter(filePath, gtmId);
  }

  // HTML files (React, Angular, Vite, static)
  if (ext === '.html' || ext === '.htm') {
    return installHtml(filePath, gtmId);
  }

  return { success: false, reason: `Cannot determine how to install GTM in ${issue.file}` };
}

function installNextjsAppRouter(filePath, gtmId) {
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check idempotency
  if (/googletagmanager\.com\/gtm\.js/.test(content)) {
    return { success: false, reason: 'GTM is already installed in this file.' };
  }

  // Add Script import if not present
  if (!content.includes("from 'next/script'") && !content.includes('from "next/script"')) {
    // Find the last import line
    const importLines = content.match(/^import\s+.+$/gm);
    if (importLines && importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + "\nimport Script from 'next/script'");
    } else {
      content = "import Script from 'next/script'\n" + content;
    }
  }

  const gtmRef = gtmId.startsWith('process.env.') ? '${' + gtmId + '}' : gtmId;

  // GTM Script component
  const gtmScript = `\n        <Script\n          id="gtm-script"\n          strategy="afterInteractive"\n          dangerouslySetInnerHTML={{\n            __html: \`\n              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n              })(window,document,'script','dataLayer','${gtmRef}');\n            \`,\n          }}\n        />`;

  // GTM Noscript iframe
  const gtmNoscript = `\n        <noscript>\n          <iframe\n            src={\`https://www.googletagmanager.com/ns.html?id=${gtmRef}\`}\n            height="0"\n            width="0"\n            style={{ display: 'none', visibility: 'hidden' }}\n          />\n        </noscript>`;

  // Insert script after <head> or inside <head> section
  const headMatch = content.match(/<head[^>]*>/);
  if (headMatch) {
    const insertPos = headMatch.index + headMatch[0].length;
    content = content.slice(0, insertPos) + gtmScript + content.slice(insertPos);
  } else {
    // Try to insert before </head> or after opening <html>
    const bodyMatch = content.match(/<body[^>]*>/);
    if (bodyMatch) {
      content = content.slice(0, bodyMatch.index) + gtmScript + '\n' + content.slice(bodyMatch.index);
    }
  }

  // Insert noscript after <body>
  const bodyMatch = content.match(/<body[^>]*>/);
  if (bodyMatch) {
    const insertPos = bodyMatch.index + bodyMatch[0].length;
    content = content.slice(0, insertPos) + gtmNoscript + content.slice(insertPos);
  }

  // Write backup and new content
  fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, content);

  ensureEnvExample(gtmId);

  return { success: true, action: `Installed GTM in ${issue.file} using Next.js Script component with strategy="afterInteractive". Please verify your GTM container ID.` };
}

function installNextjsPagesRouter(filePath, gtmId) {
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check idempotency
  if (/googletagmanager\.com\/gtm\.js/.test(content)) {
    return { success: false, reason: 'GTM is already installed in this file.' };
  }

  const gtmRef = gtmId.startsWith('process.env.') ? '${' + gtmId + '}' : gtmId;

  // Add GTM script inside <Head>
  const gtmHeadScript = `\n            <script\n              dangerouslySetInnerHTML={{\n                __html: \`\n                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n                  })(window,document,'script','dataLayer','${gtmRef}');\n                \`,\n              }}\n            />`;

  // Add GTM noscript after <body>
  const gtmNoscript = `\n            <noscript>\n              <iframe\n                src={\`https://www.googletagmanager.com/ns.html?id=${gtmRef}\`}\n                height="0"\n                width="0"\n                style={{ display: 'none', visibility: 'hidden' }}\n              />\n            </noscript>`;

  // Insert script inside <Head>
  const headCloseMatch = content.match(/<\/Head>/);
  if (headCloseMatch) {
    const insertPos = headCloseMatch.index;
    content = content.slice(0, insertPos) + gtmHeadScript + '\n          ' + content.slice(insertPos);
  }

  // Insert noscript after <body> (in _document, look for <body> in Main)
  const bodyMatch = content.match(/<body[^>]*>/);
  if (bodyMatch) {
    const insertPos = bodyMatch.index + bodyMatch[0].length;
    content = content.slice(0, insertPos) + gtmNoscript + content.slice(insertPos);
  }

  // Write backup and new content
  fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, content);

  ensureEnvExample(gtmId);

  return { success: true, action: `Installed GTM in ${issue.file} (Pages Router _document). Please verify your GTM container ID.` };
}

function installHtml(filePath, gtmId) {
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check idempotency
  if (/googletagmanager\.com\/gtm\.js/.test(content)) {
    return { success: false, reason: 'GTM is already installed in this file.' };
  }

  // Use raw ID for HTML (env vars don't work in static HTML)
  const gtmIdValue = gtmId.startsWith('process.env.') ? 'GTM-XXXXXXX' : gtmId;

  const gtmScript = `\n  <!-- Google Tag Manager -->\n  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n  })(window,document,'script','dataLayer','${gtmIdValue}');</script>\n  <!-- End Google Tag Manager -->`;

  const gtmNoscript = `\n  <!-- Google Tag Manager (noscript) -->\n  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmIdValue}"\n  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n  <!-- End Google Tag Manager (noscript) -->`;

  // Insert script in <head>
  const headMatch = content.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertPos = headMatch.index + headMatch[0].length;
    content = content.slice(0, insertPos) + gtmScript + content.slice(insertPos);
  } else {
    return { success: false, reason: 'No <head> tag found in HTML file.' };
  }

  // Insert noscript after <body>
  const bodyMatch = content.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const insertPos = bodyMatch.index + bodyMatch[0].length;
    content = content.slice(0, insertPos) + gtmNoscript + content.slice(insertPos);
  } else {
    return { success: false, reason: 'No <body> tag found in HTML file.' };
  }

  // Write backup and new content
  fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, content);

  ensureEnvExample(gtmId);

  return { success: true, action: `Installed GTM in ${issue.file}. Please replace GTM-XXXXXXX with your actual GTM container ID.` };
}

function addNoscriptFallback() {
  const filePath = path.join(projectRoot, issue.file);
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check idempotency
  if (/googletagmanager\.com\/ns\.html/.test(content)) {
    return { success: false, reason: 'GTM noscript is already present in this file.' };
  }

  // Extract GTM ID from existing script tag
  const idMatch = content.match(/googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/);
  const envMatch = content.match(/googletagmanager\.com\/gtm\.js\?id=\$\{([^}]+)\}/);
  let gtmIdValue;

  if (envMatch) {
    gtmIdValue = '${' + envMatch[1] + '}';
  } else if (idMatch) {
    gtmIdValue = idMatch[1];
  } else {
    gtmIdValue = 'GTM-XXXXXXX';
  }

  const ext = path.extname(issue.file);

  if (ext === '.html' || ext === '.htm') {
    const noscript = `\n  <!-- Google Tag Manager (noscript) -->\n  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmIdValue}"\n  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n  <!-- End Google Tag Manager (noscript) -->`;

    const bodyMatch = content.match(/<body[^>]*>/i);
    if (bodyMatch) {
      const insertPos = bodyMatch.index + bodyMatch[0].length;
      content = content.slice(0, insertPos) + noscript + content.slice(insertPos);

      fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
      fs.writeFileSync(filePath, content);
      return { success: true, action: `Added GTM noscript iframe after <body> in ${issue.file}.` };
    }
    return { success: false, reason: 'No <body> tag found.' };
  }

  // JSX/TSX files
  if (ext === '.tsx' || ext === '.jsx' || ext === '.ts' || ext === '.js') {
    const noscript = `\n        <noscript>\n          <iframe\n            src={\`https://www.googletagmanager.com/ns.html?id=${gtmIdValue}\`}\n            height="0"\n            width="0"\n            style={{ display: 'none', visibility: 'hidden' }}\n          />\n        </noscript>`;

    const bodyMatch = content.match(/<body[^>]*>/);
    if (bodyMatch) {
      const insertPos = bodyMatch.index + bodyMatch[0].length;
      content = content.slice(0, insertPos) + noscript + content.slice(insertPos);

      fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
      fs.writeFileSync(filePath, content);
      return { success: true, action: `Added GTM noscript iframe after <body> in ${issue.file}.` };
    }
    return { success: false, reason: 'No <body> tag found in JSX file.' };
  }

  return { success: false, reason: `Cannot add noscript to ${ext} files.` };
}

function addScriptTag() {
  const filePath = path.join(projectRoot, issue.file);
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: `File not found: ${issue.file}` };
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check idempotency
  if (/googletagmanager\.com\/gtm\.js/.test(content)) {
    return { success: false, reason: 'GTM script is already present in this file.' };
  }

  // Extract GTM ID from existing noscript tag
  const idMatch = content.match(/googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/);
  const envMatch = content.match(/googletagmanager\.com\/ns\.html\?id=\$\{([^}]+)\}/);
  let gtmIdValue;

  if (envMatch) {
    gtmIdValue = '${' + envMatch[1] + '}';
  } else if (idMatch) {
    gtmIdValue = idMatch[1];
  } else {
    gtmIdValue = 'GTM-XXXXXXX';
  }

  const ext = path.extname(issue.file);

  if (ext === '.html' || ext === '.htm') {
    const script = `\n  <!-- Google Tag Manager -->\n  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\n  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\n  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n  })(window,document,'script','dataLayer','${gtmIdValue}');</script>\n  <!-- End Google Tag Manager -->`;

    const headMatch = content.match(/<head[^>]*>/i);
    if (headMatch) {
      const insertPos = headMatch.index + headMatch[0].length;
      content = content.slice(0, insertPos) + script + content.slice(insertPos);

      fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
      fs.writeFileSync(filePath, content);
      return { success: true, action: `Added GTM script to <head> in ${issue.file}.` };
    }
    return { success: false, reason: 'No <head> tag found.' };
  }

  return { success: false, reason: `Cannot add script tag to ${ext} files automatically. Use the full GTM installation fix instead.` };
}

function detectGtmEnvVar() {
  // Check .env files for existing GTM ID
  const envFiles = ['.env', '.env.local', '.env.production', '.env.example'];
  for (const envFile of envFiles) {
    const envPath = path.join(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      const content = readFileSafe(envPath);
      if (content) {
        for (const varName of ENV_VAR_NAMES) {
          const match = content.match(new RegExp(`^${varName}=(.+)$`, 'm'));
          if (match && match[1].trim()) {
            return `process.env.${varName}`;
          }
        }
      }
    }
  }

  // Determine preferred env var name based on framework
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

      if (deps['next']) return 'process.env.NEXT_PUBLIC_GTM_ID';
      if (deps['vite'] || deps['@vitejs/plugin-react']) return 'import.meta.env.VITE_GTM_ID';
      if (deps['react-scripts']) return 'process.env.REACT_APP_GTM_ID';
      if (deps['gatsby']) return 'process.env.GATSBY_GTM_ID';
    } catch {}
  }

  // Fallback: use a placeholder
  return 'GTM-XXXXXXX';
}

function ensureEnvExample(gtmId) {
  // Only create/update .env.example if we used an env var
  if (!gtmId.startsWith('process.env.') && !gtmId.startsWith('import.meta.env.')) return;

  const varName = gtmId.replace('process.env.', '').replace('import.meta.env.', '');
  const envExamplePath = path.join(projectRoot, '.env.example');

  let content = '';
  if (fs.existsSync(envExamplePath)) {
    content = readFileSafe(envExamplePath) || '';
    if (content.includes(varName)) return; // Already present
  }

  const entry = `\n# Google Tag Manager Container ID\n# TODO: Replace with your actual GTM container ID\n${varName}=GTM-XXXXXXX\n`;
  content += entry;

  fs.writeFileSync(envExamplePath, content);
}

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

try {
  const result = applyGtmFix();
  console.log(JSON.stringify(result));
} catch (err) {
  console.log(JSON.stringify({ success: false, reason: err.message }));
}
