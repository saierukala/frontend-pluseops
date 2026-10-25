"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCENT_THEMES,
  DEFAULT_ACCENT_THEME,
  DEFAULT_SIDEBAR_THEME,
  SIDEBAR_THEMES,
  applyAccentTheme,
  applySidebarTheme,
  type AccentThemeId,
  type SidebarThemeId,
} from "./themes";

const MODES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

const THEME_EVENT = "pulseops:theme-changed";

// The theme on <html> right now (null while rendering on the server, where it is unknown)
function useHtmlData<T extends string>(key: "sidebarTheme" | "accent", fallback: T): T | null {
  return React.useSyncExternalStore(
    (onChange) => {
      window.addEventListener(THEME_EVENT, onChange);
      return () => window.removeEventListener(THEME_EVENT, onChange);
    },
    () => (document.documentElement.dataset[key] as T | undefined) ?? fallback,
    () => null,
  );
}

const noop = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(noop, () => true, () => false);
}

function optionClass(selected: boolean) {
  return cn(
    "group flex flex-col gap-2 rounded-xl border bg-card p-2 text-left text-sm font-medium outline-none transition-all",
    "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50",
    selected && "border-primary ring-1 ring-primary",
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

// A tiny drawing of the sidebar in this palette: logo, a few menu lines, the active row.
function SidebarPreview({ swatch }: { swatch: readonly [string, string, string] }) {
  const [bg, fg, primary] = swatch;
  return (
    <div className="flex h-20 flex-col gap-1.5 rounded-lg border border-black/5 p-2" style={{ backgroundColor: bg }} aria-hidden>
      <div className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm" style={{ backgroundColor: primary }} />
        <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: fg }} />
      </div>
      <span className="h-1.5 w-10 rounded-full opacity-50" style={{ backgroundColor: fg }} />
      <span className="flex h-3 items-center rounded-sm px-1" style={{ backgroundColor: `color-mix(in srgb, ${fg} 15%, transparent)` }}>
        <span className="h-1.5 w-9 rounded-full" style={{ backgroundColor: fg }} />
      </span>
      <span className="h-1.5 w-7 rounded-full opacity-50" style={{ backgroundColor: fg }} />
    </div>
  );
}

function ModePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <Section title="Mode" description="Light or dark. System follows your device.">
      <div role="radiogroup" aria-label="Mode" className="grid grid-cols-3 gap-3 sm:max-w-md">
        {MODES.map((m) => {
          const selected = mounted && (theme ?? "system") === m.id;
          return (
            <button key={m.id} type="button" role="radio" aria-checked={selected} onClick={() => setTheme(m.id)} className={optionClass(selected)}>
              <span className="flex h-14 items-center justify-center rounded-lg bg-muted">
                <m.icon className="size-5" />
              </span>
              <span className="flex items-center justify-between px-0.5 pb-0.5">
                {m.label}
                {selected ? <Check className="size-4 text-primary" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function SidebarPicker() {
  const current = useHtmlData<SidebarThemeId>("sidebarTheme", DEFAULT_SIDEBAR_THEME);
  return (
    <Section title="Sidebar color" description="Changes at once. Pulse follows light and dark mode; the others keep their colors.">
      <div role="radiogroup" aria-label="Sidebar color" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SIDEBAR_THEMES.map((t) => {
          const selected = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                applySidebarTheme(t.id);
                window.dispatchEvent(new Event(THEME_EVENT));
              }}
              className={optionClass(selected)}
            >
              <SidebarPreview swatch={t.swatch} />
              <span className="flex items-center justify-between px-0.5 pb-0.5">
                {t.label}
                {selected ? <Check className="size-4 text-primary" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

function AccentPicker() {
  const current = useHtmlData<AccentThemeId>("accent", DEFAULT_ACCENT_THEME);
  return (
    <Section title="Accent color" description="Buttons, links, highlights and the main chart color.">
      <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-2">
        {ACCENT_THEMES.map((t) => {
          const selected = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                applyAccentTheme(t.id);
                window.dispatchEvent(new Event(THEME_EVENT));
              }}
              className={cn(
                "flex items-center gap-2 rounded-full border bg-card py-1.5 pl-1.5 pr-3 text-sm font-medium outline-none transition-all",
                "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                selected && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ backgroundColor: t.color }} aria-hidden>
                {selected ? <Check className="size-3.5" /> : null}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/** Look-and-feel settings, saved in this browser only (not on the account). */
export function AppearanceSettings() {
  return (
    <div className="flex flex-col gap-8">
      <ModePicker />
      <SidebarPicker />
      <AccentPicker />
    </div>
  );
}
