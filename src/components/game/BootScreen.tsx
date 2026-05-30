"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onDone: () => void;
}

/**
 * CRT power-on animation followed by a "Click to begin" prompt.
 */
export default function BootScreen({ onDone }: Props) {
  const [booted, setBooted] = useState(false);

  // Allow the CRT-on animation to complete before showing the prompt
  useEffect(() => {
    const id = setTimeout(() => setBooted(true), 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center bg-[#050e1a] cursor-pointer select-none"
      onClick={booted ? onDone : undefined}
      initial={{ scaleY: 0.01, scaleX: 0.8, filter: "brightness(6)", opacity: 0 }}
      animate={{ scaleY: 1, scaleX: 1, filter: "brightness(1)", opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.2, 0.8, 0.4, 1] }}
    >
      {/* Retro boot text */}
      <div className="font-mono text-center space-y-2 px-8">
        <p
          className="text-[#57c7ff] text-xs tracking-widest uppercase"
          style={{ animation: "boot-flicker 0.3s steps(1) 0.5s 3" }}
        >
          EduTrial™ OS v2.6
        </p>
        <p className="text-[#9fe9ff] text-[0.6rem] tracking-widest opacity-70">
          Academic Debate Engine — Initialising…
        </p>

        {/* Loading bar */}
        <div className="mt-4 w-48 mx-auto h-1.5 rounded-full bg-[#0b2a3a] overflow-hidden border border-[#1a5f9a]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(to right, #57c7ff, #9fe9ff)",
              boxShadow: "0 0 8px #57c7ff",
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeInOut" }}
          />
        </div>

        {/* Click prompt — only shown after boot */}
        {booted && (
          <motion.p
            className="mt-8 text-[#9fe9ff] text-sm tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            — Click to begin —
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
