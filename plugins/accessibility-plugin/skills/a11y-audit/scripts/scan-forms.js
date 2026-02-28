#!/usr/bin/env node
/**
 * scan-forms.js
 * Scans for form accessibility issues.
 * Detects: missing labels, placeholder-as-label, error messaging, fieldset/legend.
 * Usage: node scan-forms.js [project-root] [framework]
 * Output: JSON { issues: [...] }
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2] || process.cwd();
const framework = process.argv[3] || 'html';

function scanForms() {
  const issues = [];
  const files = getSourceFiles();

  for (const file of files) {
    const relPath = path.relative(projectRoot, file);
    const content = readFileSafe(file);
    if (!content) continue;
    const lines = content.split('\n');

    // Collect all label htmlFor/for values
    const labelForPattern = /(?:htmlFor|for)\s*=\s*["']([^"']+)["']/gi;
    const labeledIds = new Set();
    let match;
    while ((match = labelForPattern.exec(content)) !== null) {
      labeledIds.add(match[1]);
    }

    // Check wrapping labels
    const wrappingLabelPattern = /<label[^>]*>[\s\S]*?<(input|select|textarea)[\s\S]*?<\/label>/gi;
    const wrappedInputPositions = new Set();
    while ((match = wrappingLabelPattern.exec(content)) !== null) {
      const innerInput = match[0].match(/<(input|select|textarea)\s/);
      if (innerInput) {
        wrappedInputPositions.add(content.indexOf(match[0]) + match[0].indexOf(innerInput[0]));
      }
    }

    // Scan inputs, selects, textareas
    const inputPattern = /<(input|select|textarea)\s([^>]*?)\/?\s*>/gi;
    while ((match = inputPattern.exec(content)) !== null) {
      const tagName = match[1];
      const attrs = match[2];
      const lineNum = content.substring(0, match.index).split('\n').length;
      const isHidden = /\btype\s*=\s*["']hidden["']/.test(attrs);
      const isSubmit = /\btype\s*=\s*["']submit["']/.test(attrs);

      if (isHidden || isSubmit) continue;

      const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
      const hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/.test(attrs);
      const hasAriaLabelledBy = /\baria-labelledby\s*=\s*["'][^"']+["']/.test(attrs);
      const hasPlaceholder = /\bplaceholder\s*=/.test(attrs);
      const isLabeled = hasAriaLabel || hasAriaLabelledBy ||
                        (idMatch && labeledIds.has(idMatch[1])) ||
                        wrappedInputPositions.has(match.index);

      if (!isLabeled) {
        if (hasPlaceholder) {
          issues.push({
            severity: 'high',
            category: 'forms',
            file: relPath,
            line: lineNum,
            problem: `<${tagName}> uses placeholder as its only label`,
            impact: 'Placeholder text disappears when typing, leaving users with no label reference. Screen readers may not announce placeholders consistently.',
            recommendedFix: `Add a visible <label> element associated via htmlFor/id, or add aria-label if a visible label is not possible.`,
            autoFixPossible: true,
            wcagCriteria: '1.3.1',
            wcagLevel: 'A'
          });
        } else {
          issues.push({
            severity: 'critical',
            category: 'forms',
            file: relPath,
            line: lineNum,
            problem: `<${tagName}> has no associated label`,
            impact: 'Screen readers cannot identify this form control. Users do not know what to enter.',
            recommendedFix: `Add a <label htmlFor="id"> and an id to the ${tagName}, or add aria-label="descriptive label".`,
            autoFixPossible: true,
            wcagCriteria: '1.3.1',
            wcagLevel: 'A'
          });
        }
      }

      // Check for aria-describedby on inputs that may need error messages
      const hasAriaDescribedBy = /\baria-describedby\s*=/.test(attrs);
      const hasAriaInvalid = /\baria-invalid\s*=/.test(attrs);
      if (hasAriaInvalid && !hasAriaDescribedBy) {
        issues.push({
          severity: 'medium',
          category: 'forms',
          file: relPath,
          line: lineNum,
          problem: `<${tagName}> has aria-invalid but no aria-describedby for error message`,
          impact: 'Screen readers know the field is invalid but cannot find the error message explaining why.',
          recommendedFix: 'Add aria-describedby pointing to the error message element ID.',
          autoFixPossible: false,
          wcagCriteria: '3.3.1',
          wcagLevel: 'A'
        });
      }
    }

    // Check for radio/checkbox groups without fieldset/legend
    const radioPattern = /type\s*=\s*["'](radio|checkbox)["']/gi;
    const radioNames = new Set();
    while ((match = radioPattern.exec(content)) !== null) {
      const nameMatch = content.substring(Math.max(0, content.lastIndexOf('<', match.index)), content.indexOf('>', match.index)).match(/\bname\s*=\s*["']([^"']+)["']/);
      if (nameMatch) radioNames.add(nameMatch[1]);
    }

    for (const name of radioNames) {
      const count = (content.match(new RegExp(`name\\s*=\\s*["']${name}["']`, 'g')) || []).length;
      if (count > 1) {
        // Check if wrapped in fieldset
        const nameRegex = new RegExp(`name\\s*=\\s*["']${name}["']`);
        const firstMatch = content.match(nameRegex);
        if (firstMatch) {
          const before = content.substring(0, firstMatch.index);
          const lastFieldset = before.lastIndexOf('<fieldset');
          const lastFieldsetClose = before.lastIndexOf('</fieldset');
          const isInFieldset = lastFieldset > lastFieldsetClose;

          if (!isInFieldset) {
            const lineNum = before.split('\n').length;
            issues.push({
              severity: 'medium',
              category: 'forms',
              file: relPath,
              line: lineNum,
              problem: `Radio/checkbox group "${name}" not wrapped in <fieldset> with <legend>`,
              impact: 'Screen readers cannot associate the group label with the individual options. Users may not understand the grouping context.',
              recommendedFix: `Wrap the group in <fieldset> and add a <legend> describing the group purpose.`,
              autoFixPossible: false,
              wcagCriteria: '1.3.1',
              wcagLevel: 'A'
            });
          }
        }
      }
    }

    // Check for form-level error containers missing aria-live
    const errorContainerPattern = /<(div|span|p)\s[^>]*class\s*=\s*["'][^"']*(error|invalid|alert|warning)[^"']*["'][^>]*>/gi;
    while ((match = errorContainerPattern.exec(content)) !== null) {
      const tag = match[0];
      const lineNum = content.substring(0, match.index).split('\n').length;
      const hasAriaLive = /\baria-live\s*=/.test(tag);
      const hasRole = /\brole\s*=\s*["'](alert|status)["']/.test(tag);

      if (!hasAriaLive && !hasRole) {
        issues.push({
          severity: 'medium',
          category: 'forms',
          file: relPath,
          line: lineNum,
          problem: 'Error message container missing role="alert" or aria-live attribute',
          impact: 'Dynamic error messages are not announced to screen reader users when they appear.',
          recommendedFix: 'Add role="alert" for important errors or aria-live="polite" for non-critical messages.',
          autoFixPossible: false,
          wcagCriteria: '4.1.3',
          wcagLevel: 'AA'
        });
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
      const files = [];
      for (const dir of ['src', 'components']) {
        const fullDir = path.join(projectRoot, dir);
        if (fs.existsSync(fullDir)) files.push(...findFiles(fullDir, /\.(tsx?|jsx?)$/));
      }
      return files;
    },
    angular: () => {
      const srcDir = path.join(projectRoot, 'src');
      return fs.existsSync(srcDir) ? findFiles(srcDir, /\.(html|ts)$/) : [];
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
  console.log(JSON.stringify(scanForms(), null, 2));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
