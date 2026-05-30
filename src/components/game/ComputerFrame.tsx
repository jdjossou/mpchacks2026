import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * CRT monitor bezel wrapper.
 * Purely presentational — no state. Can stay a Server Component.
 */
export default function ComputerFrame({ children }: Props) {
  return (
    // Outer page: center the monitor, sky-gradient background
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">

      {/* Floating decorative bubbles (behind everything) */}
      <Bubbles />

      {/* CRT plastic shell */}
      <div className="crt-frame w-full max-w-3xl">

        {/* Inner screen recess — definite size so content can never stretch the bezel */}
        <div className="crt-screen">
          {/* Content lives here — inherit the screen's rounded corners so the
              background is clipped here (robust even with transformed children). */}
          <div
            className="relative w-full h-full flex flex-col overflow-hidden"
            style={{ borderRadius: "inherit" }}
          >
            {children}
          </div>

          {/* Visual overlays — on top of content */}
          <div className="scanlines" aria-hidden="true" />
          <div className="crt-vignette" aria-hidden="true" />
          <div className="crt-glare" aria-hidden="true" />
        </div>

        {/* Power LED */}
        <div className="crt-led" aria-hidden="true" />
      </div>
    </div>
  );
}

// ─── Decorative floating bubbles ──────────────────────────────────────────
function Bubbles() {
  const bubbles = [
    { size: 48, left: "8%",  delay: "0s",    duration: "9s"  },
    { size: 28, left: "18%", delay: "2.5s",  duration: "12s" },
    { size: 64, left: "32%", delay: "1s",    duration: "14s" },
    { size: 20, left: "45%", delay: "4s",    duration: "10s" },
    { size: 40, left: "58%", delay: "0.5s",  duration: "11s" },
    { size: 24, left: "70%", delay: "3s",    duration: "13s" },
    { size: 52, left: "82%", delay: "1.8s",  duration: "15s" },
    { size: 18, left: "92%", delay: "5s",    duration: "8s"  },
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="aero-bubble absolute bottom-0"
          style={{
            width:  b.size,
            height: b.size,
            left:   b.left,
            animationDuration:  b.duration,
            animationDelay:     b.delay,
          }}
        />
      ))}
    </div>
  );
}
