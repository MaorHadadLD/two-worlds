# 004 — Give the choice a gentle crossfade under reduced motion

- **Status**: DONE (2026-10-24)
- **Commit**: 46e742e (scaffold commit; the site itself is uncommitted work on top of it — line numbers refer to the working tree as of 2026-10-24)
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file, ~20 lines of CSS

## Problem

In the closing section ("באיזה צד הרעיון שלכם נמצא עכשיו?"), choosing a side normally sweeps the chosen side across the other (clip-path, 900ms), moves the label (WAAPI FLIP, 760ms), morphs the pencil loop into the field (rAF, 820ms) and fades the brief in. Under `prefers-reduced-motion: reduce` every one of those is removed:

```css
/* src/components/choice/choice.css:354-358 — current */
@media (prefers-reduced-motion: reduce) {
  .side {
    transition: clip-path 1ms linear;
  }
}
```

```css
/* src/components/choice/choice.css:186-195 — current */
@media (prefers-reduced-motion: no-preference) {
  .brief:not([hidden]) {
    animation: brief-in 520ms var(--ease-out) 380ms both;
  }
}
@keyframes brief-in {
  from {
    opacity: 0;
  }
}
```

and `src/components/choice/Choice.tsx:56` and `:95` return early from the FLIP and the morph when `(prefers-reduced-motion: reduce)` matches (correct — those are movement). The result is that the whole two-sided panel is replaced in a single frame. Reduced motion means fewer and gentler animations, not zero: an opacity crossfade keeps the change legible without movement.

How the state works (do not change it): `Choice.tsx:148` renders two `.side` elements; the chosen one gets `data-open=""`, the other gets `data-closed=""` and `inert`. `.side[data-open]` has `z-index: 2; clip-path: inset(0 0 0 0)` (`choice.css:41-44`), so it covers the closed side. "בעצם, אני בצד השני" (`Choice.tsx:226`) flips `data-open` to the other side.

## Target

Under reduced motion only:

- The clip switch stays instant (no sweep — that is movement).
- The newly opened side fades in over the previous layout: `opacity 0 → 1`, **200ms `ease`**, via a keyframe that runs each time a side becomes `[data-open]`. A keyframe (not a transition) is right here because the opacity is already 1 before and after — only the "just opened" moment fades — and the trigger is rare (once or twice per visit), so restart-from-zero is not a concern.
- The brief fades in over **200ms `ease`** with no delay (it currently has no animation at all under reduce).

```css
/* target — add to the existing reduced-motion block at the end of src/components/choice/choice.css */
@media (prefers-reduced-motion: reduce) {
  .side {
    transition: clip-path 1ms linear;
  }
  .side[data-open] {
    animation: side-fade 200ms ease both;
  }
  .brief:not([hidden]) {
    animation: brief-in 200ms ease both;
  }
}
@keyframes side-fade {
  from {
    opacity: 0;
  }
}
```

`brief-in` already exists (`choice.css:191-195`) and only animates opacity; reuse it.

## Repo conventions to follow

- Reduced-motion variants live in a `@media (prefers-reduced-motion: reduce)` block near the end of the component's CSS file and keep opacity/colour only — exemplar: `src/components/feel/feel.css:379-391` (keeps a 150ms fade, drops `filter`/`transform`).

## Steps

1. In `src/components/choice/choice.css`, inside the existing `@media (prefers-reduced-motion: reduce) { … }` block at lines ~354-358, after the `.side { transition: clip-path 1ms linear; }` rule, add:
   ```css
     .side[data-open] {
       animation: side-fade 200ms ease both;
     }
     .brief:not([hidden]) {
       animation: brief-in 200ms ease both;
     }
   ```
2. Directly after that media block (before the `/* ---------- Phone: … */` comment), add:
   ```css
   @keyframes side-fade {
     from {
       opacity: 0;
     }
   }
   ```
3. Leave the `no-preference` rules, `Choice.tsx`, the FLIP and the morph untouched.

## Boundaries

- Do NOT touch `src/components/choice/Choice.tsx`.
- Do NOT add any transform, clip-path animation or blur under reduced motion.
- Do NOT change the full-motion behaviour (900ms sweep, 760ms FLIP, 820ms morph, 520ms brief fade with 380ms delay).
- If the code doesn't match the excerpts, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, `npm run build` — clean.
- **Feel check**: `npm run dev`, DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, scroll to the last section:
  - Click "יש לי מחשבה ראשונית": the paper side fades in over the split panel in a fifth of a second; nothing slides, sweeps or morphs; focus lands in the textarea (unchanged).
  - Click "בעצם, אני בצד השני": the ink side fades in over the paper one the same way.
  - Keyboard: Tab to a side, press Enter — identical behaviour.
  - Animations panel at 10%: the only animated properties are `opacity` on `.side[data-open]` and on `.brief`.
  - Turn reduced motion off and confirm the sweep, the label movement and the pencil-loop morph are exactly as before.
  - Narrow the window below 760px (sides stacked) and repeat the first check.
- **Done when**: under reduced motion both side changes and the brief appearance show a 200ms opacity fade, and full-motion behaviour is unchanged.
