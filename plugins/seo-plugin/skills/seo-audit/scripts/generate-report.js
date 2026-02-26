#!/usr/bin/env node
/**
 * generate-report.js
 * Combines all scan results into seo-report.json and seo-report.md
 * Usage: node generate-report.js [project-root] [scan-results-file] [framework]
 * Input: JSON file with array of issues
 * Output: seo-report.json and seo-report.md in project root
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const scanResultsFile = process.argv[3];
const framework = process.argv[4] || 'html';

const CATEGORIES = [
  'rendering',
  'title',
  'meta-description',
  'headings',
  'semantic-html',
  'url-structure',
  'images',
  'internal-links',
  'gtm'
];

const CATEGORY_LABELS = {
  'rendering': 'Rendering',
  'title': 'Title',
  'meta-description': 'Meta Description',
  'headings': 'Headings',
  'semantic-html': 'Semantic HTML',
  'url-structure': 'URL Structure',
  'images': 'Images',
  'internal-links': 'Internal Links',
  'gtm': 'Google Tag Manager'
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function generateReport() {
  // Read scan results
  let allIssues = [];

  if (scanResultsFile) {
    try {
      const raw = fs.readFileSync(scanResultsFile, 'utf8');
      allIssues = JSON.parse(raw);
    } catch (err) {
      console.error(`Error reading scan results: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Read from stdin
    const chunks = [];
    const fd = fs.openSync('/dev/stdin', 'r');
    const buf = Buffer.alloc(65536);
    let bytesRead;
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length)) > 0) {
      chunks.push(buf.slice(0, bytesRead).toString());
    }
    fs.closeSync(fd);
    allIssues = JSON.parse(chunks.join(''));
  }

  // Ensure all issues have framework set
  allIssues = allIssues.map(issue => ({
    ...issue,
    framework: issue.framework || framework
  }));

  // Assign sequential IDs
  allIssues.sort((a, b) => {
    const catA = CATEGORIES.indexOf(a.category);
    const catB = CATEGORIES.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3);
  });

  allIssues = allIssues.map((issue, i) => ({
    id: `SEO-${String(i + 1).padStart(3, '0')}`,
    ...issue
  }));

  // Build report object
  const report = {
    generatedAt: new Date().toISOString(),
    projectRoot,
    framework,
    summary: {
      totalIssues: allIssues.length,
      bySeverity: {
        critical: allIssues.filter(i => i.severity === 'critical').length,
        high: allIssues.filter(i => i.severity === 'high').length,
        medium: allIssues.filter(i => i.severity === 'medium').length,
        low: allIssues.filter(i => i.severity === 'low').length
      },
      byCategory: {},
      autoFixable: allIssues.filter(i => i.autoFixPossible).length
    },
    issues: allIssues
  };

  for (const cat of CATEGORIES) {
    report.summary.byCategory[cat] = allIssues.filter(i => i.category === cat).length;
  }

  // Write JSON report
  const jsonPath = path.join(projectRoot, 'seo-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Generate Markdown report
  const md = generateMarkdown(report);
  const mdPath = path.join(projectRoot, 'seo-report.md');
  fs.writeFileSync(mdPath, md);

  // Output summary
  console.log(JSON.stringify({
    success: true,
    jsonReport: jsonPath,
    mdReport: mdPath,
    summary: report.summary
  }, null, 2));
}

function generateMarkdown(report) {
  const lines = [];

  lines.push('# SEO Audit Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Framework:** ${report.framework}`);
  lines.push(`**Project:** ${report.projectRoot}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Issues | ${report.summary.totalIssues} |`);
  lines.push(`| Critical | ${report.summary.bySeverity.critical} |`);
  lines.push(`| High | ${report.summary.bySeverity.high} |`);
  lines.push(`| Medium | ${report.summary.bySeverity.medium} |`);
  lines.push(`| Low | ${report.summary.bySeverity.low} |`);
  lines.push(`| Auto-fixable | ${report.summary.autoFixable} |`);
  lines.push('');

  // Category breakdown
  lines.push('### Issues by Category');
  lines.push('');
  lines.push('| Category | Issues |');
  lines.push('|----------|--------|');
  for (const cat of CATEGORIES) {
    lines.push(`| ${CATEGORY_LABELS[cat]} | ${report.summary.byCategory[cat]} |`);
  }
  lines.push('');

  // Detailed sections per category
  for (const cat of CATEGORIES) {
    const catIssues = report.issues.filter(i => i.category === cat);
    lines.push(`## ${CATEGORY_LABELS[cat]}`);
    lines.push('');

    if (catIssues.length === 0) {
      lines.push('No issues found.');
      lines.push('');
      continue;
    }

    for (const issue of catIssues) {
      lines.push(`### ${issue.id} [${issue.severity.toUpperCase()}]`);
      lines.push('');
      lines.push(`- **File:** \`${issue.file}\`${issue.line ? ` (line ${issue.line})` : ''}`);
      lines.push(`- **Problem:** ${issue.problem}`);
      lines.push(`- **SEO Impact:** ${issue.seoImpact}`);
      lines.push(`- **Recommended Fix:** ${issue.recommendedFix}`);
      lines.push(`- **Auto-fix Available:** ${issue.autoFixPossible ? 'Yes' : 'No'}`);
      lines.push('');
    }
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by seo-plugin*');

  return lines.join('\n');
}

try {
  generateReport();
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
