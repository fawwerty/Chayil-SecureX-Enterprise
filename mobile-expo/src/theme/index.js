// ═══════════════════════════════════════════════════════════════════════
// CHAYIL SECUREX — MOBILE THEME v5.0 (Deep Space Edition)
// Indigo/Violet · Glassmorphism · Premium Cyber Aesthetics
// ═══════════════════════════════════════════════════════════════════════

export const Colors = {
  // Backgrounds — Deep Space Dark
  bgCanvas:   '#020205',
  bgOverlay:  '#050510',
  bgInset:    '#000000',
  bgSubtle:   '#08081a',
  bgMuted:    '#0c0c2a',
  bgCard:     'rgba(12, 12, 42, 0.85)',
  bgNavy:     '#050510',

  // Brand — Indigo (primary)
  indigo:        '#6366f1',
  indigoLight:   '#818cf8',
  indigoDim:     '#4f46e5',
  indigoGlow:    'rgba(99, 102, 241, 0.15)',
  indigoSubtle:  'rgba(99, 102, 241, 0.08)',
  indigoBorder:  'rgba(99, 102, 241, 0.2)',

  // Brand — Violet (secondary)
  violet:        '#8b5cf6',
  violetLight:   '#a78bfa',
  violetDim:     '#7c3aed',
  violetGlow:    'rgba(139, 92, 246, 0.15)',
  violetSubtle:  'rgba(139, 92, 246, 0.08)',
  violetBorder:  'rgba(139, 92, 246, 0.2)',

  // Text — Ultra-crisp Hierarchy
  fgDefault:   '#f8fafc', // Slate 50
  fgMuted:     '#94a3b8', // Slate 400
  fgSubtle:    '#64748b', // Slate 500
  fgDim:       '#475569', // Slate 600
  fgOnEmphasis:'#ffffff',

  // Borders
  borderDefault:  'rgba(255, 255, 255, 0.08)',
  borderMuted:    'rgba(255, 255, 255, 0.05)',
  borderEmphasis: 'rgba(255, 255, 255, 0.15)',

  // Status
  success: '#10b981', // Emerald 500
  danger:  '#ef4444', // Red 500
  warning: '#f59e0b', // Amber 500
  info:    '#3b82f6', // Blue 500
  done:    '#8b5cf6', // Violet 500

  // Legacy Aliases (mapped to new palette for compat)
  primary:     '#6366f1',
  secondary:   '#8b5cf6',
  brand:       '#6366f1',
  cyan:        '#6366f1', // Replaced
  gold:        '#8b5cf6', // Replaced
  teal:        '#6366f1', // Replaced
  text:        '#f8fafc',
  textMuted:   '#94a3b8',
  border:      'rgba(255, 255, 255, 0.08)',
  bgVoid:      '#020205',
  bgSurface:   '#050510',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const Radii = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  full: 999,
};

export const FontSize = {
  xs:  10,
  sm:  11,
  base:12,
  md:  13,
  lg:  14,
  xl:  16,
  '2xl':18,
  '3xl':20,
  '4xl':24,
  '5xl':28,
  '6xl':32,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  violetGlow: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '900', letterSpacing: -1.2, color: Colors.fgDefault },
  h2: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8, color: Colors.fgDefault },
  h3: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, color: Colors.fgDefault },
  h4: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, color: Colors.fgDefault },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 22, color: Colors.fgMuted },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 20, color: Colors.fgMuted },
  caption: { fontSize: 12, fontWeight: '500', color: Colors.fgSubtle },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1.0, textTransform: 'uppercase', color: Colors.fgSubtle },
  mono: { fontSize: 12, fontFamily: 'monospace', color: Colors.indigo },
};
