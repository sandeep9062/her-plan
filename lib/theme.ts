export type Theme = "pink" | "midnight" | "pastel";

export interface ThemeTokens {
  id: Theme;
  label: string;
  color: string;
  /** page background + default text */
  page: string;
  /** card surface */
  card: string;
  /** primary text on page */
  ink: string;
  /** muted / secondary text */
  muted: string;
  /** accent button bg + accent text on soft surfaces */
  accent: string;
  accentBg: string;
  accentTextOn: string;
  /** soft pill / secondary button */
  soft: string;
  softText: string;
  /** borders + dot outlines */
  border: string;
  /** input surface + border */
  input: string;
  inputBorder: string;
  /** selected card ring */
  ring: string;
  /** error box */
  errorBox: string;
  errorText: string;
  errorBorder: string;
}

const BASE = "font-semibold transition-colors duration-300";

export const THEMES: Record<Theme, ThemeTokens> = {
  pink: {
    id: "pink",
    label: "Romantic pink",
    color: "#e8456b",
    page: `bg-[#fff1ee] text-[#4a1d2e] ${BASE}`,
    card: "bg-white text-[#4a1d2e]",
    ink: "text-[#4a1d2e]",
    muted: "text-[#8a5a68]",
    accent: "text-[#e8456b]",
    accentBg: "bg-[#e8456b]",
    accentTextOn: "text-white",
    soft: "bg-[#ffd3dc]",
    softText: "text-[#4a1d2e]",
    border: "border-[#ffd3dc]",
    input: "bg-white text-[#4a1d2e] placeholder-[#8a5a68]/70",
    inputBorder: "border-[#ffd3dc]",
    ring: "ring-[#e8456b] border-[#e8456b]",
    errorBox: "bg-red-50",
    errorText: "text-[#b3261e]",
    errorBorder: "border-[#b3261e]/30",
  },
  midnight: {
    id: "midnight",
    label: "Dark midnight",
    color: "#8b9cff",
    page: `bg-[#0e1226] text-[#e9ecff] ${BASE}`,
    card: "bg-[#1a2040] text-[#e9ecff]",
    ink: "text-[#e9ecff]",
    muted: "text-[#a3acd9]",
    accent: "text-[#8b9cff]",
    accentBg: "bg-[#8b9cff]",
    accentTextOn: "text-[#0e1226]",
    soft: "bg-[#2a3366]",
    softText: "text-[#e9ecff]",
    border: "border-[#2a3366]",
    input: "bg-[#0e1226] text-[#e9ecff] placeholder-[#a3acd9]/70",
    inputBorder: "border-[#2a3366]",
    ring: "ring-[#8b9cff] border-[#8b9cff]",
    errorBox: "bg-red-950/40",
    errorText: "text-red-300",
    errorBorder: "border-red-400/40",
  },
  pastel: {
    id: "pastel",
    label: "Cute pastel",
    color: "#ffb3c7",
    page: `bg-[#e8f7f1] text-[#3f4a49] ${BASE}`,
    card: "bg-[#fffdfb] text-[#3f4a49]",
    ink: "text-[#3f4a49]",
    muted: "text-[#6f8584]",
    accent: "text-[#e05686]",
    accentBg: "bg-[#ffb3c7]",
    accentTextOn: "text-[#5a2a3c]",
    soft: "bg-[#d9f0e6]",
    softText: "text-[#3f4a49]",
    border: "border-[#d9f0e6]",
    input: "bg-white text-[#3f4a49] placeholder-[#6f8584]/70",
    inputBorder: "border-[#d9f0e6]",
    ring: "ring-[#e05686] border-[#e05686]",
    errorBox: "bg-red-50",
    errorText: "text-[#b3261e]",
    errorBorder: "border-[#b3261e]/30",
  },
};

export const THEME_LIST: ThemeTokens[] = [
  THEMES.pink,
  THEMES.midnight,
  THEMES.pastel,
];

export const isTheme = (v: unknown): v is Theme =>
  v === "pink" || v === "midnight" || v === "pastel";
