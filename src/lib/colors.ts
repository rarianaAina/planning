/**
 * Palette fixe. On utilise des valeurs hex en style inline plutôt que des
 * classes Tailwind construites dynamiquement : Tailwind ne scanne que le
 * code source, une classe `bg-${color}-500` ne serait jamais générée.
 */
export const COLORS = {
  indigo: { hex: "#6366f1", label: "Indigo" },
  sky: { hex: "#0ea5e9", label: "Bleu ciel" },
  teal: { hex: "#14b8a6", label: "Turquoise" },
  emerald: { hex: "#10b981", label: "Vert" },
  amber: { hex: "#f59e0b", label: "Ambre" },
  orange: { hex: "#f97316", label: "Orange" },
  rose: { hex: "#f43f5e", label: "Rose" },
  violet: { hex: "#8b5cf6", label: "Violet" },
  slate: { hex: "#64748b", label: "Gris" },
} as const;

export type ColorName = keyof typeof COLORS;

export const COLOR_NAMES = Object.keys(COLORS) as ColorName[];

export const DEFAULT_COLOR: ColorName = "indigo";

export function colorHex(name: string): string {
  return (COLORS as Record<string, { hex: string }>)[name]?.hex
    ?? COLORS[DEFAULT_COLOR].hex;
}

export function isColorName(v: string): v is ColorName {
  return v in COLORS;
}
