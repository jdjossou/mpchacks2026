# EduTrial — Class Trial Debate Game

> Built in 24 hours for MPC Hacks 2026 · Theme: **Frutiger Aero**

EduTrial transforms your study notes into a fast-paced debate game inspired by the class trial sequences in Danganronpa. Upload a PDF or paste your notes, and the AI turns them into a round of competing arguments — some right, some wrong. Your job is to shoot down the false claims before time runs out.

## How it works

1. **Upload** your notes or a PDF.
2. **AI generates** a debate: two students argue three statements (two wrong, one correct), plus a set of "truth bullets" — the correct counterarguments.
3. **Play the class trial** — characters take the center stage one at a time as they speak (Danganronpa-style), then statements scroll across the screen. Select a truth bullet and fire it at a wrong statement to correct it. You have 2 minutes.
4. **Score** is based on correct hits, mistakes, and time remaining.

## Visual design

The game runs inside a **CRT monitor bezel** rendered entirely in CSS — chunky beige plastic shell, recessed screen with curved-glass edges, corner glare, scanlines, a heavy vignette, a subtle "alive" flicker, and a blinking power LED. The screen is a fixed 16:10 box so content always stays inside the glass (longer screens like the results recap scroll internally). The surrounding UI follows the **Frutiger Aero** aesthetic: glossy aqua glass panels, sky-blue gradients, and floating translucent bubbles.

**Characters** appear one at a time in the center of the screen when it's their turn to speak — they pop in, idle-bob, and shake for emphasis. Avatars are emoji placeholders today; dropping a real image into each character's `avatar` field swaps the art in with no other changes.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind v4** (`@theme inline` design tokens, no config file)
- **Framer Motion v12** for the Danganronpa scroll, CRT boot animation, hit/miss feedback, and all transitions
- State managed with `useReducer` — a 7-phase state machine (`boot → intro → tutorial → statementPresent → solving → winConclusion → results`)

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/game](http://localhost:3000/game) to play the demo round (Virtual Memory Class Trial).
