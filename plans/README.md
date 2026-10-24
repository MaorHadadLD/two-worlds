# Animation plans

Written by an `improve-animations` audit on 2026-10-24. Commit stamp `46e742e` is the scaffold commit; the site is uncommitted work on top of it, so line numbers refer to the working tree as of that date.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Remove the generic fade-up on chapter heads](001-remove-generic-fade-up.md) | HIGH | DONE |
| 002 | [Keep the overshoot for the pile→board peak; make routine card moves quick](002-board-routine-moves.md) | MEDIUM | DONE |
| 003 | [Keep the "landed" outline cue under reduced motion](003-board-reduced-landed-cue.md) | MEDIUM | DONE |
| 004 | [Give the choice a gentle crossfade under reduced motion](004-choice-reduced-crossfade.md) | MEDIUM | DONE |

## Recommended order

1. **001**: the highest leverage, and it touches only `globals.css`.
2. **002**, then **003**: both edit `src/components/board/board.css`, in different rules. Running them one after another avoids merge conflicts. 003 does not depend on 002, but 002's reduced-motion feel check refers to the cue that 003 adds.
3. **004**: independent; it only edits `src/components/choice/choice.css`.

There are no other dependencies. Each plan stops and reports if its quoted code no longer matches.

## Not planned (from the same audit)

- Count-bump keyframes flicker on rapid "+" presses (`store.css:169`, `board.css:127`). LOW.
- `.side-btn:active .side-label` scale has no transition (`choice.css:124`). LOW.
- Missed opportunities: the store's demo notice appears instantly (`Store.tsx:248`, could reuse Feel's `msg-in`), and the board's WIP warning pops in (`Board.tsx:321`).
