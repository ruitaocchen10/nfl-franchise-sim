# Cyberpunk UI Theme - NFL Franchise Simulator

## Dark Dystopian Gaming Aesthetic

> **Theme Inspiration**: Dark, futuristic, cyberpunk aesthetic with red accent lighting, navy/black backgrounds, and cyan highlights. Think dystopian sports management in a neon-lit digital world.

---

## Color Palette

### Primary Colors

```css
/* Dark Backgrounds */
--bg-darkest: #060810; /* Page background */
--bg-dark: #0a0e1a; /* Main sections */
--bg-medium: #0f1419; /* Cards, containers */
--bg-light: #1a2332; /* Elevated surfaces */
--bg-lighter: #1f2937; /* Hover states */

/* Accent Colors */
--accent-red: #ff2943; /* Primary CTAs, danger, highlights */
--accent-red-dark: #d91f38; /* Red hover states */
--accent-red-bright: #ff3d5c; /* Bright red for emphasis */
--accent-cyan: #00d9ff; /* Links, info, secondary actions */
--accent-cyan-dark: #00b8d9; /* Cyan hover */
--accent-orange: #ff6b35; /* Warnings, tertiary actions */
--accent-purple: #a855f7; /* Special highlights */

/* Status Colors */
--success: #00ff88; /* Wins, positive stats */
--warning: #ffaa00; /* Cautions, medium alerts */
--error: #ff2943; /* Losses, errors */
--info: #00d9ff; /* Info, neutral stats */

/* Text Colors */
--text-primary: #ffffff; /* Headings, important text */
--text-secondary: #b8c5d6; /* Body text */
--text-tertiary: #6b7a8f; /* Captions, metadata */
--text-muted: #4a5568; /* Disabled, very subtle */
--text-accent: #ff2943; /* Highlighted text */

/* Borders */
--border-default: #2a3441; /* Standard borders */
--border-bright: #3d4d61; /* Hover borders */
--border-accent: #ff2943; /* Active/focus borders */

/* Special Effects */
--glow-red: rgba(255, 41, 67, 0.4);
--glow-cyan: rgba(0, 217, 255, 0.3);
--shadow-dark: rgba(0, 0, 0, 0.6);
```

---

## Typography

### Font Families

```css
/* Display & Headings - Futuristic, Bold */
--font-display: "Rajdhani", "Orbitron", "Saira Condensed", sans-serif;

/* Body Text - Clean, Readable */
--font-body: "Inter", "Roboto", system-ui, sans-serif;

/* Monospace - Stats, Numbers, Code */
--font-mono: "JetBrains Mono", "Roboto Mono", "Courier New", monospace;
```

### Font Sizes & Weights

```css
/* Display Text */
--text-6xl: 56px; /* Hero headings */
--text-5xl: 48px; /* Page titles */
--text-4xl: 36px; /* Section headers */
--text-3xl: 32px; /* Large headings */
--text-2xl: 24px; /* Subheadings */
--text-xl: 20px; /* Card titles */

/* Body Text */
--text-lg: 18px; /* Large body */
--text-base: 16px; /* Standard body */
--text-sm: 14px; /* Small body */
--text-xs: 12px; /* Captions */
--text-2xs: 11px; /* Fine print */

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
--font-black: 900;
```

### Typography Usage

```css
/* Display Headings */
h1,
.display-1 {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  text-shadow: 0 0 20px var(--glow-red);
}

/* Section Headings */
h2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

/* Card/Component Headings */
h3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* Body Text */
p,
.body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Stats & Numbers */
.stat,
.number {
  font-family: var(--font-mono);
  font-weight: var(--font-bold);
  color: var(--text-primary);
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
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

---

## Component Styles

### Buttons

```css
/* Primary Button (Red Accent) */
.btn-primary {
  background: linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  box-shadow:
    0 4px 12px rgba(255, 41, 67, 0.3),
    0 0 20px rgba(255, 41, 67, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 16px rgba(255, 41, 67, 0.4),
    0 0 30px rgba(255, 41, 67, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button (Cyan Accent) */
.btn-secondary {
  background: transparent;
  color: #00d9ff;
  border: 2px solid #00d9ff;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(0, 217, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  padding: 10px 20px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  border-color: var(--border-bright);
  color: var(--text-primary);
  background: var(--bg-light);
}

/* Danger Button */
.btn-danger {
  background: var(--bg-medium);
  color: var(--error);
  border: 1px solid var(--error);
  padding: 10px 24px;
  border-radius: 8px;
}

.btn-danger:hover {
  background: rgba(255, 41, 67, 0.1);
  box-shadow: 0 0 15px rgba(255, 41, 67, 0.2);
}
```

### Cards

```css
/* Standard Card */
.card {
  background: var(--bg-medium);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-bright);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

/* Glowing Card (Featured) */
.card-glow {
  background: linear-gradient(135deg, #1a2332 0%, #1f2937 100%);
  border: 1px solid var(--accent-red);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 0 30px var(--glow-red);
}

/* Card with Header */
.card-header {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-default);
  padding: var(--space-4) var(--space-6);
  border-radius: 12px 12px 0 0;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.08em;
}
```

### Inputs & Forms

```css
/* Text Input */
.input {
  background: var(--bg-light);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.1);
}

.input::placeholder {
  color: var(--text-muted);
}

/* Select Dropdown */
.select {
  background: var(--bg-light);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 12px 40px 12px 16px;
  color: var(--text-primary);
  cursor: pointer;
}

/* Checkbox/Radio (Custom) */
.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-default);
  border-radius: 4px;
  background: var(--bg-light);
  transition: all 0.2s ease;
}

.checkbox:checked {
  background: var(--accent-red);
  border-color: var(--accent-red);
  box-shadow: 0 0 10px var(--glow-red);
}
```

### Tables

```css
/* Table Container */
.table-container {
  background: var(--bg-medium);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}

/* Table Header */
.table-header {
  background: var(--bg-light);
  border-bottom: 2px solid var(--border-bright);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
}

/* Table Row */
.table-row {
  border-bottom: 1px solid var(--border-default);
  transition: background 0.2s ease;
}

.table-row:hover {
  background: var(--bg-light);
}

/* Table Cell */
.table-cell {
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: 14px;
}

/* Stat Cell (Numbers) */
.table-cell-stat {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
}
```

### Badges & Pills

```css
/* Status Badge */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: rgba(0, 255, 136, 0.15);
  color: var(--success);
  border: 1px solid var(--success);
}

.badge-warning {
  background: rgba(255, 170, 0, 0.15);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.badge-error {
  background: rgba(255, 41, 67, 0.15);
  color: var(--error);
  border: 1px solid var(--error);
}

.badge-info {
  background: rgba(0, 217, 255, 0.15);
  color: var(--info);
  border: 1px solid var(--info);
}
```

### Modals

```css
/* Modal Backdrop */
.modal-backdrop {
  background: rgba(6, 8, 16, 0.8);
  backdrop-filter: blur(8px);
}

/* Modal Container */
.modal {
  background: var(--bg-medium);
  border: 1px solid var(--border-bright);
  border-radius: 16px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(255, 41, 67, 0.15);
  max-width: 600px;
  width: 90%;
}

/* Modal Header */
.modal-header {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-default);
  padding: var(--space-6);
  border-radius: 16px 16px 0 0;
}

/* Modal Title */
.modal-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
}
```

---

## Visual Effects & Animations

### Glows

```css
/* Red Glow */
.glow-red {
  box-shadow:
    0 0 20px rgba(255, 41, 67, 0.4),
    0 0 40px rgba(255, 41, 67, 0.2),
    0 0 60px rgba(255, 41, 67, 0.1);
}

/* Cyan Glow */
.glow-cyan {
  box-shadow:
    0 0 15px rgba(0, 217, 255, 0.4),
    0 0 30px rgba(0, 217, 255, 0.2);
}

/* Pulsing Glow Animation */
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(255, 41, 67, 0.4),
      0 0 40px rgba(255, 41, 67, 0.2);
  }
  50% {
    box-shadow:
      0 0 30px rgba(255, 41, 67, 0.6),
      0 0 60px rgba(255, 41, 67, 0.3);
  }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Gradients

```css
/* Background Gradient */
.bg-gradient {
  background: linear-gradient(135deg, #060810 0%, #0f1419 50%, #0a0e1a 100%);
}

/* Card Gradient */
.bg-card-gradient {
  background: linear-gradient(135deg, #1a2332 0%, #1f2937 100%);
}

/* Red Accent Gradient */
.bg-red-gradient {
  background: linear-gradient(90deg, #ff2943 0%, #ff6b35 100%);
}

/* Cyan Accent Gradient */
.bg-cyan-gradient {
  background: linear-gradient(90deg, #00d9ff 0%, #0099ff 100%);
}

/* Overlay Gradient (for images) */
.overlay-gradient {
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(6, 8, 16, 0.6) 50%,
    rgba(6, 8, 16, 0.9) 100%
  );
}
```

### Animations

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

/* Hover Lift */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
}

/* Scan Line Effect (Optional Cyberpunk Detail) */
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
}

.scanline {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 217, 255, 0.5),
    transparent
  );
  animation: scanline 8s linear infinite;
  pointer-events: none;
  opacity: 0.3;
}
```

---

## Layout Patterns

### Dashboard Grid

```css
/* Main Dashboard Layout */
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
  padding: var(--space-8);
  background: var(--bg-darkest);
}

/* Hero Section */
.dashboard-hero {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #1a2332 0%, #1f2937 100%);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: var(--space-12);
  position: relative;
  overflow: hidden;
}

/* Main Content */
.dashboard-main {
  grid-column: 1 / 9;
}

/* Sidebar */
.dashboard-sidebar {
  grid-column: 9 / -1;
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-main,
  .dashboard-sidebar {
    grid-column: 1 / -1;
  }
}
```

### Card Grids

```css
/* 3-Column Card Grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

/* 2-Column Stat Grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
```

---

## Icon Styles

```css
/* Icon Container */
.icon {
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.icon-primary {
  color: var(--accent-red);
}

.icon-secondary {
  color: var(--accent-cyan);
}

/* Icon with Glow */
.icon-glow {
  filter: drop-shadow(0 0 8px currentColor);
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
  .dashboard {
    grid-template-columns: repeat(8, 1fr);
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .dashboard {
    grid-template-columns: repeat(12, 1fr);
  }
}
```

---

## Accessibility

```css
/* Focus States */
*:focus {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
}

/* Focus Visible (Keyboard Only) */
*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
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

## Special UI Elements

### Progress Bars

```css
.progress-bar {
  background: var(--bg-light);
  border-radius: 8px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #ff2943 0%, #ff6b35 100%);
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 0 15px var(--glow-red);
  transition: width 0.3s ease;
}
```

### Dividers

```css
.divider {
  height: 1px;
  background: var(--border-default);
  margin: var(--space-8) 0;
}

.divider-glow {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-red) 50%,
    transparent 100%
  );
  box-shadow: 0 0 10px var(--glow-red);
}
```

### Loading Spinners

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-light);
  border-top-color: var(--accent-red);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 0 20px var(--glow-red);
}
```

---

## Implementation Notes

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "bg-darkest": "#060810",
        "bg-dark": "#0a0e1a",
        "accent-red": "#ff2943",
        "accent-cyan": "#00d9ff",
        // ... add all colors
      },
      fontFamily: {
        display: ["Rajdhani", "Orbitron", "sans-serif"],
        body: ["Inter", "Roboto", "system-ui"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-red": "0 0 20px rgba(255, 41, 67, 0.4)",
        "glow-cyan": "0 0 15px rgba(0, 217, 255, 0.3)",
      },
    },
  },
};
```

### Next Steps

1. **Install Fonts**: Add Rajdhani, Inter, and JetBrains Mono via Google Fonts or self-host
2. **Update Tailwind**: Extend config with custom colors, shadows, and fonts
3. **Create Base Styles**: Apply theme to globals.css
4. **Build Components**: Start with buttons, cards, and inputs
5. **Test Accessibility**: Ensure contrast ratios meet WCAG AA standards
6. **Add Animations**: Implement glows and transitions
7. **Responsive Testing**: Verify on mobile, tablet, desktop

---

## Design Philosophy

This cyberpunk theme creates a dark, immersive experience that feels like managing a sports franchise in a dystopian digital future. The red accent provides urgency and energy, while the cyan creates technological sophistication. Dark backgrounds reduce eye strain during long sessions, and the futuristic typography reinforces the gaming aesthetic.

**Key Principles**:

- Dark backgrounds for focus and immersion
- Bright accents for important actions and data
- Glows and shadows for depth and hierarchy
- Bold typography for clarity and impact
- Smooth animations for polish and feedback
