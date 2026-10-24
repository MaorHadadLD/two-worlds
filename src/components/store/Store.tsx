"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PencilBox, Squiggle, Underline } from "@/components/sketch/Pencil";
import { price, products, type Product } from "@/lib/catalog";
import { PROTEIN_MARKET_URL } from "@/lib/contact";
import { stroke } from "@/lib/sketch";
import "./store.css";

type Line = { id: string; qty: number; leaving?: boolean };

/** A part of the page that exists twice: as a pencil note and as the thing itself. */
function Ink({ r, sketch, children, className = "" }: { r: number; sketch: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`ink-part ${className}`} style={{ ["--r" as string]: r }}>
      <div className="ip-sk" aria-hidden="true">
        {sketch}
      </div>
      <div className="ip-pr">{children}</div>
    </div>
  );
}

function Minus() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10h10" />
    </svg>
  );
}
function Plus() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10h10M10 5v10" />
    </svg>
  );
}
function Cross() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" />
    </svg>
  );
}

const byId = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;

export default function Store() {
  const [selected, setSelected] = useState(products[0].id);
  const [lines, setLines] = useState<Line[]>([]);
  const [status, setStatus] = useState("");
  const [demoNote, setDemoNote] = useState(false);
  const [bump, setBump] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const product = byId[selected];
  const live = lines.filter((l) => !l.leaving);
  const count = live.reduce((s, l) => s + l.qty, 0);
  const total = live.reduce((s, l) => s + l.qty * byId[l.id].price, 0);
  const qtyOf = (id: string) => live.find((l) => l.id === id)?.qty ?? 0;

  const summary = (n: number, t: number) => (n === 0 ? "הסל ריק" : `בסל ${n === 1 ? "פריט אחד" : `${n} פריטים`}, ${price(t)}`);

  function setQty(id: string, qty: number, verb: string) {
    setDemoNote(false);
    const exists = lines.find((l) => l.id === id && !l.leaving);
    let next: Line[];
    if (qty <= 0) {
      // Leave for a moment so the line can fold away instead of vanishing.
      next = lines.map((l) => (l.id === id ? { ...l, leaving: true } : l));
      const t = window.setTimeout(() => setLines((p) => p.filter((l) => !(l.id === id && l.leaving))), 240);
      timers.current.push(t);
    } else if (exists) {
      next = lines.map((l) => (l.id === id && !l.leaving ? { ...l, qty } : l));
    } else {
      next = [...lines.filter((l) => l.id !== id), { id, qty }];
    }
    setLines(next);
    const kept = next.filter((l) => !l.leaving);
    const n = kept.reduce((s, l) => s + l.qty, 0);
    const t = kept.reduce((s, l) => s + l.qty * byId[l.id].price, 0);
    setStatus(`${verb}: ${byId[id].name}. ${summary(n, t)}.`);
    setBump((b) => b + 1);
  }

  const plateStyle = useMemo(() => ({ ["--plate" as string]: product.plate }), [product.plate]);

  return (
    <section id="store" className="chapter store" aria-labelledby="store-title">
      <div className="wrap store-intro" data-enter>
        <h2 id="store-title" className="chapter-title" data-part style={{ ["--i" as string]: 0 }}>
          מרעיון לחנות
        </h2>
        <p className="chapter-lead" data-part style={{ ["--i" as string]: 1 }}>
          סקיצה של עמוד מוצר הופכת לחנות שעובדת, תוך כדי גלילה. בצד המוגמר אפשר לבחור מוצר, להוסיף לסל, לשנות כמות ולהסיר. המוצרים מתוך <bdi>Protein Market</bdi>, חנות הדגמה שבניתי; המחירים לדוגמה ואין חיוב.
        </p>
      </div>

      <div className="store-panel on-ink">
        <div className="store-col">
          <Ink
            r={1}
            className="ip-tabs"
            sketch={
              <div className="ss-tabs">
                {products.map((p, i) => (
                  <Squiggle key={p.id} w={70} seed={40 + i} />
                ))}
              </div>
            }
          >
            <div className="tabs" role="group" aria-label="בחירת מוצר">
              {products.map((p) => (
                <button key={p.id} type="button" className="tab" aria-pressed={p.id === selected} onClick={() => setSelected(p.id)}>
                  {p.short}
                </button>
              ))}
            </div>
          </Ink>

          <Ink
            r={2}
            sketch={
              <div className="ss-title hand">
                שם המוצר, גדול
                <Underline w={200} seed={52} />
              </div>
            }
          >
            <h3 className="product-title">
              <bdi>{product.brand} {product.name}</bdi>
            </h3>
          </Ink>

          <Ink r={3} sketch={<Squiggle w={220} lines={2} seed={57} className="ss-meta" />}>
            <p className="product-meta">
              {product.kind} · {product.flavor} · {product.size}
              {product.protein ? (
                <>
                  <br />
                  {product.protein}
                </>
              ) : null}
            </p>
          </Ink>

          <Ink r={4} sketch={<div className="ss-price hand">₪ ??</div>}>
            <p className="product-price nums" aria-label={`מחיר לדוגמה: ${price(product.price)}`}>
              {price(product.price)}
            </p>
          </Ink>

          <Ink
            r={5}
            className="ip-actions"
            sketch={
              <div className="ss-actions hand">
                <span>
                  <PencilBox w={160} h={56} seed={61} r={26} className="ss-box" />
                  להוסיף לסל!
                </span>
                <span>
                  <PencilBox w={160} h={56} seed={62} r={26} className="ss-box" />
                  כמה?
                </span>
              </div>
            }
          >
            <div className="actions">
              <button type="button" className="btn btn--live act-add" onClick={() => setQty(product.id, qtyOf(product.id) + 1, "נוסף לסל")}>
                הוספה לסל
              </button>
              <div className="stepper" role="group" aria-label={`כמות בסל: ${product.name}`}>
                <button type="button" onClick={() => setQty(product.id, qtyOf(product.id) - 1, qtyOf(product.id) - 1 <= 0 ? "הוסר מהסל" : "הכמות עודכנה")} disabled={qtyOf(product.id) === 0} aria-label="הפחתת כמות">
                  <Minus />
                </button>
                <span className="nums" aria-live="off">
                  {qtyOf(product.id)} בסל
                </span>
                <button type="button" onClick={() => setQty(product.id, qtyOf(product.id) + 1, "הכמות עודכנה")} aria-label="הוספת יחידה">
                  <Plus />
                </button>
              </div>
            </div>
          </Ink>

          <Ink
            r={6}
            className="ip-cart"
            sketch={
              <div className="ss-cart hand">
                <PencilBox w={300} h={150} seed={66} className="ss-box" />
                <span>מה בסל + סה״כ</span>
              </div>
            }
          >
            <div className="cart" aria-labelledby="cart-title">
              <div className="cart-head">
                <h4 id="cart-title">הסל</h4>
                <span className="cart-count nums" key={bump}>
                  {count === 0 ? "ריק" : count === 1 ? "פריט אחד" : `${count} פריטים`}
                </span>
              </div>
              {lines.length === 0 ? (
                <p className="cart-empty">עדיין אין כאן כלום. בחרו מוצר ולחצו על הוספה לסל.</p>
              ) : (
                <ul className="cart-lines">
                  {lines.map((l) => {
                    const p = byId[l.id];
                    return (
                      <li key={l.id} className="cart-line" data-leaving={l.leaving ? "" : undefined}>
                        <div className="cart-line-in">
                          <span className="cart-thumb" style={{ background: p.plate }}>
                            <Image src={p.image.src} alt="" width={p.image.w} height={p.image.h} sizes="44px" />
                          </span>
                          <span className="cart-name">
                            <bdi>{p.name}</bdi>
                            <span>{p.flavor}</span>
                          </span>
                          <span className="stepper stepper--sm" role="group" aria-label={`כמות: ${p.name}`}>
                            <button type="button" aria-label={`הפחתת כמות: ${p.name}`} onClick={() => setQty(p.id, l.qty - 1, l.qty - 1 <= 0 ? "הוסר מהסל" : "הכמות עודכנה")}>
                              <Minus />
                            </button>
                            <span className="nums">{l.qty}</span>
                            <button type="button" aria-label={`הוספת יחידה: ${p.name}`} onClick={() => setQty(p.id, l.qty + 1, "הכמות עודכנה")}>
                              <Plus />
                            </button>
                          </span>
                          <span className="cart-sum nums">{price(p.price * l.qty)}</span>
                          <button type="button" className="cart-remove" aria-label={`הסרה מהסל: ${p.name}`} onClick={() => setQty(p.id, 0, "הוסר מהסל")}>
                            <Cross />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="cart-total">
                <span>סה״כ</span>
                <span className="nums">{price(total)}</span>
              </div>
              <button type="button" className="btn btn--ghost-ink cart-go" disabled={count === 0} onClick={() => setDemoNote(true)}>
                להמשך הזמנה
              </button>
              <p className="cart-note" role="status">
                {demoNote ? "זו חנות הדגמה: לא נוצרה הזמנה ולא בוצע חיוב." : ""}
              </p>
            </div>
          </Ink>
        </div>

        <Ink
          r={0}
          className="ip-plate"
          sketch={
            <div className="ss-plate">
              <PencilBox w={400} h={400} seed={71} r={4} className="ss-box" />
              <svg className="pencil ss-x" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true">
                <path d={stroke(8, 8, 392, 392, 72, 0.01)} />
                <path d={stroke(392, 8, 8, 392, 73, 0.01)} />
              </svg>
              <span className="hand">תמונה גדולה של המוצר</span>
            </div>
          }
        >
          <figure className="plate" style={plateStyle}>
            <Image
              key={product.id}
              src={product.image.src}
              alt={`${product.brand} ${product.name}, ${product.flavor}, ${product.size}`}
              width={product.image.w}
              height={product.image.h}
              className="plate-img"
              sizes="(max-width: 900px) 70vw, 34vw"
            />
            <figcaption>
              צילום מוצר: <bdi>Open Food Facts</bdi>, <bdi>CC BY-SA 3.0</bdi>
            </figcaption>
          </figure>
        </Ink>

        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="wrap shots" data-enter>
        <div className="shots-head" data-part style={{ ["--i" as string]: 0 }}>
          <h3 className="shots-title">הפרויקט עצמו</h3>
          <div className="shots-copy">
          <p>
            <bdi>Protein Market</bdi> היא חנות הדגמה שבניתי ב־<bdi>Next.js</bdi> וב־<bdi>TypeScript</bdi>, בעברית ומימין לשמאל, עם חיפוש, סינון, סל ותשלום לדוגמה. אלה צילומי מסך אמיתיים ממנה; החנות שלמעלה היא ממשק המחשה שנבנה לדף הזה, עם אותם מוצרים.
          </p>
          <a className="shots-live" href={PROTEIN_MARKET_URL} target="_blank" rel="noreferrer">
            <span>
              לאתר החי של <bdi>Protein Market</bdi>
            </span>
            <span aria-hidden="true">←</span>
            <span className="sr-only"> (נפתח בלשונית חדשה)</span>
          </a>
          </div>
        </div>
        <figure className="shot shot--home" data-part style={{ ["--i" as string]: 1 }}>
          <Image src="/pm/shots/home-desktop.jpg" alt="צילום מסך של עמוד הבית של Protein Market במחשב: הכותרת ״המדף של מי שמתאמן״ ליד אריזות מוצרים על מדף" width={1440} height={900} sizes="(max-width: 900px) 92vw, 44vw" />
          <figcaption>עמוד הבית · צילום מסך</figcaption>
        </figure>
        <figure className="shot shot--catalog" data-part style={{ ["--i" as string]: 2 }}>
          <Image src="/pm/shots/catalog-desktop.jpg" alt="צילום מסך של הקטלוג של Protein Market: מוצרים על מדף עם תגית מחיר לכל אחד" width={1440} height={900} sizes="(max-width: 900px) 70vw, 44vw" />
          <figcaption>הקטלוג · צילום מסך</figcaption>
        </figure>
        <figure className="shot shot--mobile" data-part style={{ ["--i" as string]: 3 }}>
          <Image src="/pm/shots/home-mobile.jpg" alt="צילום מסך של Protein Market בטלפון" width={780} height={1688} sizes="(max-width: 900px) 22vw, 13vw" />
          <figcaption>בטלפון · צילום מסך</figcaption>
        </figure>
      </div>
    </section>
  );
}
