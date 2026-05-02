---
name: Cinema Premium
colors:
  surface: '#16130b'
  surface-dim: '#16130b'
  surface-bright: '#3d392f'
  surface-container-lowest: '#110e07'
  surface-container-low: '#1f1b13'
  surface-container: '#231f17'
  surface-container-high: '#2d2a21'
  surface-container-highest: '#38342b'
  on-surface: '#eae1d4'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#eae1d4'
  inverse-on-surface: '#343027'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c6c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#bfcdff'
  on-tertiary: '#082b72'
  tertiary-container: '#97b0ff'
  on-tertiary-container: '#254188'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#27438a'
  background: '#16130b'
  on-background: '#eae1d4'
  surface-variant: '#38342b'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is engineered to evoke the atmosphere of a high-end private screening room. The brand personality is prestigious, exclusive, and cinematic, prioritizing content through a sophisticated "Lights Down" aesthetic.

The design style follows a **Minimalist-Modern** approach with high-contrast elements. It leverages heavy whitespace (or "dark space") to create a sense of luxury. Visual interest is generated through precise typography and the strategic use of gold accents to represent the "golden age" of cinema in a contemporary digital context. The interface remains professional and structured, ensuring that the user journey—from film selection to checkout—is seamless and dignified.

## Colors

The palette is anchored in a deep charcoal background to minimize eye strain and maximize the vibrance of film posters and video content. 

- **Primary Gold (#D4AF37):** Reserved strictly for primary call-to-actions, active states, and premium highlights. It represents value and exclusivity.
- **Silk Grey (#E0E0E0):** Used for secondary information and supporting text to maintain a clear hierarchy without competing with the primary content.
- **Pure White (#FFFFFF):** Used for headlines and critical UI labels to ensure maximum legibility against the dark canvas.
- **Surface Tones:** A slightly lighter charcoal (#1E1E1E) is used for cards and containers to create subtle depth.

All color combinations are tested to meet WCAG 2.2 AA standards, ensuring a minimum contrast ratio of 4.5:1 for text and 3:1 for UI components.

## Typography

The typography system pairs the timeless elegance of **Noto Serif** with the functional precision of **Inter**. 

Headlines use Noto Serif to establish a literary and authoritative tone, reminiscent of classic film billing. UI elements, navigation, and body copy utilize Inter to ensure high readability at smaller sizes, particularly in technical areas like seat selection or administrative tables. 

A specialized "Label-Caps" style is used for overlines and category tags, utilizing increased letter spacing to enhance the premium feel.

## Layout & Spacing

The design system employs a **Fixed Grid** model for desktop views, centering content within a 1280px container to maintain a controlled, gallery-like presentation. 

The spacing rhythm is built on an 8px base unit. Generous internal padding (md: 24px) within cards and sections prevents the interface from feeling cluttered. Administrative tables use a more condensed vertical rhythm (xs: 4px / sm: 12px) to allow for data density while maintaining clear horizontal scanning lines.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional drop shadows. By using varying shades of charcoal, the system creates a "stacked" hierarchy that feels architectural.

- **Level 0 (Base):** #121212 - The main canvas.
- **Level 1 (Surface):** #1E1E1E - Used for cards and secondary navigation bars.
- **Level 2 (Elevated):** #282828 - Used for hover states on cards or dropdown menus.

When high-contrast separation is required, a **Low-Contrast Outline** (#2C2C2C) is applied to define boundaries without introducing the visual noise of heavy shadows.

## Shapes

To maintain a structured and professional appearance, the system utilizes **Subtle Roundedness**. 

Standard components like buttons, input fields, and cards use a 4px (Soft) radius. This provides just enough softness to feel contemporary while retaining the sharp, precise lines associated with high-end luxury branding. Larger containers or feature banners may use up to 8px to subtly differentiate them from smaller UI elements.

## Components

### Buttons
- **Primary:** Solid #D4AF37 background with black text for maximum contrast. 4px border-radius.
- **Secondary:** Transparent background with a 1px #E0E0E0 border and white text.
- **Ghost:** White text with no border, used for low-priority actions.

### Cards
High-contrast containers using the #1E1E1E surface color. Cards for movie posters should feature a subtle gradient overlay at the bottom to ensure title legibility.

### Inputs & Selects
Sleek, dark backgrounds (#121212) with a 1px border (#2C2C2C). On focus, the border transitions to #D4AF37. Labels use the "Label-Caps" typography style sitting above the field.

### Checkout Stepper
A minimalist horizontal line with numbered nodes. Completed steps are highlighted in Gold, current steps use a white ring, and upcoming steps are Silk Grey.

### Administrative Tables
Clean, borderless rows with a subtle #1E1E1E hover state. Header cells use "Label-Caps" for clear categorization. High-contrast text ensures data is legible even in low-light environments.

### Additional Components
- **Booking Progress Bar:** A thin gold line at the top of the viewport to track session timeout.
- **Availability Badges:** Small, high-contrast chips for "Sold Out" or "Filling Fast" status.