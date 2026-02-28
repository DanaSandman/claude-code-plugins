#!/usr/bin/env node
/**
 * apply-fix.js
 * Main fix orchestrator. Reads a11y-report.json and applies fixes.
 * Usage: node apply-fix.js [project-root] [filter] [--dry-run]
 * Filter: issue ID (e.g., A11Y-001), category name, or "all"
 * Output: JSON with fixed/skipped issues + generates a11y-fix-report.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.argv[2] || process.cwd();
const filter = process.argv[3] || 'all';
const dryRun = process.argv.includes('--dry-run');

const scriptsDir = __dirname;

function applyFixes() {
  const reportPath = path.join(projectRoot, 'a11y-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error(JSON.stringify({ error: 'a11y-report.json not found. Run a11y-audit first.' }));
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const allIssues = report.issues || [];

  let targetIssues;
  if (filter.toLowerCase() === 'all') {
    targetIssues = allIssues;
  } else if (filter.match(/^A11Y-\d+$/i)) {
    targetIssues = allIssues.filter(i => i.id.toUpperCase() === filter.toUpperCase());
  } else {
    targetIssues = allIssues.filter(i => i.category === filter.toLowerCase());
  }

  if (targetIssues.length === 0) {
    console.log(JSON.stringify({
      success: true,
      dryRun,
      message: `No issues found matching filter: ${filter}`,
      fixed: [],
      skipped: [],
      manualReview: []
    }, null, 2));
    return;
  }

  const fixed = [];
  const skipped = [];
  const manualReview = [];

  for (const issue of targetIssues) {
    if (!issue.autoFixPossible) {
      manualReview.push({
        id: issue.id,
        file: issue.file,
        problem: issue.problem,
        recommendation: issue.recommendedFix,
        reason: 'Auto-fix not available — manual review required.'
      });
      continue;
    }

    if (dryRun) {
      fixed.push({
        id: issue.id,
        file: issue.file,
        problem: issue.problem,
        action: `Would apply fix: ${issue.recommendedFix}`,
        dryRun: true
      });
      continue;
    }

    try {
      const result = applyCategoryFix(issue);
      if (result.success) {
        fixed.push({
          id: issue.id,
          file: issue.file,
          problem: issue.problem,
          action: result.action
        });
      } else {
        skipped.push({
          id: issue.id,
          file: issue.file,
          problem: issue.problem,
          reason: result.reason
        });
      }
    } catch (err) {
      skipped.push({
        id: issue.id,
        file: issue.file,
        problem: issue.problem,
        reason: `Fix failed: ${err.message}`
      });
    }
  }

  if (!dryRun) {
    generateFixReport(fixed, skipped, manualReview);
  }

  console.log(JSON.stringify({
    success: true,
    dryRun,
    filter,
    totalTargeted: targetIssues.length,
    fixed,
    skipped,
    manualReview
  }, null, 2));
}

function applyCategoryFix(issue) {
  const scriptMap = {
    'semantics': 'apply-semantics-fix.js',
    'accessible-names': 'apply-names-fix.js',
    'images': 'apply-images-fix.js',
    'forms': 'apply-forms-fix.js',
    'aria': 'apply-aria-fix.js',
    'keyboard': 'apply-keyboard-fix.js',
    'patterns': 'apply-patterns-fix.js'
  };

  const script = scriptMap[issue.category];
  if (!script) {
    return { success: false, reason: `No fix script for category: ${issue.category}` };
  }

  const scriptPath = path.join(scriptsDir, script);
  const issueJson = JSON.stringify(issue).replace(/'/g, "'\\''");

  try {
    const output = execSync(
      `node "${scriptPath}" '${issueJson}' "${projectRoot}"`,
      { encoding: 'utf8', timeout: 30000 }
    );
    return JSON.parse(output.trim());
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

function generateFixReport(fixed, skipped, manualReview) {
  const lines = [];

  lines.push('# Accessibility Fix Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Filter:** ${filter}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Status | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Fixed | ${fixed.length} |`);
  lines.push(`| Skipped | ${skipped.length} |`);
  lines.push(`| Manual Review | ${manualReview.length} |`);
  lines.push('');

  lines.push('## Fixed Issues');
  lines.push('');
  if (fixed.length === 0) {
    lines.push('No issues were fixed.');
  } else {
    for (const f of fixed) {
      lines.push(`### ${f.id}`);
      lines.push(`- **File:** \`${f.file}\``);
      lines.push(`- **Problem:** ${f.problem}`);
      lines.push(`- **Action:** ${f.action}`);
      lines.push('');
    }
  }
  lines.push('');

  lines.push('## Skipped Issues');
  lines.push('');
  if (skipped.length === 0) {
    lines.push('No issues were skipped.');
  } else {
    for (const s of skipped) {
      lines.push(`### ${s.id}`);
      lines.push(`- **File:** \`${s.file}\``);
      lines.push(`- **Problem:** ${s.problem}`);
      lines.push(`- **Reason:** ${s.reason}`);
      lines.push('');
    }
  }
  lines.push('');

  lines.push('## Manual Review Required');
  lines.push('');
  if (manualReview.length === 0) {
    lines.push('No issues require manual review.');
  } else {
    for (const r of manualReview) {
      lines.push(`### ${r.id}`);
      lines.push(`- **File:** \`${r.file}\``);
      lines.push(`- **Problem:** ${r.problem}`);
      lines.push(`- **Recommendation:** ${r.recommendation}`);
      lines.push(`- **Reason:** ${r.reason}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by accessibility-plugin*');

  const reportPath = path.join(projectRoot, 'a11y-fix-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
}

try {
  applyFixes();
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
