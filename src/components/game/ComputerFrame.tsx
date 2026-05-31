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
    // Outer page: the monitor fills the whole viewport, edge to edge.
    <div className="h-screen w-screen overflow-hidden flex">

      {/* CRT plastic shell — fills the page so its bezel touches the edges */}
      <div className="crt-frame w-full h-full">

        {/* Inner screen recess — fills the bezel interior */}
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
