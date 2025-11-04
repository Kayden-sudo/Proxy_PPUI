#!/usr/bin/env node
/**
 * Generate central manifest.json for UI-SPEC
 * 
 * Creates a comprehensive overview of:
 * - Project metadata
 * - All routes and their status
 * - Asset inventory
 * - Slice counts
 * - Validation status
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SPEC_ROOT = path.join(__dirname, '..', 'UI-SPEC');

function generateManifest() {
  console.log('📋 Generating manifest.json...\n');
  
  // Load meta
  const meta = yaml.load(fs.readFileSync(path.join(SPEC_ROOT, 'meta.yml'), 'utf8'));
  
  // Load registry
  const registry = yaml.load(fs.readFileSync(path.join(SPEC_ROOT, 'registry.yml'), 'utf8'));
  
  // Count assets
  const assetsContent = fs.readFileSync(path.join(SPEC_ROOT, 'assets.yml'), 'utf8');
  const assets = yaml.load(assetsContent);
  const assetArray = Array.isArray(assets) ? assets : [assets].filter(Boolean);
  
  const assetsByType = {
    svg: assetArray.filter(a => a?.type === 'svg').length,
    png: assetArray.filter(a => a?.type === 'png').length,
    lottie: assetArray.filter(a => a?.type === 'lottie').length,
  };
  
  // Scan implemented routes
  const routesDir = path.join(SPEC_ROOT, 'routes');
  const implementedRoutes = fs.existsSync(routesDir)
    ? fs.readdirSync(routesDir).filter(f => fs.statSync(path.join(routesDir, f)).isDirectory())
    : [];
  
  const routeDetails = {};
  let totalSlices = 0;
  let totalOverlays = 0;
  
  implementedRoutes.forEach(routeName => {
    const routePath = path.join(routesDir, routeName);
    const slicesDir = path.join(routePath, 'slices');
    const overlaysDir = path.join(routePath, 'overlays');
    
    const sliceFiles = fs.existsSync(slicesDir)
      ? fs.readdirSync(slicesDir).filter(f => f.endsWith('.yml'))
      : [];
    
    const overlayFiles = fs.existsSync(overlaysDir)
      ? fs.readdirSync(overlaysDir).filter(f => f.endsWith('.png'))
      : [];
    
    // Try to read route.yml for metadata
    let routeData = {};
    const routeYmlPath = path.join(routePath, 'route.yml');
    if (fs.existsSync(routeYmlPath)) {
      try {
        routeData = yaml.load(fs.readFileSync(routeYmlPath, 'utf8'));
      } catch (err) {
        console.warn(`   ⚠️  Could not parse ${routeName}/route.yml`);
      }
    }
    
    // Find matching registry entry
    const registryEntry = registry.routes?.find(r => 
      r.id === routeName || r.id === `auth.${routeName}` || r.path === `/${routeName}`
    );
    
    routeDetails[routeName] = {
      status: 'implemented',
      slices: sliceFiles.length,
      overlays: overlayFiles.length,
      path: (routeData && routeData.route) || (registryEntry && registryEntry.path) || `/${routeName}`,
      kind: (registryEntry && registryEntry.kind) || 'screen',
      purpose: (registryEntry && registryEntry.purpose) || (routeData && routeData.summary) || '',
    };
    
    totalSlices += sliceFiles.length;
    totalOverlays += overlayFiles.length;
  });
  
  // Identify planned routes
  const registeredIds = registry.routes?.map(r => r.id) || [];
  const plannedRoutes = registeredIds.filter(id => {
    const routeName = id.replace(/^auth\./, '');
    return !implementedRoutes.includes(routeName) && !implementedRoutes.includes(id);
  });
  
  // Generate manifest
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    project: {
      name: meta.project || 'Proxy',
      description: 'Pixel-perfect UI specification for mobile app',
      baseline: '360×640 px (portrait)',
      breakpoints: meta.breakpoints || [360, 393, 430],
      units: meta.units || 'px',
      colorSpace: meta.colorSpace || 'sRGB',
    },
    spec: {
      root: 'UI-SPEC/',
      core: [
        'meta.yml',
        'tokens.yml',
        'grid.yml',
        'motion.yml',
        'assets.yml',
        'registry.yml',
        'fonts.yml'
      ],
    },
    assets: {
      total: assetArray.length,
      byType: assetsByType,
      catalog: 'assets.yml',
    },
    routes: {
      total: registeredIds.length,
      implemented: implementedRoutes.length,
      planned: plannedRoutes.length,
      details: routeDetails,
      plannedList: plannedRoutes,
    },
    slices: {
      total: totalSlices,
      perRoute: Object.fromEntries(
        Object.entries(routeDetails).map(([name, data]) => [name, data.slices])
      ),
    },
    overlays: {
      total: totalOverlays,
      perRoute: Object.fromEntries(
        Object.entries(routeDetails).map(([name, data]) => [name, data.overlays])
      ),
    },
    readiness: {
      codeGen: implementedRoutes.length >= 2 && assetArray.length >= 10,
      production: implementedRoutes.length === registeredIds.length,
      coverage: `${implementedRoutes.length}/${registeredIds.length} routes`,
    },
    validation: {
      script: 'scripts/preflight.js',
      command: 'npm run validate',
      ci: '.github/workflows/validate-spec.yml',
    },
    documentation: {
      fonts: 'UI-SPEC/fonts.yml',
      readme: 'UI-SPEC/README.md',
      changelog: 'FIXES-APPLIED.md',
    },
  };
  
  // Write manifest
  const manifestPath = path.join(__dirname, '..', 'UI-SPEC', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Manifest generated: UI-SPEC/manifest.json\n');
  console.log('📊 Summary:');
  console.log(`   Project: ${manifest.project.name}`);
  console.log(`   Assets: ${manifest.assets.total} (${assetsByType.svg} SVG, ${assetsByType.png} PNG)`);
  console.log(`   Routes: ${manifest.routes.implemented}/${manifest.routes.total} implemented`);
  console.log(`   Slices: ${manifest.slices.total} total`);
  console.log(`   Overlays: ${manifest.overlays.total} PNG references`);
  console.log(`   Code-gen ready: ${manifest.readiness.codeGen ? '✅ Yes' : '❌ Not yet'}\n`);
  
  return manifest;
}

// Run if called directly
if (require.main === module) {
  try {
    generateManifest();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error generating manifest:', err.message);
    process.exit(1);
  }
}

module.exports = { generateManifest };

