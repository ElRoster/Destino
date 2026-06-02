// Shared UI Design Tokens for Tarot Platform

export const themeTokens = {
  colors: {
    // Elegant deep purple and indigo theme representing tarot mysticism
    background: {
      deep: '#0c0517',      // Abyss dark
      card: '#160b29',      // Rich purple-slate card
      cardHover: '#21123d', // Card hover state
    },
    primary: {
      light: '#a855f7',     // Bright violet
      base: '#8b5cf6',      // Purple
      dark: '#7c3aed',      // Deep purple
    },
    accent: {
      gold: '#f59e0b',      // Mystical gold/amber
      rose: '#f43f5e',      // Rose quartz
      teal: '#14b8a6',      // Teal highlight
    },
    text: {
      primary: '#f3f4f6',   // High contrast white
      secondary: '#9ca3af', // Gray text
      muted: '#6b7280',     // Dark gray text
    }
  },
  animations: {
    hoverScale: 'transition-transform duration-200 ease-in-out hover:scale-105',
    glowPrimary: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    glowGold: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  }
};
