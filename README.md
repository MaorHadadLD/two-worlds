# Two Worlds · שני עולמות

An interactive, Hebrew, right-to-left portfolio piece by **Maor Hadad**, software developer.

The page shows one idea in two states: a pencil sketch on paper, and the finished digital product. The visitor drags a seam between them and watches each object change form. A handwritten note becomes a product card, a scribbled price gets a type hierarchy, a drawn line becomes a frame, and a circled word becomes a working button.

> **This is a demo project.** The store, the task board and the brief form run on sample data. Nothing is sold, charged or sent from this page. The Protein Market screenshots are real; every other interface on the page is an illustration built for it.

## What's on the page

- **Opening: the seam.** A compare handle that changes form, not just a clip between two images. Objects move, scale and morph as the seam passes over them. It works by mouse, touch (vertical scrolling stays free) and keyboard (arrow keys, Shift, Page Up/Down, Home/End), and three buttons show each world without dragging. A short demo plays once per session and stops on the first touch.
- **From idea to store.** A sketched product page inks into a working store as you scroll. Pick a product, add it to the cart, change quantities, remove lines. Products come from [Protein Market](https://protein-market.vercel.app/), a demo store I built, and the section shows real screenshots of it.
- **From clutter to flow.** Seven loose notes snap into a four-stage board. Cards move by mouse drag or by arrow buttons (touch uses the buttons), with a work-in-progress limit, a progress meter and screen-reader announcements.
- **From screen to experience.** One deploy button shown both ways: the "sketch" version gives no feedback, while the "product" version presses, waits, succeeds, or fails and explains why. A receipt beside it lists every response time. You can simulate a network failure or slow everything down ×4.
- **Close: which side is your idea on?** Two answers sweep open a matching brief. There is no send service. The button copies the brief, and an email link opens the visitor's own mail app with the brief already filled in.

## Built with

- [Next.js](https://nextjs.org) 16 (App Router, static output), [React](https://react.dev) 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4 for the base layer; components use plain CSS files
- No animation library: CSS transitions, `@starting-style`, scroll-driven animations (`view-timeline`), the Web Animations API, and one `requestAnimationFrame` loop for the seam that writes styles directly, with no React re-render per pointer move
- Fonts: IBM Plex Sans Hebrew and Gveret Levin, via `next/font/google`

## Craft notes

- Fully right-to-left Hebrew (`lang="he" dir="rtl"`), with Latin names isolated using `<bdi>`.
- Keyboard operable throughout: a skip link, visible focus, a `role="slider"` seam with value text, and board moves that keep focus on the moved card.
- Screen readers hear each object once: the drawn twin of every element is `aria-hidden`.
- `prefers-reduced-motion` is respected. Movement is removed and gentle opacity and colour cues stay.
- Motion follows one system with three peaks (the seam, pile→board, the closing sweep) and calm stretches in between. Durations and easings come from shared tokens in `src/app/globals.css`.
- No horizontal overflow from 390px to 1440px wide.

## Running locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Lint and type-check:

```bash
npm run lint
npx tsc --noEmit
```

The build downloads the two fonts from Google Fonts, so it needs network access.

## Project layout

```
src/app/                 layout, page, global tokens and base styles
src/components/hero/     the seam stage and its engine (seamEngine.ts)
src/components/store/    sketch-to-store chapter and Protein Market screenshots
src/components/board/    notes-to-board chapter
src/components/feel/     the deploy-button micro-interaction
src/components/choice/   the closing choice and brief
src/lib/                 pencil geometry, catalog data, contact details
public/                  images used by the page
assets/                  original downloads of the hero photos and credits.json
plans/                   animation audit plans written during development
```

## Image credits and licences

| Image | Source | Licence |
| --- | --- | --- |
| Product photos (`public/pm/products/`) | [Open Food Facts](https://world.openfoodfacts.org) contributors, via Protein Market | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Flat white (`public/hero/flat-white.webp`, cropped) | ["Latte art, espresso with cup and saucer on wood table"](https://commons.wikimedia.org/wiki/File:Latte_art,_espresso_with_cup_and_saucer_on_wood_table.jpg) by HungryHuy, via Wikimedia Commons | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| Cold brew (`public/hero/cold-brew.webp`) | ["Free iced black coffee saucer"](https://www.rawpixel.com/image/5927781/photo-image-public-domain-gold-wooden), rawpixel | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Protein Market screenshots (`public/pm/shots/`) | Screenshots of my own project, [Protein Market](https://protein-market.vercel.app/) | — |

The same credits appear in the page footer, and the source details are in `assets/credits.json`. The product photos are share-alike: adapted versions must stay under CC BY-SA 3.0.

Fonts: [IBM Plex Sans Hebrew](https://fonts.google.com/specimen/IBM+Plex+Sans+Hebrew) and [Gveret Levin](https://fonts.google.com/specimen/Gveret+Levin), both under the SIL Open Font License.

## Contact

Maor Hadad · [maorhadad94@gmail.com](mailto:maorhadad94@gmail.com)
