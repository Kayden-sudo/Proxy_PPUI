#!/usr/bin/env node
/**
 * Preflight Validation Script for Proxy UI-SPEC
 * 
 * Validates:
 * - Meta configuration & breakpoint consistency
 * - Tokens (colors, typography, spacing, etc.)
 * - Grid configuration
 * - Motion presets
 * - Assets (file existence, references)
 * - Routes & slices (schema compliance)
 * - Overlay files
 * 
 * Usage: node scripts/preflight.js
 * Exit codes: 0 = pass, 1 = errors found, 2 = critical failure
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SPEC_ROOT = path.join(__dirname, '..', 'UI-SPEC');
const EXPECTED_BREAKPOINTS = ['360', '393', '430'];

// Issue tracking
const issues = {
  errors: [],
  warnings: [],
  info: []
};

function logIssue(severity, category, file, message, line = null) {
  issues[severity].push({ category, file, message, line });
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

function validateMeta() {
  console.log('🔍 Validating meta.yml...');
  
  try {
    const metaPath = path.join(SPEC_ROOT, 'meta.yml');
    if (!fs.existsSync(metaPath)) {
      logIssue('errors', 'meta', 'meta.yml', 'File not found');
      return null;
    }

    const meta = yaml.load(fs.readFileSync(metaPath, 'utf8'));
    
    // Check required fields
    if (!meta.project) logIssue('errors', 'meta', 'meta.yml', 'Missing "project" field');
    if (meta.units !== 'px') logIssue('errors', 'meta', 'meta.yml', 'Units must be "px"');
    if (meta.colorSpace !== 'sRGB') logIssue('errors', 'meta', 'meta.yml', 'ColorSpace must be "sRGB"');
    
    // Check breakpoints
    const actualBPs = (meta.breakpoints || []).map(String);
    if (JSON.stringify(actualBPs) !== JSON.stringify(EXPECTED_BREAKPOINTS)) {
      logIssue('errors', 'meta', 'meta.yml', 
        `Breakpoints mismatch. Expected [${EXPECTED_BREAKPOINTS}], got [${actualBPs}]`);
    }
    
    console.log('   ✅ meta.yml valid\n');
    return meta.breakpoints || [];
    
  } catch (err) {
    logIssue('errors', 'meta', 'meta.yml', `Parse error: ${err.message}`);
    return null;
  }
}

function validateTokens() {
  console.log('🔍 Validating tokens.yml...');
  
  try {
    const tokensPath = path.join(SPEC_ROOT, 'tokens.yml');
    const tokens = yaml.load(fs.readFileSync(tokensPath, 'utf8'));
    
    // Validate colors exist
    if (!tokens.colors?.brand) logIssue('errors', 'tokens', 'tokens.yml', 'Missing colors.brand');
    if (!tokens.colors?.surface) logIssue('errors', 'tokens', 'tokens.yml', 'Missing colors.surface');
    if (!tokens.colors?.text) logIssue('errors', 'tokens', 'tokens.yml', 'Missing colors.text');
    
    // Validate typography
    if (!tokens.typography) logIssue('errors', 'tokens', 'tokens.yml', 'Missing typography section');
    
    // Validate spacing
    if (!tokens.spacing) logIssue('errors', 'tokens', 'tokens.yml', 'Missing spacing scale');
    
    // Validate radii
    if (!tokens.radii) logIssue('errors', 'tokens', 'tokens.yml', 'Missing radii');
    
    // Check for common tokens
    const expectedColors = ['green', 'green_alt', 'purple', 'black'];
    expectedColors.forEach(color => {
      if (!tokens.colors?.brand?.[color]) {
        logIssue('warnings', 'tokens', 'tokens.yml', `Missing brand.${color} color`);
      }
    });
    
    console.log('   ✅ tokens.yml valid\n');
    return tokens;
    
  } catch (err) {
    logIssue('errors', 'tokens', 'tokens.yml', `Parse error: ${err.message}`);
    return null;
  }
}

function validateGrid(breakpoints) {
  console.log('🔍 Validating grid.yml...');
  
  try {
    const gridPath = path.join(SPEC_ROOT, 'grid.yml');
    const grid = yaml.load(fs.readFileSync(gridPath, 'utf8'));
    
    // Check columns
    if (grid.columns !== 12) {
      logIssue('warnings', 'grid', 'grid.yml', `Expected 12 columns, got ${grid.columns}`);
    }
    
    // Check breakpoints in container
    const containerBPs = Object.keys(grid.container?.widths || {});
    breakpoints.forEach(bp => {
      if (!containerBPs.includes(String(bp))) {
        logIssue('errors', 'grid', 'grid.yml', `Missing container width for breakpoint ${bp}`);
      }
    });
    
    console.log('   ✅ grid.yml valid\n');
    return grid;
    
  } catch (err) {
    logIssue('errors', 'grid', 'grid.yml', `Parse error: ${err.message}`);
    return null;
  }
}

function validateMotion() {
  console.log('🔍 Validating motion.yml...');
  
  try {
    const motionPath = path.join(SPEC_ROOT, 'motion.yml');
    const motion = yaml.load(fs.readFileSync(motionPath, 'utf8'));
    
    // Check defaults
    if (!motion.defaults) logIssue('errors', 'motion', 'motion.yml', 'Missing defaults section');
    if (!motion.defaults?.duration) logIssue('errors', 'motion', 'motion.yml', 'Missing defaults.duration');
    if (!motion.defaults?.easing) logIssue('errors', 'motion', 'motion.yml', 'Missing defaults.easing');
    
    // Check policy
    if (!motion.policy) logIssue('errors', 'motion', 'motion.yml', 'Missing policy section');
    
    // Check presets
    if (!motion.presets) logIssue('warnings', 'motion', 'motion.yml', 'No motion presets defined');
    
    console.log('   ✅ motion.yml valid\n');
    return motion;
    
  } catch (err) {
    logIssue('errors', 'motion', 'motion.yml', `Parse error: ${err.message}`);
    return null;
  }
}

function validateAssets() {
  console.log('🔍 Validating assets...');
  
  try {
    const assetsPath = path.join(SPEC_ROOT, 'assets.yml');
    const assetsContent = fs.readFileSync(assetsPath, 'utf8');
    // Parse as a single YAML file containing an array of assets
    const parsed = yaml.load(assetsContent);
    const assets = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
    
    const assetMap = new Map();
    const assetIds = new Set();
    
    assets.forEach((asset, idx) => {
      if (!asset || !asset.id) return;
      
      // Check for duplicate IDs
      if (assetIds.has(asset.id)) {
        logIssue('errors', 'assets', 'assets.yml', `Duplicate asset ID: ${asset.id}`);
      }
      assetIds.add(asset.id);
      assetMap.set(asset.id, asset);
      
      // Validate required fields
      if (!asset.type) logIssue('errors', 'assets', 'assets.yml', `Asset ${asset.id}: missing type`);
      if (!asset.path) logIssue('errors', 'assets', 'assets.yml', `Asset ${asset.id}: missing path`);
      if (!asset.intrinsic) logIssue('warnings', 'assets', 'assets.yml', `Asset ${asset.id}: missing intrinsic dimensions`);
      
      // Check file exists
      if (asset.path) {
        const assetFilePath = path.join(__dirname, '..', asset.path);
        if (!fs.existsSync(assetFilePath)) {
          logIssue('errors', 'assets', 'assets.yml', `Asset ${asset.id}: file not found at ${asset.path}`);
        }
      }
      
      // Check for .svg.svg double extension
      if (asset.path && asset.path.includes('.svg.svg')) {
        logIssue('errors', 'assets', 'assets.yml', `Asset ${asset.id}: double .svg.svg extension in path`);
      }
    });
    
    if (assetMap.size === 0) {
      logIssue('warnings', 'assets', 'assets.yml', 'No assets found - check file format');
    }
    
    console.log(`   ✅ ${assetMap.size} assets validated\n`);
    return assetMap;
    
  } catch (err) {
    logIssue('errors', 'assets', 'assets.yml', `Parse error: ${err.message}`);
    return new Map();
  }
}

function validateRoutes(breakpoints, assetMap) {
  console.log('🔍 Validating routes...');
  
  try {
    const registryPath = path.join(SPEC_ROOT, 'registry.yml');
    const registry = yaml.load(fs.readFileSync(registryPath, 'utf8'));
    
    if (!registry.routes) {
      logIssue('errors', 'registry', 'registry.yml', 'No routes defined');
      return;
    }
    
    const routesDir = path.join(SPEC_ROOT, 'routes');
    const implementedRoutes = fs.existsSync(routesDir) 
      ? fs.readdirSync(routesDir).filter(f => fs.statSync(path.join(routesDir, f)).isDirectory())
      : [];
    
    let validatedSlices = 0;
    
    implementedRoutes.forEach(routeName => {
      const slicesDir = path.join(routesDir, routeName, 'slices');
      if (!fs.existsSync(slicesDir)) return;
      
      const sliceFiles = fs.readdirSync(slicesDir).filter(f => f.endsWith('.yml'));
      
      sliceFiles.forEach(sliceFile => {
        const slicePath = path.join(slicesDir, sliceFile);
        const relPath = `routes/${routeName}/slices/${sliceFile}`;
        
        try {
          const slice = yaml.load(fs.readFileSync(slicePath, 'utf8'));
          
          // Validate required fields
          if (!slice.sliceId) logIssue('errors', 'slice', relPath, 'Missing sliceId');
          if (!slice.route) logIssue('errors', 'slice', relPath, 'Missing route');
          if (!slice.overlays) logIssue('errors', 'slice', relPath, 'Missing overlays');
          if (!slice.elements) logIssue('warnings', 'slice', relPath, 'No elements defined');
          
          // Check overlays match breakpoints
          if (slice.overlays) {
            const overlayBPs = Object.keys(slice.overlays).map(String);
            breakpoints.forEach(bp => {
              if (!overlayBPs.includes(String(bp))) {
                logIssue('errors', 'slice', relPath, `Missing overlay for breakpoint ${bp}`);
              }
              
              // Check overlay file exists
              const overlayPath = path.join(__dirname, '..', slice.overlays[bp] || '');
              if (slice.overlays[bp] && !fs.existsSync(overlayPath)) {
                logIssue('errors', 'slice', relPath, `Overlay file not found: ${slice.overlays[bp]}`);
              }
            });
          }
          
          // Check acceptance.breakpoints
          if (slice.acceptance?.breakpoints) {
            const acceptBPs = slice.acceptance.breakpoints.map(String);
            if (JSON.stringify(acceptBPs) !== JSON.stringify(breakpoints.map(String))) {
              logIssue('errors', 'slice', relPath, 
                `acceptance.breakpoints [${acceptBPs}] doesn't match meta.yml [${breakpoints}]`);
            }
          } else {
            logIssue('warnings', 'slice', relPath, 'Missing acceptance.breakpoints');
          }
          
          // Validate elements
          if (slice.elements) {
            slice.elements.forEach((el, idx) => {
              const elId = el.id || `element[${idx}]`;
              
              // Check box has all breakpoints
              if (el.box) {
                const boxBPs = Object.keys(el.box).map(String);
                breakpoints.forEach(bp => {
                  if (!boxBPs.includes(String(bp))) {
                    logIssue('errors', 'slice', relPath, `${elId}: missing box for breakpoint ${bp}`);
                  }
                });
              }
              
              // Check asset references
              if (el.asset && !assetMap.has(el.asset)) {
                logIssue('errors', 'slice', relPath, `${elId}: references unknown asset "${el.asset}"`);
              }
              
              // Check for placeholder typeStyle
              if (el.typeStyle?.family === '—') {
                logIssue('info', 'slice', relPath, `${elId}: uses placeholder typeStyle.family "—" (acceptable for non-text elements)`);
              }
            });
          }
          
          validatedSlices++;
          
        } catch (err) {
          logIssue('errors', 'slice', relPath, `Parse error: ${err.message}`);
        }
      });
    });
    
    console.log(`   ✅ ${implementedRoutes.length} routes, ${validatedSlices} slices validated\n`);
    
  } catch (err) {
    logIssue('errors', 'registry', 'registry.yml', `Parse error: ${err.message}`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ══════════════════════════════════════════════════════════════════════════════

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  PROXY UI-SPEC PREFLIGHT VALIDATION                               ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

try {
  const breakpoints = validateMeta();
  if (!breakpoints) {
    console.error('❌ CRITICAL: meta.yml validation failed. Cannot continue.\n');
    process.exit(2);
  }
  
  validateTokens();
  validateGrid(breakpoints);
  validateMotion();
  const assetMap = validateAssets();
  validateRoutes(breakpoints, assetMap);
  
  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION SUMMARY\n');
  
  const totalIssues = issues.errors.length + issues.warnings.length + issues.info.length;
  
  console.log(`❌ Errors:   ${issues.errors.length}`);
  console.log(`⚠️  Warnings: ${issues.warnings.length}`);
  console.log(`ℹ️  Info:     ${issues.info.length}`);
  console.log(`   Total:    ${totalIssues}\n`);
  
  if (totalIssues === 0) {
    console.log('✅ ALL VALIDATIONS PASSED! 🎉');
    console.log('   UI-SPEC is ready for code generation.\n');
    process.exit(0);
  }
  
  // Print issues
  if (issues.errors.length > 0) {
    console.log('❌ ERRORS (MUST FIX):\n');
    issues.errors.forEach(({ category, file, message, line }) => {
      console.log(`   [${category}] ${file}${line ? `:${line}` : ''}`);
      console.log(`      ${message}\n`);
    });
  }
  
  if (issues.warnings.length > 0) {
    console.log('⚠️  WARNINGS (SHOULD FIX):\n');
    issues.warnings.forEach(({ category, file, message, line }) => {
      console.log(`   [${category}] ${file}${line ? `:${line}` : ''}`);
      console.log(`      ${message}\n`);
    });
  }
  
  if (issues.info.length > 0 && process.env.VERBOSE) {
    console.log('ℹ️  INFO:\n');
    issues.info.forEach(({ category, file, message }) => {
      console.log(`   [${category}] ${file}`);
      console.log(`      ${message}\n`);
    });
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '..', 'preflight-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(issues, null, 2));
  console.log(`📄 Full results saved to: preflight-results.json\n`);
  
  // Exit with error if there are errors
  if (issues.errors.length > 0) {
    console.log('❌ VALIDATION FAILED: Please fix errors above.\n');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED (with warnings)\n');
    process.exit(0);
  }
  
} catch (err) {
  console.error('💥 CRITICAL ERROR:', err.message);
  console.error(err.stack);
  process.exit(2);
}

