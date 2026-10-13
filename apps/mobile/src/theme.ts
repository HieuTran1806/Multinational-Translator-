/** Design tokens from the Penpot "02 — Design System" page (values sampled from the rendered board). */
export const colors = {
  olive: '#4F5D3A',
  forest: '#293526',
  earth: '#795548',
  terracotta: '#A65F3B',
  danger: '#A94738',
  sand: '#F3EACD',
  paper: '#FFF9EE',
  charcoal: '#292824',
  stone: '#777268',
  white: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 };

export const font = {
  // "Be Vietnam Pro" is used in the mockups; bundling the font is in the backlog, system font is used meanwhile.
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.forest },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.forest },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.forest },
  body: { fontSize: 15, color: colors.charcoal, lineHeight: 22 },
  caption: { fontSize: 13, color: colors.stone },
};
