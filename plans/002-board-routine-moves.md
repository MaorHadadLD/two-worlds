# 002 — Keep the overshoot for the pile→board peak; make routine card moves quick

- **Status**: DONE (2026-10-24)
- **Commit**: 46e742e (scaffold commit; the site itself is uncommitted work on top of it — line numbers refer to the working tree as of 2026-10-24)
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file, ~10 lines of CSS

## Problem

Every card transform on the board uses the 720ms overshooting `--ease-land` curve. That curve was built for the chapter's peak — seven notes snapping from a pile into four columns — but it also runs for every routine move: an arrow-button press, a drop after dragging, and the sibling cards reflowing to make room. A single "move to next stage" therefore bounces for three quarters of a second, and keyboard users watch their focused card wobble across the board on every press.

```css
/* src/components/board/board.css:147-154 — current */
.task {
  position: absolute;
  top: 0;
  left: 0;
  touch-action: pan-y;
  transition: transform 720ms var(--ease-land);
}
.flow[data-toggling] .task {
  transition-delay: calc(var(--i) * 45ms);
}
```

`--ease-land` is defined in `src/app/globals.css:50`:
`--ease-land: linear(0, 0.1 4%, 0.41 12%, 0.81 23%, 0.99 31%, 1.06 38%, 1.07 44%, 1.04 54%, 1.01 66%, 1 100%);`

`data-toggling` is set by `src/components/board/Board.tsx:161` when the "לסדר את הפתקים / להחזיר לבלגן" toggle is pressed and cleared 1100ms later (`Board.tsx:167`). The last card in the staggered choreography starts at 6 × 45ms = 270ms and ends at 270 + 720 = 990ms, inside that window.

## Target

- Routine moves (button press, drop, sibling reflow): `transform 300ms var(--ease-out)` — strong ease-out so the card responds immediately, within the 200–500ms budget for things travelling across a panel.
- The pile↔board choreography only: `720ms var(--ease-land)` with the existing 45ms stagger, and only when motion is allowed.

```css
/* target — src/components/board/board.css */
.task {
  position: absolute;
  top: 0;
  left: 0;
  touch-action: pan-y;
  transition: transform 300ms var(--ease-out);
}
@media (prefers-reduced-motion: no-preference) {
  .flow[data-toggling] .task {
    transition-duration: 720ms;
    transition-timing-function: var(--ease-land);
    transition-delay: calc(var(--i) * 45ms);
  }
}
```

`--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` (`globals.css:46`). Do not hand-type it; use the token.

## Repo conventions to follow

- Curves and durations come from the tokens in `src/app/globals.css:46-54`; components reference them with `var(--…)`.
- Motion-only rules gated by `@media (prefers-reduced-motion: no-preference)` sit next to the rule they extend — see `board.css:212-216` (`.task[data-landed] .task-card`).

## Steps

1. In `src/components/board/board.css`, in the `.task` rule (line ~152), change `transition: transform 720ms var(--ease-land);` to `transition: transform 300ms var(--ease-out);`.
2. Replace the rule
   ```css
   .flow[data-toggling] .task {
     transition-delay: calc(var(--i) * 45ms);
   }
   ```
   with
   ```css
   @media (prefers-reduced-motion: no-preference) {
     .flow[data-toggling] .task {
       transition-duration: 720ms;
       transition-timing-function: var(--ease-land);
       transition-delay: calc(var(--i) * 45ms);
     }
   }
   ```
3. Leave `.task[data-drag] { transition: none; … }` (line ~157) and the reduced-motion block at the end of the file (`.task { transition: opacity 200ms ease; }`) exactly as they are.

## Boundaries

- Do NOT touch `Board.tsx`, `globals.css`, or the `--ease-land` token.
- Do NOT change the note/card crossfade (`.task-note`, `.task-card` opacity transitions) or the column fade-in.
- Do NOT add a spring library.
- If the code doesn't match the excerpts, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`, `npm run build` — all clean.
- **Feel check**: `npm run dev`, go to "מעומס לזרימה":
  - Press "לסדר את הפתקים": the notes still fly from the pile into columns one after another and settle with the slight overshoot (unchanged peak).
  - Press a card's arrow button: the card slides to the next column in about a third of a second with no bounce; cards below it close the gap just as quickly.
  - Drag a card to another column with the mouse and release: it lands directly into its slot without wobbling.
  - Press an arrow button five times quickly on different cards: moves retarget smoothly from where they are, never restart.
  - DevTools → Animations panel at 10%: on the toggle, cards overshoot slightly past their slot (~7%) and return; on an arrow press, the card decelerates into place with no overshoot.
  - Toggle `prefers-reduced-motion: reduce`: cards jump instantly (unchanged behaviour; plan 003 adds the arrival cue).
- **Done when**: `grep -n "ease-land" src/components/board/board.css` shows it only inside the `prefers-reduced-motion: no-preference` block for `[data-toggling]`.
