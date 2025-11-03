SAVE AS: UI-SPEC/README.md
# Proxy — UI Specification (Pixel-Spec)

This folder is the single source of truth for the Proxy app UI.
It is designed so an AI-assisted coder (Claude Code / Cursor) can read the spec and implement the app pixel-perfect without guesswork.

----------------------------------------------------------------

## 1) Ground rules

- No guessing: every value used in implementation must come from these files.
- Units: px (see meta.yml).
- Color space: sRGB (see meta.yml).
- Breakpoints (portrait): 360 / 393 / 430. This list in meta.yml is the only source of truth. All per-breakpoint boxes and layout values must use exactly these keys.
- Coordinate system: origin top-left; axes x →, y ↓ (see meta.yml).
- This repo contains specification only. Code is generated/maintained elsewhere.

----------------------------------------------------------------

## 2) Files & what they’re for

- meta.yml — Project identity & global invariants
  - project, units, colorSpace, breakpoints, coordSystem.
  - Any file using breakpoints must match this list exactly.

- tokens.yml — Design tokens
  - colors (semantic names with HEX/rgba), typography (families & exact styles: size/line/track/weight),
    spacing (scale), radii, shadows, zIndex.
  - All styles in routes/slices must reference these tokens, not raw values, unless a new token is explicitly added.

- grid.yml — Layout grid
  - container widths per breakpoint, columns count, gutter.
  - Slices may override, but the global grid is the default.

- motion.yml — Motion system
  - defaults { duration, easing, stagger }
  - policy { animatableProps, disallowedProps, prefersReduced }
  - presets (named transitions with from/to, duration, easing, delay, stagger).
  - Respect reduced motion guidance during implementation.

- assets.yml — Asset registry
  - Each asset: { id, type(svg/webp/png/lottie), path, intrinsic:[w,h], notes, sha256? }.
  - Slices only refer to id; do not hardcode file paths in code.

- registry.yml — Route & slice index (screen-level registry)
  - Tells the implementer which routes exist and which slices compose them (reading order).

- routes/<route>/route.yml — Route description
  - Page-level rules (backgrounds, safe areas, route-specific notes).

- routes/<route>/slices.yml — Slice index for that route
  - The ordered list of slices (top to bottom) and where overlay PNGs will be found.

- routes/<route>/slices/<slice>.yml — The heart of the spec (per slice)
    sliceId: "<id>"
    route: "/path"
    overlays: { <bp1>: "overlays/<id>-<bp1>.png", <bp2>: "...", <bp3>: "..." }  # keys MUST match meta.yml breakpoints
    layout:
      container: <px or token>
      columns: 12
      gutter: <px>
      padding: { top:<px>, right:<px>, bottom:<px>, left:<px> }  # per breakpoint if different
    elements:
      - id: "<stable-id>"
        kind: text|button|image|icon|card|chip|input|section|other
        box:
          <bp1>: { x:<px>, y:<px>, w:<px>, h:<px> }
          <bp2>: { ... }
          <bp3>: { ... }
        typeStyle: { family:<token>, weight:<n>, size:<px>, line:<px>, track:<px|em>, transform?: none|uppercase|... }
        colors: { fg:<token|hex>, bg:<token|hex>, border?:<token|hex> }
        borders: { width:<px>, style:<solid|...>, radius:<px or token> }
        shadow: <token or exact>
        spacing: { margin:{t/r/b/l}, padding:{t/r/b/l} }
        content: "<exact text or alt>"
        states:
          hover?:   { colors?, shadow?, transform?, outline?, transition? }
          active?:  { ... }
          focus?:   { ring?: "2px token", offset?: <px> }
          disabled?:{ ... }
          error?:   { ... }
        motion?: { trigger:<load|scroll|hover|focus>, from:{...}, to:{...}, duration:<ms>, easing:<bezier|name>, delay:<ms>, stagger?:<ms> }
        notes?: "<anything special>"
    a11y:
      contrast: ">= 4.5:1 for body text, >= 3:1 for large text"
      keyboard: "all interactive elements focusable; visible focus indicators"
      reducedMotion: "non-critical motion disabled or replaced"
    acceptance:
      breakpoints: [MUST MATCH meta.yml]
      overlayTolerancePercent: 0.00–0.15

----------------------------------------------------------------

## 3) Conventions the implementer MUST follow

- Tokens first: whenever a color/type/spacing/radius/shadow exists in tokens.yml, use the token by name.
  If a new literal appears during a slice spec, stop and decide: new token or alias of an existing one.
- Per-breakpoint boxes: provide {x,y,w,h} for every breakpoint where layout shifts.
- Exact typography: size (px), line-height (px), letter-spacing (px or em), weight, transform. No approximations.
- Motion: use named presets when present; otherwise, explicit duration and easing (cubic-bezier or known name).
- Assets: refer by asset id (from assets.yml). Do not hardcode file paths in components.
- A11y: respect contrast rules, keyboard focus, and reduced motion policy.

----------------------------------------------------------------

## 4) Visual acceptance via overlays

- Each slice defines overlays per breakpoint, pointing to exported PNGs of the Canva layout at 1:1 scale.
- During dev/QA, render the built screen and diff against the overlay.
- The slice’s overlayTolerancePercent defines allowed deviation for pixel-diff tooling.
- If an overlay PNG is missing, the slice cannot be visually accepted. Export it, add the path, and rerun.

----------------------------------------------------------------

## 5) Workflow for AI-assisted implementation (Claude Code / Cursor)

1. Read meta.yml → lock units, color space, and breakpoint keys.
2. Load tokens.yml, grid.yml, motion.yml, assets.yml.
3. For each route in registry.yml:
   - Open routes/<route>/route.yml and slices.yml to get order and context.
   - Implement each routes/<route>/slices/<slice>.yml top to bottom.
4. For every element:
   - Apply per-breakpoint {x,y,w,h} and typesetting exactly as specified.
   - Use semantic tokens wherever defined.
   - Respect motion policy and presets.
5. Run overlay visual diff for each slice/breakpoint and iterate until within tolerance.
6. Do not invent values. If a value is absent, expand the spec here first, then code.

----------------------------------------------------------------

## 6) Known current contents (synced to meta.yml)

- Breakpoints: 360, 393, 430 (portrait), units px, color space sRGB.
- Routes present: at least loading/ and home/ (see registry.yml and per-route folders).
- Assets: icons/logo under UI-SPEC/assets/ and registered in assets.yml.

If you add or rename tokens/assets/routes/slices, update the relevant index files in this folder first.
