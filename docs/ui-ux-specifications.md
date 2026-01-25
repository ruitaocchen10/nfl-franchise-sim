# Cyberpunk UI Theme - NFL Franchise Simulator
## Neon Digital Aesthetic with Sharp Geometry

> **Theme Inspiration**: Raw digital cyberpunk aesthetic with cyan-first color scheme, sharp geometric edges, animated grid backgrounds, and neon glow effects. Think dystopian sports management in a matrix-like digital world where data flows like electricity.

---

## Design Philosophy

This cyberpunk theme creates an immersive digital experience with sharp, aggressive geometry and vibrant neon accents. The **cyan-first** color scheme evokes digital interfaces and holographic displays, while **magenta and purple** add dimension and depth. **Zero border-radius** throughout creates a raw, unpolished digital aesthetic - like looking at pure data streams.

**Core Principles**:
- **Sharp Corners** - All UI elements use `border-radius: 0` for aggressive, geometric feel
- **Cyan Primary** - Cyan is the dominant accent for clarity and digital sophistication
- **Grid Backgrounds** - Subtle animated grids add depth and "matrix" feel
- **Glow Effects** - Neon glows on hover/focus for tactile feedback
- **Gradient Text** - Color gradients on important text for visual hierarchy
- **HSL Color System** - Allows precise transparency and color manipulation

---

## Color Palette

### Primary Cyberpunk Colors (HSL Format)

```css
/* Primary - Cyan (Digital/Tech) */
--cyber-cyan: 185 100% 50%;
/* Usage: Primary buttons, links, focus states, main accents */
/* Example: hsl(var(--cyber-cyan) / 0.2) for 20% opacity background */

/* Secondary - Magenta (Highlights) */
--cyber-magenta: 320 100% 60%;
/* Usage: Secondary buttons, badges, special highlights */

/* Accent - Purple (Special Elements) */
--cyber-purple: 270 100% 65%;
/* Usage: Icons, tertiary actions, decorative elements */

/* Warning/Highlight - Yellow */
--cyber-yellow: 55 100% 55%;
/* Usage: Warnings, "TODAY" indicators, attention grabbers */

/* Error - Red (Error States Only) */
--cyber-red: 353 100% 59%;
/* Usage: Error messages, destructive actions ONLY */
```

### Dark Backgrounds

```css
--bg-darkest: #060810;    /* Page background */
--bg-dark: #0a0e1a;       /* Main sections */
--bg-medium: #0f1419;     /* Cards, panels */
--bg-light: #1a2332;      /* Elevated surfaces */

/* HSL Versions for Transparency */
--bg-darkest-hsl: 228 30% 5%;
--bg-dark-hsl: 228 35% 7%;
--bg-medium-hsl: 215 30% 9%;
--bg-light-hsl: 214 24% 15%;
```

### Text Colors

```css
--text-primary: #ffffff;    /* Headings, important text */
--text-secondary: #b8c5d6;  /* Body text */
--text-tertiary: #6b7a8f;   /* Captions, metadata */
--text-muted: #4a5568;      /* Disabled, very subtle */
```

### Status Colors

```css
--success: #00ff88;   /* Wins, positive stats */
--warning: #ffaa00;   /* Cautions, medium alerts */
--error: #ff2943;     /* Losses, critical errors */
--info: #00d9ff;      /* Info, neutral stats */
```

---

## Typography

### Font Families

```css
/* Display & Headings - Futuristic, Bold */
--font-display: "Rajdhani", "Orbitron", "Saira Condensed", sans-serif;

/* Body Text - Clean, Readable */
--font-body: "Inter", "Roboto", system-ui, sans-serif;

/* Monospace - Stats, Numbers, Labels, Badges */
--font-mono: "JetBrains Mono", "Roboto Mono", "Courier New", monospace;
```

### Typography Usage

```css
/* Hero Heading - With Gradient */
h1 {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    hsl(var(--cyber-cyan)) 50%,
    hsl(var(--cyber-magenta)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Section Headings */
h2 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Card Headings */
h3 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-primary);
}

/* Body Text */
p {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Stats & Numbers */
.stat {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 36px;
  color: hsl(var(--cyber-cyan));
}

/* Labels & Badges */
.label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--cyber-cyan));
}
```

---

## Component Styles

### Cyber Panel (Base Container)

**Sharp corners, glowing borders, optional grid background**

```css
.cyber-panel {
  position: relative;
  background: var(--bg-medium);
  border: 1px solid var(--border-default);
  border-radius: 0; /* SHARP CORNERS */
  box-shadow:
    0 0 20px -5px hsl(var(--cyber-cyan) / 0.2),
    inset 0 1px 0 0 hsl(var(--cyber-cyan) / 0.1);
  padding: 24px;
}

/* Gradient overlay */
.cyber-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    hsl(var(--cyber-cyan) / 0.1) 0%,
    transparent 50%,
    hsl(var(--cyber-magenta) / 0.05) 100%
  );
}

/* Animated grid background */
.cyber-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.2;
  background-image:
    linear-gradient(hsl(var(--cyber-cyan) / 0.1) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--cyber-cyan) / 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black 20%,
    black 80%,
    transparent
  );
}
```

### Buttons

**Sharp corners, neon glows, shimmer hover effects**

```css
/* Primary Button - Cyan */
.cyber-button {
  position: relative;
  overflow: hidden;
  padding: 12px 24px;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: hsl(var(--cyber-cyan) / 0.2);
  color: hsl(var(--cyber-cyan));
  border: 1px solid hsl(var(--cyber-cyan) / 0.5);
  border-radius: 0; /* SHARP CORNERS */
  cursor: pointer;
  transition: all 0.2s ease;
}

.cyber-button:hover {
  background: hsl(var(--cyber-cyan) / 0.3);
  box-shadow: 0 0 20px -5px hsl(var(--cyber-cyan) / 0.5);
}

/* Shimmer effect */
.cyber-button::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  background: linear-gradient(
    90deg,
    transparent,
    hsl(var(--cyber-cyan) / 0.2),
    transparent
  );
  transition: opacity 0.2s ease;
}

.cyber-button:hover::before {
  opacity: 1;
  animation: shimmer 1s ease-in-out;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Secondary Button - Magenta */
.cyber-button-secondary {
  background: hsl(var(--cyber-magenta) / 0.2);
  color: hsl(var(--cyber-magenta));
  border-color: hsl(var(--cyber-magenta) / 0.5);
}

.cyber-button-secondary:hover {
  background: hsl(var(--cyber-magenta) / 0.3);
  box-shadow: 0 0 20px -5px hsl(var(--cyber-magenta) / 0.5);
}

/* Accent Button - Purple */
.cyber-button-accent {
  background: hsl(var(--cyber-purple) / 0.2);
  color: hsl(var(--cyber-purple));
  border-color: hsl(var(--cyber-purple) / 0.5);
}

.cyber-button-accent:hover {
  background: hsl(var(--cyber-purple) / 0.3);
  box-shadow: 0 0 20px -5px hsl(var(--cyber-purple) / 0.5);
}
```

### Badges

**Sharp corners, monospace font, pulsing animation for emphasis**

```css
.cyber-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: hsl(var(--cyber-cyan) / 0.2);
  color: hsl(var(--cyber-cyan));
  border: 1px solid hsl(var(--cyber-cyan) / 0.3);
  border-radius: 0; /* SHARP CORNERS */
}

.cyber-badge-secondary {
  background: hsl(var(--cyber-magenta) / 0.2);
  color: hsl(var(--cyber-magenta));
  border-color: hsl(var(--cyber-magenta) / 0.3);
}

.cyber-badge-yellow {
  background: hsl(var(--cyber-yellow) / 0.2);
  color: hsl(var(--cyber-yellow));
  border-color: hsl(var(--cyber-yellow) / 0.3);
  animation: pulse-glow-badge 2s ease-in-out infinite;
}

@keyframes pulse-glow-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Input Fields

**Sharp corners, cyan glow on focus, monospace font**

```css
.cyber-input {
  width: 100%;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  background: var(--bg-light);
  border: 1px solid var(--border-default);
  border-radius: 0; /* SHARP CORNERS */
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.cyber-input:focus {
  outline: none;
  border-color: hsl(var(--cyber-cyan));
  box-shadow: 0 0 0 3px hsl(var(--cyber-cyan) / 0.2);
}

.cyber-input::placeholder {
  color: var(--text-muted);
}

/* Label */
.cyber-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--cyber-cyan));
  margin-bottom: 8px;
}

/* Error State */
.cyber-input-error {
  border-color: hsl(var(--cyber-red));
}

.cyber-input-error:focus {
  box-shadow: 0 0 0 3px hsl(var(--cyber-red) / 0.2);
}
```

### Modals

**Sharp corners, grid background, cyan glow, blurred backdrop**

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 16, 0.9);
  backdrop-filter: blur(12px);
}

/* Modal Container */
.modal {
  position: relative;
  width: 90%;
  max-width: 600px;
  background: var(--bg-medium);
  border: 1px solid var(--border-default);
  border-radius: 0; /* SHARP CORNERS */
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.8),
    0 0 60px hsl(var(--cyber-cyan) / 0.2);
}

/* Modal Header */
.modal-header {
  padding: 24px;
  background: var(--bg-light);
  border-bottom: 1px solid transparent;
  background-image: linear-gradient(
    90deg,
    hsl(var(--cyber-cyan) / 0.5) 0%,
    transparent 100%
  );
  background-size: 100% 1px;
  background-position: bottom;
  background-repeat: no-repeat;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}
```

---

## Visual Effects

### Gradient Text

**Cyan to Magenta gradient for hero elements**

```css
.cyber-date-main {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    hsl(var(--cyber-cyan)) 50%,
    hsl(var(--cyber-magenta)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Glow Effects

```css
/* Cyan Glow */
.glow-cyan {
  box-shadow:
    0 0 15px hsl(var(--cyber-cyan) / 0.4),
    0 0 30px hsl(var(--cyber-cyan) / 0.2);
}

/* Magenta Glow */
.glow-magenta {
  box-shadow:
    0 0 15px hsl(var(--cyber-magenta) / 0.4),
    0 0 30px hsl(var(--cyber-magenta) / 0.2);
}

/* Purple Glow */
.glow-purple {
  box-shadow:
    0 0 15px hsl(var(--cyber-purple) / 0.4),
    0 0 30px hsl(var(--cyber-purple) / 0.2);
}

/* Pulsing Glow Animation */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow:
      0 0 20px hsl(var(--cyber-cyan) / 0.4),
      0 0 40px hsl(var(--cyber-cyan) / 0.2);
  }
  50% {
    box-shadow:
      0 0 30px hsl(var(--cyber-cyan) / 0.6),
      0 0 60px hsl(var(--cyber-cyan) / 0.3);
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Scanline Effect (Optional)

**Retro CRT scanline animation**

```css
.cyber-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    var(--text-primary) 2px,
    var(--text-primary) 4px
  );
  animation: scanline-move 8s linear infinite;
}

@keyframes scanline-move {
  0% { transform: translateY(0); }
  100% { transform: translateY(20px); }
}
```

---

## Animations

### Core Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Shimmer (Button Hover) */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

---

## Spacing System

```css
/* 4px Base Grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
```

---

## Utility Classes

### Text Colors

```css
.text-cyber-cyan { color: hsl(var(--cyber-cyan)); }
.text-cyber-magenta { color: hsl(var(--cyber-magenta)); }
.text-cyber-purple { color: hsl(var(--cyber-purple)); }
.text-cyber-yellow { color: hsl(var(--cyber-yellow)); }
```

### Background Colors

```css
.bg-cyber-cyan-20 { background-color: hsl(var(--cyber-cyan) / 0.2); }
.bg-cyber-magenta-20 { background-color: hsl(var(--cyber-magenta) / 0.2); }
.bg-cyber-purple-20 { background-color: hsl(var(--cyber-purple) / 0.2); }
```

### Border Colors

```css
.border-cyber-cyan-50 { border-color: hsl(var(--cyber-cyan) / 0.5); }
.border-cyber-magenta-50 { border-color: hsl(var(--cyber-magenta) / 0.5); }
.border-cyber-purple-50 { border-color: hsl(var(--cyber-purple) / 0.5); }
```

---

## Accessibility

```css
/* Focus States - Cyan Ring */
*:focus-visible {
  outline: 2px solid hsl(var(--cyber-cyan));
  outline-offset: 2px;
  box-shadow: 0 0 0 4px hsl(var(--cyber-cyan) / 0.1);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  :root {
    --text-6xl: 40px;
    --text-5xl: 32px;
    --text-4xl: 28px;
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Adjust grid layouts */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full 12-column grid */
}
```

---

## Key Differences from Traditional Cyberpunk

1. **Cyan-First, Not Red** - Cyan is the primary accent (not red)
2. **Sharp Corners Everywhere** - `border-radius: 0` for aggressive geometry
3. **Grid Backgrounds** - Animated matrix-style grids on panels
4. **HSL Color System** - Allows precise transparency control
5. **Shimmer Effects** - Sliding gradient on button hover
6. **Gradient Text** - Cyan to Magenta gradients on hero elements
7. **Tri-Color Harmony** - Cyan/Magenta/Purple work together
8. **Monospace Labels** - All badges/labels use monospace fonts

---

## Implementation Checklist

- [x] Install fonts (Rajdhani, Inter, JetBrains Mono)
- [x] Set up HSL color variables
- [x] Create cyber-panel base component
- [x] Build cyber-button with shimmer effect
- [x] Add cyber-badge variants
- [x] Implement grid backgrounds
- [x] Add glow utilities
- [x] Test sharp corners throughout
- [x] Verify gradient text rendering
- [x] Ensure cyan focus states
- [x] Test accessibility (WCAG AA)
- [x] Verify responsive behavior

---

**This cyberpunk theme is raw, digital, and unapologetically geometric - like pure data visualized in neon.**
