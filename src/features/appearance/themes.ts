// UI themes the user can pick: a sidebar palette and an accent (brand) color. Light/dark/system is
// next-themes. A look-only preference, saved in this browser; the colors live in app/themes.css.

export const SIDEBAR_THEME_KEY = "pulseops:sidebar-theme";
export const ACCENT_THEME_KEY = "pulseops:accent";

/** `swatch` = [background, foreground, highlight], only for the picker previews. */
export const SIDEBAR_THEMES = [
  { id: "pulse", label: "Pulse", swatch: ["#fafafb", "#3f3f46", "#4f46e5"] },
  { id: "khaki", label: "Khaki", swatch: ["#d3d1b9", "#151f24", "#e82339"] },
  { id: "teal", label: "Teal", swatch: ["#284e55", "#f2f3f3", "#a95641"] },
  { id: "snow", label: "Snow", swatch: ["#fbfcfc", "#292c41", "#4ca1e4"] },
  { id: "slate", label: "Slate", swatch: ["#2e3f47", "#f4f1f1", "#716452"] },
  { id: "midnight", label: "Midnight", swatch: ["#292c41", "#fefefe", "#ef6b41"] },
  { id: "dusk", label: "Dusk", swatch: ["#373f55", "#f7f8f7", "#9d6759"] },
  { id: "navy", label: "Navy", swatch: ["#232f57", "#f1f4f2", "#ee8888"] },
  { id: "mist", label: "Mist", swatch: ["#f9f9f9", "#28282a", "#bdbd61"] },
] as const;

export const ACCENT_THEMES = [
  { id: "indigo", label: "Indigo", color: "#4f46e5" },
  { id: "blue", label: "Blue", color: "#2563eb" },
  { id: "violet", label: "Violet", color: "#7c3aed" },
  { id: "teal", label: "Teal", color: "#0d9488" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "orange", label: "Orange", color: "#ea580c" },
  { id: "rose", label: "Rose", color: "#e11d48" },
  { id: "graphite", label: "Graphite", color: "#27272a" },
] as const;

export type SidebarThemeId = (typeof SIDEBAR_THEMES)[number]["id"];
export type AccentThemeId = (typeof ACCENT_THEMES)[number]["id"];

export const DEFAULT_SIDEBAR_THEME: SidebarThemeId = "pulse";
export const DEFAULT_ACCENT_THEME: AccentThemeId = "indigo";

// Storage can be edited by hand, so only accept a known id.
const isSidebarTheme = (v: unknown): v is SidebarThemeId => SIDEBAR_THEMES.some((t) => t.id === v);
const isAccentTheme = (v: unknown): v is AccentThemeId => ACCENT_THEMES.some((t) => t.id === v);

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // private mode / blocked storage: the choice still applies to this page
  }
}

export function readSidebarTheme(): SidebarThemeId {
  const v = read(SIDEBAR_THEME_KEY);
  return isSidebarTheme(v) ? v : DEFAULT_SIDEBAR_THEME;
}

export function readAccentTheme(): AccentThemeId {
  const v = read(ACCENT_THEME_KEY);
  return isAccentTheme(v) ? v : DEFAULT_ACCENT_THEME;
}

/** The defaults are the plain globals.css colors, so they clear the attribute. */
export function applySidebarTheme(id: SidebarThemeId) {
  const root = document.documentElement;
  if (id === DEFAULT_SIDEBAR_THEME) delete root.dataset.sidebarTheme;
  else root.dataset.sidebarTheme = id;
  write(SIDEBAR_THEME_KEY, id === DEFAULT_SIDEBAR_THEME ? null : id);
}

export function applyAccentTheme(id: AccentThemeId) {
  const root = document.documentElement;
  if (id === DEFAULT_ACCENT_THEME) delete root.dataset.accent;
  else root.dataset.accent = id;
  write(ACCENT_THEME_KEY, id === DEFAULT_ACCENT_THEME ? null : id);
}

/** Runs in <body> before the app paints, so a saved theme never flashes the default colors. */
export const themeBootScript = `(function(){try{var d=document.documentElement,s=localStorage;var a=s.getItem(${JSON.stringify(SIDEBAR_THEME_KEY)});if(${JSON.stringify(SIDEBAR_THEMES.map((t) => t.id))}.indexOf(a)>0)d.dataset.sidebarTheme=a;var b=s.getItem(${JSON.stringify(ACCENT_THEME_KEY)});if(${JSON.stringify(ACCENT_THEMES.map((t) => t.id))}.indexOf(b)>0)d.dataset.accent=b;}catch(e){}})();`;
