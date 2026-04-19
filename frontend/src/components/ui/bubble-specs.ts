/** Deterministic bubble layout (SSR-safe, no hydration mismatch). */
export type BubbleSpec = {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
};

export const BUBBLE_SPECS: BubbleSpec[] = [
  { left: 4, size: 18, duration: 38, delay: 0, drift: 14, opacity: 0.38 },
  { left: 11, size: 42, duration: 48, delay: 6, drift: -22, opacity: 0.32 },
  { left: 18, size: 26, duration: 33, delay: 12, drift: 28, opacity: 0.44 },
  { left: 26, size: 52, duration: 55, delay: 2, drift: -12, opacity: 0.28 },
  { left: 33, size: 14, duration: 26, delay: 18, drift: 8, opacity: 0.5 },
  { left: 41, size: 34, duration: 41, delay: 24, drift: -30, opacity: 0.35 },
  { left: 48, size: 22, duration: 36, delay: 4, drift: 18, opacity: 0.4 },
  { left: 55, size: 60, duration: 52, delay: 10, drift: 24, opacity: 0.26 },
  { left: 62, size: 30, duration: 44, delay: 28, drift: -18, opacity: 0.36 },
  { left: 70, size: 16, duration: 29, delay: 8, drift: 32, opacity: 0.48 },
  { left: 77, size: 46, duration: 50, delay: 16, drift: -26, opacity: 0.3 },
  { left: 85, size: 20, duration: 31, delay: 22, drift: 10, opacity: 0.42 },
  { left: 92, size: 38, duration: 46, delay: 14, drift: -16, opacity: 0.34 },
  { left: 7, size: 24, duration: 40, delay: 32, drift: 20, opacity: 0.4 },
  { left: 15, size: 48, duration: 53, delay: 20, drift: -24, opacity: 0.28 },
  { left: 23, size: 12, duration: 24, delay: 36, drift: 6, opacity: 0.52 },
  { left: 31, size: 36, duration: 43, delay: 5, drift: -34, opacity: 0.33 },
  { left: 38, size: 28, duration: 35, delay: 26, drift: 26, opacity: 0.39 },
  { left: 45, size: 54, duration: 49, delay: 11, drift: -8, opacity: 0.27 },
  { left: 52, size: 10, duration: 22, delay: 30, drift: 16, opacity: 0.55 },
  { left: 59, size: 40, duration: 47, delay: 7, drift: -20, opacity: 0.31 },
  { left: 67, size: 32, duration: 39, delay: 19, drift: 22, opacity: 0.37 },
  { left: 74, size: 44, duration: 51, delay: 25, drift: -28, opacity: 0.29 },
  { left: 81, size: 18, duration: 27, delay: 38, drift: 12, opacity: 0.45 },
  { left: 88, size: 56, duration: 54, delay: 3, drift: -14, opacity: 0.25 },
  { left: 95, size: 26, duration: 37, delay: 17, drift: 30, opacity: 0.41 },
  { left: 2, size: 36, duration: 45, delay: 9, drift: -10, opacity: 0.36 },
  { left: 50, size: 14, duration: 28, delay: 34, drift: 18, opacity: 0.46 },
];
