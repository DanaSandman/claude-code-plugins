#!/usr/bin/env node
/**
 * apply-fix.js
 * Main fix orchestrator. Reads seo-report.json and applies fixes.
 * Usage: node apply-fix.js [project-root] [filter] [--dry-run]
 * Filter: issue ID (e.g., SEO-001), category name, or "all"
 * Output: JSON with fixed/skipped issues + generates fix-report.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.argv[2] || process.cwd();
const filter = process.argv[3] || 'all';
const dryRun = process.argv.includes('--dry-run');

const scriptsDir = __dirname;

function applyFixes() {
  // Load report
  const reportPath = path.join(projectRoot, 'seo-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error(JSON.stringify({ error: 'seo-report.json not found. Run seo-audit first.' }));
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const allIssues = report.issues || [];

  // Filter issues
  let targetIssues;
  if (filter.toLowerCase() === 'all') {
    targetIssues = allIssues;
  } else if (filter.match(/^SEO-\d+$/i)) {
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
      recommendations: []
    }, null, 2));
    return;
  }

  const fixed = [];
  const skipped = [];
  const recommendations = [];

  for (const issue of targetIssues) {
    // Rendering fixes are never auto-applied
    if (issue.category === 'rendering') {
      recommendations.push({
        id: issue.id,
        file: issue.file,
        problem: issue.problem,
        recommendation: issue.recommendedFix,
        reason: 'Rendering fixes require manual review and cannot be safely auto-applied.'
      });
      continue;
    }

    if (!issue.autoFixPossible) {
      skipped.push({
        id: issue.id,
        file: issue.file,
        problem: issue.problem,
        reason: 'Auto-fix not available for this issue.'
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

    // Apply category-specific fix
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

  // Generate fix report
  if (!dryRun) {
    generateFixReport(fixed, skipped, recommendations);
  }

  console.log(JSON.stringify({
    success: true,
    dryRun,
    filter,
    totalTargeted: targetIssues.length,
    fixed,
    skipped,
    recommendations
  }, null, 2));
}

function applyCategoryFix(issue) {
  const scriptMap = {
    'title': 'apply-meta-fix.js',
    'meta-description': 'apply-meta-fix.js',
    'headings': 'apply-heading-fix.js',
    'semantic-html': 'apply-semantic-fix.js',
    'images': 'apply-image-fix.js',
    'internal-links': 'apply-link-fix.js'
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

function generateFixReport(fixed, skipped, recommendations) {
  const lines = [];

  lines.push('# SEO Fix Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Filter:** ${filter}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Status | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Fixed | ${fixed.length} |`);
  lines.push(`| Skipped | ${skipped.length} |`);
  lines.push(`| Manual Review | ${recommendations.length} |`);
  lines.push('');

  // Fixed issues
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

  // Skipped issues
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

  // Recommendations
  lines.push('## Manual Review Required');
  lines.push('');
  if (recommendations.length === 0) {
    lines.push('No issues require manual review.');
  } else {
    for (const r of recommendations) {
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
  lines.push('*Generated by universal-frontend-seo-plugin*');

  const reportPath = path.join(projectRoot, 'fix-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'));
}

try {
  applyFixes();
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
