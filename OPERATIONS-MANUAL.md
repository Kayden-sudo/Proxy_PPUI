# UI-SPEC Operations Manual

**Proxy Mobile App - Pixel-Perfect UI Specification**  
**Version:** 1.0.0  
**Last Updated:** 2025-11-04

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Daily Workflow](#daily-workflow)
3. [Validation System](#validation-system)
4. [Adding New Routes](#adding-new-routes)
5. [Adding New Assets](#adding-new-assets)
6. [Typography & Fonts](#typography--fonts)
7. [Manifest System](#manifest-system)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure you have Node.js installed (v18+)
node --version

# Install dependencies
npm install
```

### Essential Commands
```bash
npm run validate          # Validate entire spec (run before commits)
npm run manifest          # Generate/update manifest.json
npm run validate:verbose  # Detailed validation with info messages
```

### First Time Setup
1. Clone the repository
2. Run `npm install` in the project root
3. Run `npm run validate` to verify everything is working
4. Review `UI-SPEC/manifest.json` for spec overview

---

## 🔄 Daily Workflow

### Before Starting Work
```bash
git pull origin main
npm run validate    # Ensure spec is valid
npm run manifest    # Get current status
```

### While Working
1. Make changes to YAML files in `UI-SPEC/`
2. Save all files
3. Run `npm run validate` frequently to catch errors early

### Before Committing
```bash
npm run validate    # Must pass (0 errors)
npm run manifest    # Update inventory
git add .
git commit -m "feat: your descriptive message"
git push origin main
```

**Important:** CI will automatically run validation. Fix any errors before the PR is merged.

---

## ✅ Validation System

### What Gets Validated

The preflight script (`scripts/preflight.js`) checks:

1. **Meta Configuration**
   - Breakpoints: `[360, 393, 430]`
   - Units: `px`
   - Color space: `sRGB`

2. **Tokens**
   - All color definitions (HEX/rgba format)
   - Typography styles (family, weight, size, line, track)
   - Spacing, radii, shadows, zIndex

3. **Grid**
   - 12 columns
   - Container widths per breakpoint
   - Gutter consistency

4. **Assets**
   - All referenced files exist
   - No duplicate asset IDs
   - No `.svg.svg` double extensions
   - Asset references in slices match definitions

5. **Routes & Slices**
   - All required fields present
   - Overlay files exist for all breakpoints
   - Box maps cover all breakpoints
   - Acceptance blocks match meta.yml breakpoints

### Understanding Validation Output

```bash
npm run validate
```

**Success:**
```
✅ meta.yml valid
✅ tokens.yml valid
✅ 18 assets validated
✅ 2 routes, 11 slices validated
✅ VALIDATION PASSED
```

**Errors:**
```
❌ ERRORS (MUST FIX):
   [slice] routes/my-route/slices/hero.yml
      Missing overlay for breakpoint 430
```

**What to do:** Fix the error, then run `npm run validate` again.

### Validation Results File

After validation, check `preflight-results.json` for detailed error information:
```json
{
  "errors": [
    {
      "category": "slice",
      "file": "routes/my-route/slices/hero.yml",
      "message": "Missing overlay for breakpoint 430"
    }
  ]
}
```

---

## 📱 Adding New Routes

### Step-by-Step Process

1. **Create Route Structure**
   ```bash
   mkdir -p UI-SPEC/routes/my-route/{slices,overlays}
   ```

2. **Create `route.yml`**
   ```bash
   touch UI-SPEC/routes/my-route/route.yml
   ```
   
   ```yaml
   route: "/my-route"
   id: "my-route"
   summary: "Brief description of this route"
   background:
     fill: "#F3F4F6"
   a11y:
     contrast: ">= 4.5:1"
     keyboard: "Standard navigation"
     reducedMotion: "Minimal animations"
   ```

3. **Create `slices.yml`**
   ```yaml
   slices:
     - id: background
     - id: header
     - id: content
   
   overlays:
     360: "overlays/my-route-360.png"
     393: "overlays/my-route-393.png"
     430: "overlays/my-route-430.png"
   ```

4. **Create Slice Files**
   
   For each slice (e.g., `slices/header.yml`):
   ```yaml
   sliceId: "my-route.header"
   route: "/my-route"
   
   overlays:
     "360": "UI-SPEC/routes/my-route/overlays/my-route-360.png"
     "393": "UI-SPEC/routes/my-route/overlays/my-route-393.png"
     "430": "UI-SPEC/routes/my-route/overlays/my-route-430.png"
   
   layout:
     container: { "360": 360, "393": 393, "430": 430 }
     columns: 12
     gutter: 0
     padding:
       "360": { top: 24, right: 16, bottom: 24, left: 16 }
       "393": { top: 24, right: 16, bottom: 24, left: 16 }
       "430": { top: 24, right: 16, bottom: 24, left: 16 }
   
   elements:
     - id: "title"
       kind: text
       box:
         "360": { x: 16, y: 48, w: 328, h: 24 }
         "393": { x: 16, y: 48, w: 361, h: 24 }
         "430": { x: 16, y: 48, w: 398, h: 24 }
       typeStyle:
         family: "Rubik"
         weight: 500
         size: { "360": 10, "393": 10, "430": 10 }
         line: { "360": 14, "393": 14, "430": 14 }
         track: 0
       colors: { fg: "#0A0903", bg: "transparent" }
       borders: { width: 0, style: solid, radius: 0 }
       shadow: none
       spacing: { margin: {t:0,r:0,b:0,l:0}, padding: {t:0,r:0,b:0,l:0} }
       content: "Your title text"
   
   a11y:
     contrast: ">= 4.5:1"
     keyboard: "Focusable elements only"
     reducedMotion: "No motion"
   
   acceptance:
     breakpoints: ["360", "393", "430"]
     overlayTolerancePercent: 0.10
   ```

5. **Add Overlay PNGs**
   
   Export from Canva at 1:1 scale:
   - `my-route-360.png` (360×<height>)
   - `my-route-393.png` (393×<height>)
   - `my-route-430.png` (430×<height>)
   
   Place in `UI-SPEC/routes/my-route/overlays/`

6. **Update Registry** (optional)
   
   Add to `UI-SPEC/registry.yml`:
   ```yaml
   - id: my-route
     path: /my-route
     kind: screen
     purpose: "Description of what this screen does"
     exitsTo: [other-route]
   ```

7. **Validate**
   ```bash
   npm run validate
   npm run manifest
   ```

---

## 🎨 Adding New Assets

### SVG Assets

1. **Place File**
   ```bash
   # Put your SVG in the appropriate folder:
   UI-SPEC/assets/icons/my-icon.svg
   # OR
   UI-SPEC/assets/logo/my-logo.svg
   ```

2. **Add to `assets.yml`**
   ```yaml
   - id: "icon.my.icon"
     type: svg
     path: "UI-SPEC/assets/icons/my-icon.svg"
     intrinsic: [24, 24]  # width, height from SVG viewBox
     notes: "Description of when/how to use this icon"
   ```

3. **Reference in Slices**
   ```yaml
   elements:
     - id: "my-icon-element"
       kind: icon
       asset: "icon.my.icon"  # Must match ID in assets.yml
       box:
         "360": { x: 16, y: 16, w: 24, h: 24 }
         # ... other breakpoints
   ```

### PNG Assets

Same process, but:
```yaml
- id: "blob.my.blur"
  type: png
  path: "UI-SPEC/assets/blob/my-blur.png"
  intrinsic: [1920, 1080]
  notes: "Decorative blur element"
```

### Asset Naming Convention

Use **dot notation** for IDs:
- ✅ `logo.mark.black`
- ✅ `icon.nav.chat`
- ✅ `blob.green.v1`
- ❌ `logo_mark_black` (old format)

---

## 🔤 Typography & Fonts

### Font Strategy

The spec uses **2 font families**:

1. **Rubik** (primary UI font)
   - Weights: 300 (Light), 400 (Regular), 500 (Medium)
   - Used for: All UI text, buttons, headings, body copy
   - Source: Google Fonts / `@expo-google-fonts/rubik`

2. **Etna Sans Serif** (logo only)
   - Used for: Logo wordmark ("Proxy")
   - Implementation: **Baked into SVG paths** (no font file needed)
   - Do NOT install separately

### Implementation in React Native

```typescript
// App.tsx
import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium } from '@expo-google-fonts/rubik';

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_300Light,
    Rubik_400Regular,
    Rubik_500Medium,
  });

  if (!fontsLoaded) return null;
  return <YourApp />;
}
```

### Typography Tokens

Reference `UI-SPEC/tokens.yml` for all typography styles:

- `typography.body.base` → Rubik 400, 8.5px
- `typography.heading.h1.regular` → Rubik 400, 10px
- `typography.heading.h1.medium` → Rubik 500, 10px
- `typography.button.primary` → Rubik 500, 9.3px
- `typography.button.secondary` → Rubik 400, 8px

**Full details:** See `UI-SPEC/fonts.yml`

---

## 📊 Manifest System

### What is the Manifest?

`UI-SPEC/manifest.json` is an auto-generated inventory of your entire spec:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "Proxy",
    "breakpoints": [360, 393, 430]
  },
  "assets": {
    "total": 18,
    "byType": { "svg": 15, "png": 3 }
  },
  "routes": {
    "implemented": 2,
    "planned": 26
  },
  "readiness": {
    "codeGen": true,
    "coverage": "2/27 routes"
  }
}
```

### When to Regenerate

Run `npm run manifest` after:
- Adding new routes
- Adding new assets
- Making significant structural changes

The manifest is used by:
- Code-gen agents (single entry point)
- Status dashboards
- Project tracking

---

## 🤖 CI/CD Integration

### GitHub Actions Workflow

Located at: `.github/workflows/validate-spec.yml`

**Triggers on:**
- Push to any branch
- Pull requests to main/master/develop
- Only when `UI-SPEC/**` or `scripts/**` changes

**What it does:**

1. **Job: `validate`**
   - Runs `npm run validate`
   - Uploads validation results as artifact
   - Comments on PRs if validation fails

2. **Job: `validate-assets`**
   - Checks all asset files exist
   - Detects `.svg.svg` double extensions

3. **Job: `yaml-lint`**
   - Validates YAML syntax for all files

### Viewing CI Results

1. Go to your PR on GitHub
2. Check "Checks" tab
3. If failed, click "Details" to see errors
4. Fix errors locally, commit, and push again

### CI Will Fail If:
- Validation errors (missing files, wrong breakpoints, etc.)
- YAML syntax errors
- Missing asset files
- Double extensions in paths

---

## 🔧 Troubleshooting

### Common Errors & Solutions

#### "YAML parse error: bad indentation"

**Problem:** YAML files must use consistent 2-space indentation

**Solution:**
```yaml
# ❌ Wrong (3 spaces or mixed)
elements:
   - id: "my-element"

# ✅ Correct (2 spaces)
elements:
  - id: "my-element"
```

#### "Asset not found"

**Problem:** Asset referenced in slice doesn't exist in `assets.yml`

**Solution:**
1. Check spelling of asset ID
2. Add asset definition to `assets.yml`
3. Ensure asset file exists at specified path

#### "Missing overlay for breakpoint"

**Problem:** Slice overlay missing for one or more breakpoints

**Solution:** Create overlay PNGs for ALL breakpoints:
```
routes/my-route/overlays/
  ├── my-route-360.png  ✅
  ├── my-route-393.png  ✅
  └── my-route-430.png  ✅
```

#### "acceptance.breakpoints doesn't match meta.yml"

**Problem:** Slice has wrong breakpoints in acceptance block

**Solution:**
```yaml
# Always use:
acceptance:
  breakpoints: ["360", "393", "430"]  # Must match meta.yml
```

#### "Box missing for breakpoint"

**Problem:** Element box doesn't cover all breakpoints

**Solution:**
```yaml
box:
  "360": { x: 16, y: 24, w: 100, h: 50 }  # Must have all 3
  "393": { x: 16, y: 24, w: 100, h: 50 }
  "430": { x: 16, y: 24, w: 100, h: 50 }
```

### Validation Fails But Can't Find Error

1. **Run verbose mode:**
   ```bash
   npm run validate:verbose
   ```

2. **Check detailed results:**
   ```bash
   cat preflight-results.json | more
   ```

3. **Validate individual file:**
   ```bash
   npx js-yaml UI-SPEC/problematic-file.yml
   ```

### CI Passes Locally But Fails on GitHub

**Possible causes:**
- File not committed (check `git status`)
- Line ending issues (Windows CRLF vs Unix LF) - ignore these warnings
- Node version mismatch (ensure GitHub Actions uses Node 18+)

**Solution:**
```bash
git status  # Ensure all files committed
git push origin main
```

---

## ✨ Best Practices

### File Organization

```
UI-SPEC/
├── meta.yml          # Never modify breakpoints without global update
├── tokens.yml        # Single source of truth for design tokens
├── grid.yml          # Defines layout system
├── motion.yml        # Animation specs
├── assets.yml        # Asset catalog (keep alphabetized)
├── fonts.yml         # Font implementation guide
├── registry.yml      # Master route list
└── routes/
    └── route-name/
        ├── route.yml       # Route metadata
        ├── slices.yml      # Slice order
        ├── slices/         # One file per slice
        │   ├── header.yml
        │   └── content.yml
        └── overlays/       # Reference PNGs
            ├── route-360.png
            ├── route-393.png
            └── route-430.png
```

### Naming Conventions

**Routes:** kebab-case
- ✅ `welcome-screen`
- ✅ `sign-up`
- ❌ `WelcomeScreen`

**Slices:** kebab-case
- ✅ `cta-primary.yml`
- ✅ `left-card.yml`
- ❌ `CtaPrimary.yml`

**Asset IDs:** dot.notation
- ✅ `logo.mark.black`
- ✅ `icon.nav.chat`
- ❌ `logo_mark_black`

### YAML Formatting

- Use 2 spaces for indentation (no tabs)
- Quote breakpoint keys: `"360"` not `360`
- Quote paths in assets.yml: `"UI-SPEC/..."`
- Use lowercase `true`/`false`/`null`

### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat: add home screen route with 5 slices"
git commit -m "fix: correct overlay path for welcome screen"
git commit -m "docs: update typography guide in fonts.yml"
git commit -m "refactor: standardize box coordinates across slices"
```

### Before Every Commit

```bash
npm run validate    # Must pass
npm run manifest    # Update inventory
git status          # Review changes
git add .
git commit -m "..."
git push origin main
```

---

## 📚 Additional Resources

- **Font Implementation:** `UI-SPEC/fonts.yml`
- **Design Tokens:** `UI-SPEC/tokens.yml`
- **Spec Overview:** `UI-SPEC/manifest.json`
- **Validation Script:** `scripts/preflight.js`
- **Manifest Generator:** `scripts/generate-manifest.js`

---

## 🆘 Need Help?

1. Run `npm run validate:verbose` for detailed output
2. Check `preflight-results.json` for specific errors
3. Review this manual's Troubleshooting section
4. Check GitHub Actions logs for CI failures

---

**Version History**
- **1.0.0** (2025-11-04) - Initial operations manual

**Maintained by:** Proxy Team  
**Last Validated:** Run `npm run validate` to check current status

