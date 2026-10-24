# 001 — Remove the generic fade-up on chapter heads

- **Status**: DONE (2026-10-24)
- **Commit**: 46e742e (scaffold commit; the site itself is uncommitted work on top of it — line numbers refer to the working tree as of 2026-10-24)
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, delete ~27 lines of CSS

## Problem

Every chapter head (`Build`, store intro, board head, feel copy, choice head) fades up 24px over 700–900ms with an 80ms stagger. The project brief explicitly bans "repeated fade-up", and the motion system is meant to have three peaks (hero seam, pile→board, choice sweep) with calm zones between them. This generic entrance turns every section into a small peak and delays reading each heading by close to a second.

```css
/* src/app/globals.css:276-302 — current */
/*
 * Entrances. Content is visible by default; only a scripted page hides it
 * until its section arrives, so a failed script never leaves a blank page.
 */
@media (prefers-reduced-motion: no-preference) {
  .js [data-enter] > [data-part] {
    opacity: 0;
    transform: translateY(24px);
    transition:
      opacity 700ms var(--ease-out),
      transform 900ms var(--ease-out);
    transition-delay: calc(var(--i, 0) * 80ms);
  }
  .js [data-enter].is-in > [data-part] {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .js [data-enter] > [data-part] {
    opacity: 0;
    transition: opacity 300ms ease;
  }
  .js [data-enter].is-in > [data-part] {
    opacity: 1;
  }
}
```

## Target

Chapter heads are painted, finished, on the first frame. No CSS rule targets `[data-enter] > [data-part]` generically.

The **one** entrance that stays is the screenshots' clip-path reveal, which is a distinct, one-off "uncovering" and lives in its own file:

```css
/* src/components/store/store.css:505-514 — KEEP UNCHANGED */
@media (prefers-reduced-motion: no-preference) {
  .js .shots[data-enter] > .shot[data-part] img {
    clip-path: inset(0 0 100% 0 round var(--radius-ui));
    transition: clip-path 1100ms var(--ease-in-out);
    transition-delay: calc(var(--i, 0) * 90ms);
  }
  .js .shots[data-enter].is-in > .shot[data-part] img {
    clip-path: inset(0 0 0 0 round var(--radius-ui));
  }
}
```

It still depends on `src/components/Enter.tsx` adding `.is-in`, so `Enter.tsx` and every `data-enter` / `data-part` attribute in the markup stay.

## Repo conventions to follow

- Motion that belongs to one component lives in that component's CSS file (e.g. the shots reveal in `store.css`); `globals.css` holds tokens and base styles only.

## Steps

1. In `src/app/globals.css`, delete the whole block quoted under **Problem** — the comment `/* Entrances. … */` plus both `@media (prefers-reduced-motion: …)` blocks — and nothing else. The next line after the deletion should be the `/* ---------- Bar ---------- */` comment.
2. Run `grep -rn "data-part\]" src --include=*.css`. Expected result: only the two lines in `src/components/store/store.css` (the shots reveal). If anything else appears, STOP and report.

## Boundaries

- Do NOT touch `src/components/Enter.tsx`, any `.tsx` markup, or the `data-enter` / `data-part` / `--i` attributes.
- Do NOT touch `src/components/store/store.css`.
- Do NOT add a replacement entrance of any kind.
- If the code at `globals.css:276-302` doesn't match the excerpt, STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx tsc --noEmit` (no output), `npm run lint` (no errors), `npm run build` (succeeds).
- **Feel check**: `npm run dev`, scroll from the top to the footer:
  - Every chapter title and lead is already in place when it scrolls into view — nothing rises or fades.
  - The three Protein Market screenshots still reveal top-to-bottom with a staggered clip when they enter.
  - The store panel still inks from paper to dark while scrolling (separate scroll-driven animation, unaffected).
  - Toggle `prefers-reduced-motion: reduce` (DevTools → Rendering): headings are visible immediately; the screenshots appear without the clip reveal.
- **Done when**: `grep -n "data-enter" src/app/globals.css` returns nothing, and the build passes.
