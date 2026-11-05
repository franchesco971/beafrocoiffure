import type { CSSProperties } from "react";

// Délai d'animation (ms) lu par les classes .rise-line, .fade-up et .bloom.
export const delay = (ms: number) => ({ "--d": ms }) as CSSProperties;
