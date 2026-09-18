/**
 * Design Tokens — JavaScript counterpart to globals.css
 * Keep in sync with CSS variables. Useful for JS-driven styles, charts, etc.
 */

export const tokens = {
  color: {
    background: "var(--background)",
    foreground: "var(--foreground)",
    primary: "var(--primary)",
    primaryHover: "var(--primary-hover)",
    secondary: "var(--secondary)",
    muted: "var(--muted)",
    mutedForeground: "var(--muted-foreground)",
    border: "var(--border)",
    ring: "var(--ring)",
    destructive: "var(--destructive)",
    chart: {
      1: "var(--chart-1)",
      2: "var(--chart-2)",
      3: "var(--chart-3)",
      4: "var(--chart-4)",
      5: "var(--chart-5)",
    },
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "9999px",
  },
  shadow: {
    xs: "var(--shadow-xs)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  },
  font: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
  },
  spacing: {
    xs: "var(--spacing-xs)",
    sm: "var(--spacing-sm)",
    md: "var(--spacing-md)",
    lg: "var(--spacing-lg)",
    xl: "var(--spacing-xl)",
    "2xl": "var(--spacing-2xl)",
  },
  container: {
    sm: "var(--container-sm)",
    md: "var(--container-md)",
    lg: "var(--container-lg)",
    xl: "var(--container-xl)",
  },
} as const;

export type Tokens = typeof tokens;
