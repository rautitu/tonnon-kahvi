/**
 * Dark-first color palette inspired by Discord and GitHub dark themes.
 * Smooth contrasts, elegant feel.
 */

// Accent: a muted teal-blue, works great on dark backgrounds
const accentColor = '#58a6ff'; // GitHub-style blue accent
const accentColorMuted = '#388bfd';

export const Colors = {
  light: {
    // Light mode kept as fallback but app defaults to dark
    text: '#11181C',
    textSecondary: '#656d76',
    background: '#ffffff',
    backgroundSecondary: '#f6f8fa',
    surface: '#ffffff',
    surfaceHover: '#f3f4f6',
    border: '#d0d7de',
    tint: accentColorMuted,
    icon: '#656d76',
    tabIconDefault: '#656d76',
    tabIconSelected: accentColorMuted,
    tabBarBackground: '#ffffff',
    headerBackground: '#f6f8fa',
  },
  dark: {
    text: '#e6edf3',               // GitHub dark text — soft white, easy on eyes
    textSecondary: '#8b949e',       // Muted secondary text
    background: '#0d1117',          // GitHub dark background — deep, rich black
    backgroundSecondary: '#161b22', // Slightly lighter for layering
    surface: '#161b22',             // Card/surface background
    surfaceHover: '#1c2128',        // Hover states
    border: '#30363d',              // Subtle borders
    tint: accentColor,              // Primary accent
    icon: '#8b949e',                // Muted icons
    tabIconDefault: '#484f58',      // Inactive tab icons
    tabIconSelected: accentColor,   // Active tab icon
    tabBarBackground: '#010409',    // Tab bar — darkest layer
    headerBackground: '#161b22',    // Header sections
  },
};
