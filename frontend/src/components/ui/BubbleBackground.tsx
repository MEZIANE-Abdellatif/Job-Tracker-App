import { BUBBLE_SPECS } from "./bubble-specs";

/**
 * Soft floating bubbles behind page content (fixed layer, no pointer events).
 */
export function BubbleBackground() {
  return (
    <div
      className="bubble-field pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {BUBBLE_SPECS.map((b, i) => (
        <span
          key={i}
          className="bubble absolute rounded-full will-change-transform"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            bottom: "-8vh",
            // CSS variables consumed in globals.css
            ["--bubble-duration" as string]: `${b.duration}s`,
            ["--bubble-delay" as string]: `${b.delay}s`,
            ["--bubble-drift" as string]: `${b.drift}px`,
            ["--bubble-peak-opacity" as string]: String(b.opacity),
          }}
        />
      ))}
    </div>
  );
}
