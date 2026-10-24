# 003 — Keep the "landed" outline cue under reduced motion

- **Status**: DONE (2026-10-24)
- **Commit**: 46e742e (scaffold commit; the site itself is uncommitted work on top of it — line numbers refer to the working tree as of 2026-10-24)
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, ~4 lines of CSS

## Problem

With `prefers-reduced-motion: reduce`, card transforms on the board stop transitioning (correct — position changes are removed), so a moved card jumps to its new column instantly. The only remaining cue of *where it went* would be the green outline flash on the card that just landed — but that flash is also gated behind `no-preference`, even though it is a colour change, not movement. Reduced-motion users press an arrow and the card silently vanishes from one column and appears in another.

```css
/* src/components/board/board.css:212-221 — current */
@media (prefers-reduced-motion: no-preference) {
  .task[data-landed] .task-card {
    animation: landed 900ms ease-out;
  }
}
@keyframes landed {
  from {
    outline-color: var(--live);
  }
}
```

The card's resting outline is `outline: 2px solid transparent; outline-offset: -2px;` (in the `.task-card` rule, `board.css:~188`), so the keyframe fades a 2px inset `--live` (#c9f03e) outline to transparent. `data-landed` is set on the moved card by `Board.tsx:141` (`setLanded(id)`).

Reduced motion means fewer and gentler animations, not zero: keep transitions that aid comprehension (colour/opacity), remove movement.

## Target

The `landed` outline flash runs regardless of motion preference:

```css
/* target — src/components/board/board.css */
.task[data-landed] .task-card {
  animation: landed 900ms ease-out;
}
@keyframes landed {
  from {
    outline-color: var(--live);
  }
}
```

The 900ms built-in `ease-out` is acceptable here: it is a colour fade-out of a status highlight (the attention is at the start, where the colour is fully on), not a movement.

## Repo conventions to follow

- Colour/opacity feedback stays under reduced motion elsewhere in the repo — e.g. `src/app/globals.css` keeps button colour transitions ungated, and `src/components/board/board.css:310-321` keeps 200ms opacity/colour transitions under `reduce`.

## Steps

1. In `src/components/board/board.css`, remove the `@media (prefers-reduced-motion: no-preference) {` wrapper and its closing `}` around `.task[data-landed] .task-card { animation: landed 900ms ease-out; }`, leaving the inner rule at top level, directly above `@keyframes landed`.
2. Do not change the keyframes or the duration.

## Boundaries

- Do NOT touch the `.task-check path` pencil-draw animation (`board.css:~255`) — the check mark drawing itself is movement and stays gated.
- Do NOT touch `Board.tsx` or any other file.
- Do NOT add transforms, scaling or movement to the cue.
- If the code doesn't match the excerpt, STOP and report.
- Independent of plan 002; either can land first.

## Verification

- **Mechanical**: `npm run lint`, `npm run build` — clean.
- **Feel check**: `npm run dev`, DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, go to "מעומס לזרימה", press "לסדר את הפתקים":
  - Press a card's arrow button: the card appears in the next column with a bright green 2px inner outline that fades out over just under a second. Nothing moves or scales.
  - With reduced motion off, the same flash still appears after the card slides (unchanged).
  - In the Animations panel at 10%, confirm the only animated property on `.task-card` is `outline-color`.
- **Done when**: the `landed` animation is no longer inside any `prefers-reduced-motion` block.
