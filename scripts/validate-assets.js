#!/usr/bin/env node
/**
 * Validate that all asset references in slice files exist in assets.yml
 * and that all asset file paths point to existing files
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SPEC_ROOT = path.join(__dirname, '..', 'UI-SPEC');
const issues = [];

// 1. Load all assets from assets.yml
console.log('📦 Loading assets.yml...');
const assetsPath = path.join(SPEC_ROOT, 'assets.yml');
const assetsContent = fs.readFileSync(assetsPath, 'utf8');
const assetDocs = yaml.loadAll(assetsContent);

const assetMap = new Map();
assetDocs.forEach(asset => {
  if (asset && asset.id) {
    assetMap.set(asset.id, asset);
  }
});

console.log(`   Found ${assetMap.size} assets defined\n`);

// 2. Check that all asset file paths exist
console.log('🔍 Validating asset file paths...');
let pathIssues = 0;
assetMap.forEach((asset, id) => {
  const assetPath = path.join(__dirname, '..', asset.path);
  if (!fs.existsSync(assetPath)) {
    issues.push({
      severity: 'error',
      category: 'asset-file',
      file: 'assets.yml',
      message: `Asset "${id}" references non-existent file: ${asset.path}`
    });
    pathIssues++;
  }
});

if (pathIssues === 0) {
  console.log('   ✅ All asset paths valid\n');
} else {
  console.log(`   ❌ ${pathIssues} missing asset file(s)\n`);
}

// 3. Find all slice files and check their asset references
console.log('🔍 Checking slice asset references...');
const routesDir = path.join(SPEC_ROOT, 'routes');
const routes = fs.readdirSync(routesDir).filter(f => {
  const stat = fs.statSync(path.join(routesDir, f));
  return stat.isDirectory();
});

let totalRefs = 0;
let invalidRefs = 0;

routes.forEach(route => {
  const slicesDir = path.join(routesDir, route, 'slices');
  if (!fs.existsSync(slicesDir)) return;

  const sliceFiles = fs.readdirSync(slicesDir).filter(f => f.endsWith('.yml'));
  
  sliceFiles.forEach(sliceFile => {
    const slicePath = path.join(slicesDir, sliceFile);
    const slice = yaml.load(fs.readFileSync(slicePath, 'utf8'));
    
    if (!slice.elements) return;
    
    slice.elements.forEach(element => {
      if (element.asset) {
        totalRefs++;
        if (!assetMap.has(element.asset)) {
          issues.push({
            severity: 'error',
            category: 'asset-ref',
            file: `routes/${route}/slices/${sliceFile}`,
            element: element.id,
            message: `References undefined asset: "${element.asset}"`
          });
          invalidRefs++;
        }
      }
    });
  });
});

if (invalidRefs === 0) {
  console.log(`   ✅ All ${totalRefs} asset references valid\n`);
} else {
  console.log(`   ❌ ${invalidRefs}/${totalRefs} invalid reference(s)\n`);
}

// 4. Report results
console.log('═══════════════════════════════════════════════════');
console.log('📊 VALIDATION SUMMARY\n');
console.log(`Total assets defined: ${assetMap.size}`);
console.log(`Total asset references: ${totalRefs}`);
console.log(`Issues found: ${issues.length}\n`);

if (issues.length === 0) {
  console.log('✅ All validations passed!');
  process.exit(0);
} else {
  console.log('❌ Issues found:\n');
  issues.forEach(issue => {
    const icon = issue.severity === 'error' ? '❌' : '⚠️';
    console.log(`${icon} [${issue.category}] ${issue.file}`);
    if (issue.element) console.log(`   Element: ${issue.element}`);
    console.log(`   ${issue.message}\n`);
  });
  
  // Save to JSON
  const outputPath = path.join(__dirname, '..', 'validation-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(issues, null, 2));
  console.log(`📄 Full results saved to validation-results.json`);
  
  process.exit(1);
}

