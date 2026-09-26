import type { UnitColor } from "./types";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

/** Runs inline in <head> before paint so the page never flashes the wrong theme. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}")||"light";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export function getThemePreference(): ThemePreference {
  try {
    return (localStorage.getItem(STORAGE_KEY) as ThemePreference) || "light";
  } catch {
    return "light";
  }
}

export function applyTheme(pref: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage may be unavailable (private mode); the theme still applies for this visit
  }
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Unit colours: main fill, darker "lip" and a lighter tint for the banner button. */
export const UNIT_COLORS: Record<UnitColor, { main: string; dark: string; light: string }> = {
  green: { main: "#58cc02", dark: "#58a700", light: "#89e219" },
  purple: { main: "#ce82ff", dark: "#a568cc", light: "#dbabff" },
  blue: { main: "#1cb0f6", dark: "#1899d6", light: "#84d8ff" },
  orange: { main: "#ff9600", dark: "#e58600", light: "#ffc800" },
  red: { main: "#ff4b4b", dark: "#ea2b2b", light: "#ff9b9b" },
};

export const AVATAR_COLORS: Record<string, string> = {
  blue: "#1cb0f6",
  pink: "#ff86d0",
  purple: "#ce82ff",
  orange: "#ff9600",
  red: "#ff4b4b",
  green: "#58cc02",
  yellow: "#ffc800",
  teal: "#2bdcc8",
};
