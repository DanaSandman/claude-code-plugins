#!/usr/bin/env node
/**
 * runtime-audit.js
 * Runs runtime accessibility audit using available tooling.
 * Tries in order: Playwright + axe-core, Lighthouse CLI.
 * Gracefully degrades if no tooling is installed.
 * Usage: node runtime-audit.js [url] [project-root]
 * Output: JSON { success, tool, results?, instructions? }
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const url = process.argv[2] || 'http://localhost:3000';
const projectRoot = process.argv[3] || process.cwd();

function runRuntimeAudit() {
  // Check available tools
  const hasPlaywright = checkModule('playwright');
  const hasAxeCore = checkModule('axe-core') || checkModule('@axe-core/playwright');
  const hasLighthouse = checkCommand('lighthouse');

  if (hasPlaywright && hasAxeCore) {
    return runAxePlaywright(url);
  }

  if (hasPlaywright) {
    return runAxePlaywright(url); // axe-core bundled approach
  }

  if (hasLighthouse) {
    return runLighthouse(url);
  }

  // No tooling available — provide instructions
  return {
    success: false,
    tool: 'none',
    instructions: {
      message: 'No runtime audit tools found. Install one of the following to enable runtime accessibility audits:',
      options: [
        {
          name: 'Playwright + axe-core (recommended)',
          install: 'npm install -D playwright @axe-core/playwright',
          description: 'Full browser automation with comprehensive axe-core accessibility testing.'
        },
        {
          name: 'Lighthouse CLI',
          install: 'npm install -g lighthouse',
          description: 'Google Lighthouse accessibility audit via Chrome DevTools Protocol.'
        }
      ],
      note: 'Static code analysis (a11y-audit) works without any runtime tooling and catches most issues.'
    }
  };
}

function runAxePlaywright(targetUrl) {
  // Generate a temporary test script
  const testScript = `
const { chromium } = require('playwright');

(async () => {
  let AxeBuilder;
  try {
    AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
  } catch {
    // Fallback: inject axe-core directly
    const axeSource = require('axe-core').source;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('${targetUrl}', { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(axeSource);
    const results = await page.evaluate(() => window.axe.run());
    await browser.close();
    console.log(JSON.stringify(results));
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('${targetUrl}', { waitUntil: 'networkidle', timeout: 30000 });
  const results = await new AxeBuilder({ page }).analyze();
  await browser.close();
  console.log(JSON.stringify(results));
})();
`;

  const tmpScript = path.join(projectRoot, '.a11y-runtime-test.js');
  try {
    fs.writeFileSync(tmpScript, testScript);
    const output = execSync(`node "${tmpScript}"`, {
      encoding: 'utf8',
      timeout: 60000,
      cwd: projectRoot
    });

    const axeResults = JSON.parse(output.trim());
    const report = transformAxeResults(axeResults);

    // Write runtime report
    const jsonPath = path.join(projectRoot, 'a11y-runtime-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    const mdPath = path.join(projectRoot, 'a11y-runtime-report.md');
    fs.writeFileSync(mdPath, generateRuntimeMarkdown(report));

    return {
      success: true,
      tool: 'playwright-axe',
      url: targetUrl,
      jsonReport: jsonPath,
      mdReport: mdPath,
      summary: {
        violations: report.violations.length,
        passes: report.passes,
        incomplete: report.incomplete
      }
    };
  } catch (err) {
    return { success: false, tool: 'playwright-axe', reason: err.message };
  } finally {
    try { fs.unlinkSync(tmpScript); } catch {}
  }
}

function runLighthouse(targetUrl) {
  try {
    const output = execSync(
      `lighthouse "${targetUrl}" --only-categories=accessibility --output=json --chrome-flags="--headless --no-sandbox"`,
      { encoding: 'utf8', timeout: 120000, cwd: projectRoot }
    );

    const lhResult = JSON.parse(output);
    const a11yCategory = lhResult.categories && lhResult.categories.accessibility;
    const audits = lhResult.audits || {};

    const violations = [];
    for (const [id, audit] of Object.entries(audits)) {
      if (audit.score !== null && audit.score < 1 && audit.details && audit.details.items) {
        violations.push({
          id,
          description: audit.description,
          impact: audit.title,
          nodes: audit.details.items.length
        });
      }
    }

    const report = {
      tool: 'lighthouse',
      url: targetUrl,
      score: a11yCategory ? Math.round(a11yCategory.score * 100) : null,
      violations,
      generatedAt: new Date().toISOString()
    };

    const jsonPath = path.join(projectRoot, 'a11y-runtime-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    const mdPath = path.join(projectRoot, 'a11y-runtime-report.md');
    fs.writeFileSync(mdPath, generateLighthouseMarkdown(report));

    return {
      success: true,
      tool: 'lighthouse',
      url: targetUrl,
      jsonReport: jsonPath,
      mdReport: mdPath,
      summary: { score: report.score, violations: violations.length }
    };
  } catch (err) {
    return { success: false, tool: 'lighthouse', reason: err.message };
  }
}

function transformAxeResults(axeResults) {
  const violations = (axeResults.violations || []).map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map(n => ({
      html: n.html,
      target: n.target,
      failureSummary: n.failureSummary
    }))
  }));

  return {
    tool: 'axe-core',
    url: axeResults.url,
    violations,
    passes: (axeResults.passes || []).length,
    incomplete: (axeResults.incomplete || []).length,
    generatedAt: new Date().toISOString()
  };
}

function generateRuntimeMarkdown(report) {
  const lines = [];
  lines.push('# Accessibility Runtime Audit Report');
  lines.push('');
  lines.push(`**Tool:** ${report.tool}`);
  lines.push(`**URL:** ${report.url}`);
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Violations | ${report.violations.length} |`);
  lines.push(`| Passes | ${report.passes} |`);
  lines.push(`| Incomplete | ${report.incomplete} |`);
  lines.push('');

  if (report.violations.length > 0) {
    lines.push('## Violations');
    lines.push('');
    for (const v of report.violations) {
      lines.push(`### ${v.id} [${(v.impact || 'unknown').toUpperCase()}]`);
      lines.push('');
      lines.push(`- **Description:** ${v.description}`);
      lines.push(`- **Help:** ${v.help}`);
      if (v.helpUrl) lines.push(`- **Reference:** ${v.helpUrl}`);
      lines.push(`- **Affected nodes:** ${v.nodes.length}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by accessibility-plugin*');
  return lines.join('\n');
}

function generateLighthouseMarkdown(report) {
  const lines = [];
  lines.push('# Accessibility Runtime Audit Report (Lighthouse)');
  lines.push('');
  lines.push(`**URL:** ${report.url}`);
  lines.push(`**Score:** ${report.score}/100`);
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push('');

  if (report.violations.length > 0) {
    lines.push('## Failing Audits');
    lines.push('');
    for (const v of report.violations) {
      lines.push(`### ${v.id}`);
      lines.push(`- **Issue:** ${v.impact}`);
      lines.push(`- **Description:** ${v.description}`);
      lines.push(`- **Affected elements:** ${v.nodes}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by accessibility-plugin*');
  return lines.join('\n');
}

function checkModule(moduleName) {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    return !!deps[moduleName];
  } catch {
    return false;
  }
}

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

try {
  const result = runRuntimeAudit();
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
