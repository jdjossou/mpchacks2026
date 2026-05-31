# Clashroom — Class Trial Debate Game

> Built in 24 hours for MPC Hacks 2026 · Theme: **Frutiger Aero**

Clashroom transforms your study notes into a fast-paced debate game inspired by the class trial sequences in Danganronpa. Upload a PDF or image of your notes, and the AI turns them into a round of competing arguments — some right, some wrong. Your job is to shoot down the false claims before time runs out.

## How it works

1. **Upload** your notes as a PDF or image (PNG, JPG, WEBP — up to 15 MB).
2. **Gemini parses** the document and structures its content as JSON.
3. **AI generates** a debate: two students argue three statements (two wrong, one correct), plus a set of "truth bullets" — the correct counterarguments.
4. **Study your bullets** — before the clock starts, you see all three truth bullets in full so you can plan your strategy.
5. **Play the class trial** — Nonstop Debate style: one student fills the screen and their statement flies in over them from a random direction, floating in place. Select a truth bullet from your inventory, then click the statement anywhere to fire it. Wrong statements keep cycling back until you correct them or time runs out. You have 2 minutes.
6. **Score** is based on correct hits, mistakes, and time remaining.

## App structure

The app has two routes wired together end-to-end:

### `/upload` — Landing page (DocSense)
A Frutiger Aero–styled upload interface. Drag and drop (or click to select) a PDF or image. Gemini 2.5 Flash parses the file server-side via a Next.js Server Action and extracts its content as structured JSON. On success the app navigates straight to `/game`. The parsed JSON is logged to the browser console for debugging.

### `/game` — Class Trial
The game runs inside a CRT monitor bezel rendered entirely in CSS. Currently uses a hardcoded demo game (Virtual Memory Class Trial); connecting the parsed upload data to the game engine is the next integration step.

## Visual design

The landing page follows the **Frutiger Aero** aesthetic: glossy aqua glass panels, sky-blue gradients, floating translucent bubbles, and a large animated mascot on the right side.

The game runs inside a **CRT monitor bezel** rendered entirely in CSS — chunky beige plastic shell, recessed screen with curved-glass edges, corner glare, scanlines, a heavy vignette, a subtle "alive" flicker, and a blinking power LED. The screen is a fixed 16:10 box so content always stays inside the glass (longer screens like the results recap scroll internally).

**Characters** sit in the background of the debate stage while their statement floats over them — the statement card flies in from a random direction each rotation and gently drifts in place. Hit it anywhere to fire. After a correct hit the card shows a "CORRECTED" stamp briefly, then cycles out. Avatars are emoji placeholders today; dropping a real image into each character's `avatar` field swaps the art in with no other changes.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind v4** (`@theme inline` design tokens, no config file)
- **Framer Motion v12** for animations, transitions, and CRT boot sequence
- **Google Gemini 2.5 Flash** for PDF and image parsing via the Generative Language API
- **pdf-parse** for server-side PDF text extraction
- Game state managed with `useReducer` — a 7-phase state machine (`boot → intro → tutorial → answerPreview → solving → winConclusion → results`)

## Running locally

```bash
npm install
```

Create a `.env.local` file in the project root with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/upload` to start the full flow, or go directly to [http://localhost:3000/game](http://localhost:3000/game) to play the demo round (Virtual Memory Class Trial).
