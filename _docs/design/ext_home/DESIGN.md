---
name: Cupertino Clarity
colors:
  surface: '#faf8fe'
  surface-dim: '#dad9df'
  surface-bright: '#faf8fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf3'
  surface-container-high: '#e9e7ed'
  surface-container-highest: '#e3e2e7'
  on-surface: '#1a1b1f'
  on-surface-variant: '#414753'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#717785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005cbb'
  primary: '#0059b5'
  on-primary: '#ffffff'
  primary-container: '#0071e3'
  on-primary-container: '#fcfbff'
  inverse-primary: '#abc7ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#5f31e8'
  on-tertiary: '#ffffff'
  tertiary-container: '#7952ff'
  on-tertiary-container: '#fff9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#abc7ff'
  on-primary-fixed: '#001b3f'
  on-primary-fixed-variant: '#00458f'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#cbbeff'
  on-tertiary-fixed: '#1d0061'
  on-tertiary-fixed-variant: '#4a00d4'
  background: '#faf8fe'
  on-background: '#1a1b1f'
  surface-variant: '#e3e2e7'
  canvas-base: '#F6F6F7'
  surface-glass: rgba(255, 255, 255, 0.72)
  surface-glass-hover: rgba(255, 255, 255, 0.84)
  surface-glass-active: rgba(255, 255, 255, 0.94)
  text-primary: '#1D1D1F'
  text-secondary: '#86868B'
  border-subtle: rgba(0, 0, 0, 0.08)
  border-specular: rgba(255, 255, 255, 0.65)
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.008em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 15px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.02em
  code-kbd:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system channels the refined, tactile minimalism of modern desktop operating systems into a lightweight browser start environment. Tailored for knowledge workers, developers, and interface purists, it turns the new-tab canvas into an uncluttered sanctuary for daily workflow initiation.

The design movement synthesizes **macOS Glassmorphism** with **High-Caliber Minimalist Utility**:
- **Atmospheric Transparency:** Surface materials rely heavily on translucent backdrop filters and diffuse soft-focus luminance, blending seamlessly against dynamic desktop wallpapers or pristine warm off-whites.
- **Micro-Precision Engineering:** Clean hairline divisions, subtle specular highlights, and optical metric typography inspired by Cupertino's human interface principles.
- **Distraction-Free Focus:** High contrast readability where it matters, backed by neutral gray low-noise peripheral controls.

## Colors

The color palette centers on warm Apple off-white surfaces, high-legibility dark charcoal typography, and surgical injections of macOS system blue.

- **Primary (`#0071E3`)**: System action blue. Anchors primary CTAs, active segmented controls, tab indicators, and interactive highlights.
- **Secondary (`#2563EB`)**: Slate-leaning cobalt for auxiliary links, focus rings, and badge accents.
- **Tertiary (`#5D2DE6`)**: Deep electric violet reserved for special productivity states, pro features, or integrated tooling indicators.
- **Neutral (`#86868B`)**: Apple standard secondary label neutral for metadata, inactive controls, icons, and keyboard shortcut glyphs.
- **Canvas & Surface Architecture**: The canvas rests on `#F6F6F7`, while elevated floating panels use `rgba(255, 255, 255, 0.72)` coupled with hardware-accelerated blur. Hairline outer boundaries utilize `rgba(0, 0, 0, 0.08)` to simulate native window edges.

## Typography

The typography scale utilizes **Geist** for crisp, geometric headers reminiscent of precision display interfaces, paired with **Inter** for optical clarity in body and navigation states. **JetBrains Mono** provides technical definition for hotkeys, shortcuts, and clock metrics.

- All body text scales are kept compact and balanced to emulate native macOS desktop application typography.
- Negative letter-spacing is applied systematically across titles to create a confident, high-density presentation.
- Keyboard shortcuts and quick-action tokens leverage `code-kbd` with dedicated structural backing to simulate physical chiclet caps.

## Layout & Spacing

This design system operates on an 8-point base rhythm, optimized for an intentional viewport layout rather than indefinite scrolling.

- **Grid Architecture**: The canvas centers content within a max-width container (`1200px`) using dynamic margins. Quick-launch shortcuts and widget displays use an auto-fitting CSS grid with a fixed `1rem` column gutter.
- **Dock & Floating Regions**: Top utility bars and the bottom application dock float over the base layer, retaining fixed `2rem` offsets from the viewport edges on desktop displays, stepping down to `1rem` on narrow screens.
- **Density Control**: Padding within components adheres strictly to standard Apple UI dimensions (buttons at `space-xs` vertical by `space-md` horizontal; glass widgets at `space-lg` padding).

## Elevation & Depth

Visual hierarchy does not rely on opaque stacking or harsh drop shadows. Instead, it relies on layered refraction, physical border simulation, and ambient environmental scattering:

1. **Backdrop Filtration**: Elevated containers implement `backdrop-filter: blur(24px) saturate(180%)`, diffusing whatever background or wallpaper exists behind them while maintaining contrast.
2. **Double-Border System (Specular Rim)**:
   - Outer Rim: `1px solid rgba(0, 0, 0, 0.08)` ensures crisp edge separation against light fields.
   - Inner Specular Inset: `inset 0 1px 0 0 rgba(255, 255, 255, 0.65)` produces the signature glass bevel highlight along top borders.
3. **Ambient Shadows**:
   - **Level 1 (Dock / Tile)**: `0 2px 8px -1px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)`
   - **Level 2 (Active Modal / Palette)**: `0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)`
   - Shadows are tinted neutral and diffused over large radii to prevent dirty edges.

## Shapes

The interface embraces modern macOS continuous corner curvature (squircle-like visuals):

- Standard interactive controls (buttons, input fields, shortcut tiles) utilize `0.5rem` (`roundedness: 2`).
- Modular panels, cards, and modal windows scale upward to `rounded-lg` (`1rem`) and `rounded-xl` (`1.5rem`) to maintain proportional contour cohesion.
- Segmented pills, dock containers, and tag pills utilize full radius encapsulation (`rounded-full` / 9999px).

## Components

### Buttons
- **Primary**: Solid macOS blue (`#0071E3`), pure white text, subtle top-edge highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.2)`). Height: 32px.
- **Secondary / Glass**: Background `rgba(0, 0, 0, 0.04)`, text `#1D1D1F`, border `1px solid rgba(0,0,0,0.06)`. On hover: `rgba(0, 0, 0, 0.08)`.
- **Icon / Ghost**: Fully transparent surface; icon `#86868B`, transitioning to `#1D1D1F` with a soft circle/squircle highlight on hover.

### Quick-Launch Tiles & Cards
- Frosted glass slab (`rgba(255, 255, 255, 0.72)`) with `backdrop-filter: blur(20px)`.
- Hover behavior: Subtle translateY (-2px) with shadow bloom and inner specular intensity boost. No abrupt borders.

### Input Fields & Command Bar
- Command palette bar (Spotlight style): Centered on canvas, 52px height, frosted glass shell, `16px` icon lead, bold minimal placeholder (`#86868B`).
- Standard inputs: 34px height, background `rgba(0, 0, 0, 0.03)`, subtle border `rgba(0, 0, 0, 0.1)`. Focus brings a crisp `0 0 0 3px rgba(0, 113, 227, 0.25)` halo.

### Segmented Controls & Chips
- Embedded tray with `rgba(0, 0, 0, 0.05)` fill and `6px` internal padding. Active segment displays as a crisp white floating pill with Level 1 micro-shadow.

### Checkboxes & Switches
- **Switches**: 28px width, 18px height. Inactive: `#E5E5EA`. Active: `#34C759` or `#0071E3`. Internal toggle thumb uses pure `#FFFFFF` with slight down-shadow.
- **Checkboxes**: 16x16px, `4px` corner radius, centered hairline SVG checkmark.

### Keyboard Badges (`Kbd`)
- Minimalist hardware chiclets: `fontFamily: JetBrains Mono`, border `1px solid rgba(0, 0, 0, 0.1)`, bottom border `2px solid rgba(0, 0, 0, 0.15)`, background `#FFFFFF`, text `#86868B`.