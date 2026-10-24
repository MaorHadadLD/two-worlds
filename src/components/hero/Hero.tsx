"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CupDrawing, GlassDrawing, PencilArrow, PencilBox, Ring, Squiggle, Tally, Underline } from "@/components/sketch/Pencil";
import { SeamEngine } from "./seamEngine";
import "./hero.css";

type Order = { id: number; item: string; time: string };

const START: Order[] = [
  { id: 3, item: "קר ברו", time: "08:21" },
  { id: 2, item: "פלאט וייט", time: "08:13" },
  { id: 1, item: "פלאט וייט", time: "07:58" },
];

const INITIAL = 0.47;
const INITIAL_NARROW = 0.6;

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function HeroCopy({ real }: { real: boolean }) {
  const Title = real ? "h1" : "div";
  return (
    <div className="hero-copy">
      <Title id={real ? "hero-title" : undefined} className="hero-title">
        מהשרבוט שלכם
        <br />— למוצר שעובד.
      </Title>
      <p className="hero-lead">
        אני מאור חדאד, מפתח תוכנה. אני בונה אתרים, אפליקציות ומערכות: מהמחשבה הראשונה ועד מוצר שאנשים משתמשים בו.
      </p>
      {real ? (
        <a className="btn btn--ink hero-cta" href="#start">
          ספרו לי על הרעיון
          <ArrowLeft />
        </a>
      ) : (
        <span className="btn btn--live hero-cta">
          ספרו לי על הרעיון
          <ArrowLeft />
        </span>
      )}
    </div>
  );
}

export function ArrowLeft({ className = "arrow-ico" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16 10H4.5M9 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SeamEngine | null>(null);
  const [orders, setOrders] = useState<Order[]>(START);
  const [world, setWorld] = useState<"sketch" | "mix" | "product">("mix");
  const [justOrdered, setJustOrdered] = useState<"sketch" | "product" | null>(null);
  const worldRef = useRef(world);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initial = stage.clientWidth < 760 ? INITIAL_NARROW : INITIAL;
    const engine = new SeamEngine(stage, {
      initial,
      reducedMotion: media.matches,
      onChange: (p) => {
        const w = p < 0.03 ? "sketch" : p > 0.97 ? "product" : "mix";
        if (w !== worldRef.current) {
          worldRef.current = w;
          setWorld(w);
        }
      },
    });
    engineRef.current = engine;
    const onMedia = () => engine.setReduced(media.matches);
    media.addEventListener("change", onMedia);
    document.fonts?.ready.then(() => engine.measure());

    // One short demonstration of the gesture, once, and only until the visitor takes over.
    let cancelled = false;
    let seen = false;
    try {
      seen = sessionStorage.getItem("seam-demo") === "1";
    } catch {}
    const demo = async () => {
      if (media.matches || seen) return;
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await wait(900);
      if (cancelled || engine.hasBeenTouched) return;
      try {
        sessionStorage.setItem("seam-demo", "1");
      } catch {}
      const steps: [number, number, number][] = [
        [0.8, 1100, 260],
        [0.24, 1300, 220],
        [initial, 900, 0],
      ];
      for (const [to, ms, hold] of steps) {
        if (cancelled || engine.hasBeenTouched) return;
        await engine.glide(to, ms);
        if (hold) await wait(hold);
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          demo();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(stage);

    return () => {
      cancelled = true;
      io.disconnect();
      media.removeEventListener("change", onMedia);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const goTo = useCallback((p: number) => {
    const e = engineRef.current;
    if (!e) return;
    e.claim();
    e.glide(p, 760);
  }, []);

  const order = useCallback((from: "sketch" | "product") => {
    setOrders((list) => [{ id: list.length + 1, item: "פלאט וייט", time: now() }, ...list]);
    setJustOrdered(from);
  }, []);

  useEffect(() => {
    if (!justOrdered) return;
    const t = setTimeout(() => setJustOrdered(null), 1600);
    return () => clearTimeout(t);
  }, [justOrdered, orders.length]);

  const count = orders.length;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="stage" ref={stageRef}>
        {/* Sketch world: paper, the real copy, the designer's notes. */}
        <div className="world world--paper">
          <HeroCopy real />
          <div className="notes" aria-hidden="true">
            <div className="note-a hand">
              <span>תמונה אמיתית במקום ריבוע</span>
              <PencilArrow className="note-arrow" from={[92, 8]} to={[20, 50]} />
            </div>
            <div className="note-b hand">
              <span>מחיר גדול, בלי לחפש</span>
              <PencilArrow className="note-arrow" from={[90, 10]} to={[14, 44]} seed={24} />
            </div>
            <div className="note-c hand">
              <span>כפתור אחד שאי אפשר לפספס</span>
              <PencilArrow className="note-arrow" from={[86, 46]} to={[10, 12]} seed={27} />
            </div>
            <div className="note-d hand">
              <span>לראות כל הזמנה ברגע שהיא נכנסת</span>
            </div>
          </div>
        </div>

        {/* Product world: the same copy in ink, clipped to the left of the seam. */}
        <div className="world world--ink on-ink" data-ink aria-hidden="true">
          <HeroCopy real={false} />
        </div>

        {/* The objects that cross between worlds. */}
        <div className="objects">
          <svg className="frames" data-frames aria-hidden="true">
            <defs>
              <clipPath id="clip-ink" data-clip-ink>
                <rect x="0" y="0" width="0" height="0" />
              </clipPath>
              <clipPath id="clip-paper" data-clip-paper>
                <rect x="0" y="0" width="0" height="0" />
              </clipPath>
            </defs>
            <g data-frames-ink clipPath="url(#clip-ink)" />
            <g data-frames-paper clipPath="url(#clip-paper)" />
            <g data-loops />
          </svg>

          {/* Frame boxes: invisible; the engine draws their outlines. */}
          <div className="fb fb-browser" data-frame="browser" data-radius="18" />
          <div className="fb fb-phone" data-frame="phone" data-radius="30" />
          <div className="fb fb-tile" data-frame="tile" data-radius="16" />

          {/* Nav: a scribble becomes the bar. */}
          <div className="mo" data-mo>
            <div className="sk sk-logo" data-sk aria-hidden="true">
              <div data-face className="sk-logo-face">
                <Ring className="ring-art" seed={8} />
                <span className="hand">לוגו</span>
              </div>
            </div>
            <div className="pr pr-logo" data-pr>
              <div data-face className="pr-logo-face">
                <span className="dot" aria-hidden="true" />
                פינה
              </div>
            </div>
          </div>
          <div className="mo" data-mo>
            <div className="sk sk-links" data-sk aria-hidden="true">
              <div data-face>
                <Squiggle w={160} seed={4} />
              </div>
            </div>
            <div className="pr pr-links" data-pr>
              <div data-face className="pr-links-face">
                <span>תפריט</span>
                <span>שעות</span>
                <span>איפה אנחנו</span>
              </div>
            </div>
          </div>
          <div className="mo" data-mo>
            <div className="sk sk-cart" data-sk aria-hidden="true">
              <div data-face className="sk-cart-face hand">
                <PencilBox w={90} h={40} seed={44} className="box" />
                סל ({count})
              </div>
            </div>
            <div className="pr pr-cart" data-pr>
              <div data-face className="pr-cart-face">
                הזמנות
                <span className="badge nums" key={count}>
                  {count}
                </span>
              </div>
            </div>
          </div>
          <div className="mo" data-mo>
            <div className="sk sk-headline" data-sk aria-hidden="true">
              <div data-face className="hand sk-headline-face">
                כותרת: קפה מוכן כשמגיעים
                <Underline w={180} />
              </div>
            </div>
            <div className="pr pr-headline" data-pr>
              <div data-face className="pr-headline-face">קפה מוכן כשאתם מגיעים.</div>
            </div>
          </div>

          {/* Note → product card. */}
          <div className="mo" data-mo data-rot="-5">
            <div className="sk sk-card sk-card-a" data-sk aria-hidden="true">
              <div data-face className="note-paper">
                <span className="hand note-paper-title">פלאט וייט</span>
                <span className="hand note-paper-sub">חלב שיבולת?</span>
                <CupDrawing className="note-paper-art" />
              </div>
            </div>
            <div className="pr pr-card pr-card-a" data-pr>
              <div data-face data-ui className="card">
                <Image src="/hero/flat-white.webp" alt="פלאט וייט בכוס חרסינה, מלמעלה" width={720} height={720} className="card-img" priority sizes="(max-width: 760px) 40vw, 22vw" />
                <div className="card-body">
                  <span className="card-title">פלאט וייט</span>
                  <span className="card-meta">חלב שיבולת · 240 מ״ל</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mo" data-mo data-rot="-9">
            <div className="sk sk-price sk-price-a" data-sk aria-hidden="true">
              <div data-face className="hand sk-price-face">
                14 ₪?
                <Underline w={90} seed={33} />
              </div>
            </div>
            <div className="pr pr-price pr-price-a" data-pr>
              <div data-face className="price nums">₪14</div>
            </div>
          </div>

          <div className="mo" data-mo data-rot="4">
            <div className="sk sk-card sk-card-b" data-sk aria-hidden="true">
              <div data-face className="note-paper note-paper--b">
                <span className="hand note-paper-title">קר ברו</span>
                <span className="hand note-paper-sub">עם הרבה קרח</span>
                <GlassDrawing className="note-paper-art" />
              </div>
            </div>
            <div className="pr pr-card pr-card-b" data-pr>
              <div data-face data-ui className="card">
                <Image src="/hero/cold-brew.webp" alt="כוס קפה קר עם קרח על צלוחית" width={720} height={720} className="card-img" sizes="22vw" />
                <div className="card-body">
                  <span className="card-title">קר ברו</span>
                  <span className="card-meta">על קרח · 300 מ״ל</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mo" data-mo data-rot="6">
            <div className="sk sk-price sk-price-b" data-sk aria-hidden="true">
              <div data-face className="hand sk-price-face">16?</div>
            </div>
            <div className="pr pr-price pr-price-b" data-pr>
              <div data-face className="price nums">₪16</div>
            </div>
          </div>

          {/* Phone: the app. */}
          <div className="mo" data-mo>
            <div className="sk sk-phone-head" data-sk aria-hidden="true">
              <div data-face className="hand sk-phone-head-face">
                ההזמנה שלי
                <Squiggle w={120} lines={2} seed={9} />
              </div>
            </div>
            <div className="pr pr-phone-head" data-pr>
              <div data-face className="pr-phone-head-face">
                <span className="ph-title">ההזמנה שלך</span>
                <span className="ph-sub">איסוף מהעגלה בעוד 6 דק׳</span>
              </div>
            </div>
          </div>
          <div className="mo" data-mo data-rot="-3">
            <div className="sk sk-item" data-sk aria-hidden="true">
              <div data-face className="sk-item-face hand">
                <CupDrawing className="mini" seed={14} />
                פלאט וייט ×1
              </div>
            </div>
            <div className="pr pr-item" data-pr>
              <div data-face className="pr-item-face">
                <Image src="/hero/flat-white.webp" alt="" width={720} height={720} className="thumb" sizes="48px" />
                <span className="grow">פלאט וייט</span>
                <span className="nums">₪14</span>
              </div>
            </div>
          </div>

          {/* The circled word becomes the button. Both worlds take the order. */}
          <div className="mo" data-mo data-loop>
            <button
              type="button"
              className="sk sk-btn"
              data-sk
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => order("sketch")}
            >
              <span data-face className="hand sk-btn-face">
                להזמין!
              </span>
            </button>
            <button
              type="button"
              className="pr pr-btn"
              data-pr
              onClick={(e) => order(e.currentTarget.dataset.world === "product" ? "product" : "sketch")}
            >
              <span data-face className="pr-btn-face">
                הזמנה · <span className="nums">₪14</span>
              </span>
            </button>
          </div>
          <div className={`order-ack hand ${justOrdered === "sketch" ? "is-on" : ""}`} aria-hidden="true">
            נרשם בעיפרון
          </div>

          {/* The system behind it: who ordered what. */}
          <div className="mo" data-mo>
            <div className="sk sk-tile-head" data-sk aria-hidden="true">
              <div data-face className="hand sk-tile-head-face">הזמנות היום</div>
            </div>
            <div className="pr pr-tile-head" data-pr>
              <div data-face className="pr-tile-head-face">
                <span>הזמנות היום</span>
                <span className="live-tag">
                  <span className="dot" aria-hidden="true" />
                  בזמן אמת
                </span>
              </div>
            </div>
          </div>
          <div className="mo" data-mo data-rot="-2">
            <div className="sk sk-tile-count" data-sk aria-hidden="true">
              <div data-face>
                <Tally count={count} />
              </div>
            </div>
            <div className="pr pr-tile-count" data-pr>
              <div data-face className="tile-count nums" aria-live="polite">
                <span key={count} className="tick">
                  {count}
                </span>
                <span className="sr-only"> הזמנות היום</span>
              </div>
            </div>
          </div>
          <div className="mo" data-mo>
            <div className="sk sk-tile-list" data-sk aria-hidden="true">
              <div data-face>
                <Squiggle w={150} lines={3} seed={19} />
              </div>
            </div>
            <div className="pr pr-tile-list" data-pr>
              <ol data-face className="tile-list" aria-label="ההזמנות האחרונות">
                {orders.slice(0, 3).map((o) => (
                  <li key={o.id}>
                    <span>{o.item}</span>
                    <span className="nums">{o.time}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* The seam. */}
        <div className="seam" data-seam>
          <span className="seam-line" aria-hidden="true" />
          <button
            type="button"
            className="knob"
            data-knob
            role="slider"
            aria-label="הקו בין הסקיצה למוצר"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(INITIAL * 100)}
            aria-orientation="horizontal"
          >
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="M15 13l-7 7 7 7M25 13l7 7-7 7" />
            </svg>
          </button>
          <span className="knob-hint hand" aria-hidden="true">
            גררו
          </span>
        </div>
      </div>

      <div className="stage-foot">
        <p className="stage-caption">
          רעיון לדוגמה: אפליקציית הזמנות לעגלת קפה. הכפתור עובד בשני העולמות, נסו.
        </p>
        <div className="worlds" role="group" aria-label="הצגת עולם">
          <button type="button" className="world-btn" aria-pressed={world === "sketch"} onClick={() => goTo(0)}>
            סקיצה
          </button>
          <button type="button" className="world-btn" aria-pressed={world === "mix"} onClick={() => goTo(0.5)}>
            חצי־חצי
          </button>
          <button type="button" className="world-btn world-btn--live" aria-pressed={world === "product"} onClick={() => goTo(1)}>
            מוצר
          </button>
        </div>
      </div>
    </section>
  );
}
