"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { EMAIL, mailto } from "@/lib/contact";
import { lerpPts, loop, roundedRect, toPath, type Pt } from "@/lib/sketch";
import "./choice.css";

type Side = "idea" | "product";

const SIDES: Record<Side, { label: string; sub: string; field: string; hint: string; placeholder: string; line: string }> = {
  idea: {
    label: "יש לי מחשבה ראשונית",
    sub: "רעיון, סקיצה, או רק תחושה שמשהו חסר.",
    field: "מה הרעיון?",
    hint: "משפט או שניים מספיקים: למי זה מיועד, ומה הדבר הראשון שזה צריך לעשות.",
    placeholder: "למשל: אפליקציה שבה לקוחות קבועים מזמינים קפה מראש ואוספים בלי תור",
    line: "הרעיון שלי עדיין במצב של מחשבה ראשונית.",
  },
  product: {
    label: "יש לי מוצר שצריך להתקדם",
    sub: "אתר, אפליקציה או מערכת שכבר קיימים, ורוצים שיעבדו טוב יותר.",
    field: "מה קיים היום, ומה תקוע?",
    hint: "מה המוצר עושה, מה מפריע לכם בו, ולאן אתם רוצים שיגיע.",
    placeholder: "למשל: יש לנו חנות אונליין, אבל רוב הלקוחות עוזבים בעמוד התשלום",
    line: "יש לי מוצר קיים שצריך להתקדם.",
  },
};

export default function Choice() {
  const [side, setSide] = useState<Side | null>(null);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const manualRef = useRef<HTMLTextAreaElement>(null);
  const morphRef = useRef(0);
  const labelRects = useRef<Partial<Record<Side, DOMRect>>>({});
  const ids = useId();

  const summary = side
    ? [`היי מאור,`, SIDES[side].line, "", text.trim() || "(עוד לא כתבתי)", "", contact.trim() ? `איך לחזור אליי: ${contact.trim()}` : ""]
        .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
        .join("\n")
        .trim()
    : "";

  /** The circle round the chosen answer tightens into the frame of the field you write in. */
  function morphTo(chosen: Side, from: DOMRect) {
    const svg = svgRef.current;
    const root = rootRef.current;
    if (!svg || !root) return;
    cancelAnimationFrame(morphRef.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      fieldRef.current?.focus({ preventScroll: true });
      if (reduce) return;
      const box = root.getBoundingClientRect();
      const to = field.getBoundingClientRect();
      const n = 96;
      const a: Pt[] = loop(from.left - box.left + from.width / 2, from.top - box.top + from.height / 2, from.width / 2 + 26, from.height / 2 + 18, n, 29);
      const ring = roundedRect(to.left - box.left, to.top - box.top, to.width, to.height, 14, Math.round(n / 1.08));
      const b: Pt[] = Array.from({ length: n }, (_, i) => ring[(i + ring.length - Math.round(ring.length * 0.06)) % ring.length]);
      const path = svg.querySelector("path")!;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      svg.dataset.side = chosen;
      svg.dataset.on = "";
      const start = performance.now();
      const ms = 820;
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        path.setAttribute("d", toPath(lerpPts(a, b, ease(t)), false));
        if (t < 1) morphRef.current = requestAnimationFrame(frame);
        else delete svg.dataset.on;
      };
      morphRef.current = requestAnimationFrame(frame);
    });
  }

  useEffect(() => () => cancelAnimationFrame(morphRef.current), []);

  function rememberLabels() {
    rootRef.current?.querySelectorAll<HTMLElement>("[data-label]").forEach((el) => {
      labelRects.current[el.dataset.label as Side] = el.getBoundingClientRect();
    });
  }

  // FLIP: each label travels from where it was to where the new layout puts it.
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    rootRef.current?.querySelectorAll<HTMLElement>("[data-label]").forEach((el) => {
      const before = labelRects.current[el.dataset.label as Side];
      if (!before) return;
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
        duration: 760,
        easing: "cubic-bezier(0.77, 0, 0.175, 1)",
      });
    });
    labelRects.current = {};
  }, [side]);

  function choose(s: Side, e: React.MouseEvent<HTMLButtonElement>) {
    const label = e.currentTarget.querySelector(".side-label")!.getBoundingClientRect();
    rememberLabels();
    setSide(s);
    setError("");
    setCopied(null);
    morphTo(s, label);
  }

  async function copy() {
    if (text.trim().length < 8) {
      setError("כתבו לפחות משפט אחד, כדי שיהיה ממה להתחיל.");
      fieldRef.current?.focus();
      return;
    }
    setError("");
    try {
      await navigator.clipboard.writeText(summary);
      setCopied("ok");
    } catch {
      setCopied("manual");
      requestAnimationFrame(() => manualRef.current?.select());
    }
  }

  const s = side ? SIDES[side] : null;

  return (
    <section id="start" className="chapter choose" aria-labelledby="start-title">
      <div className="wrap choose-head" data-enter>
        <h2 id="start-title" className="chapter-title" data-part style={{ ["--i" as string]: 0 }}>
          באיזה צד הרעיון שלכם נמצא עכשיו?
        </h2>
      </div>

      <div className="choice" ref={rootRef} data-side={side ?? undefined}>
        {(["idea", "product"] as Side[]).map((k) => (
          <div key={k} className={`side side--${k} ${k === "product" ? "on-ink" : ""}`} data-open={side === k ? "" : undefined} data-closed={side && side !== k ? "" : undefined} inert={!!side && side !== k}>
            <button
              type="button"
              data-label={k}
              className="side-btn"
              aria-expanded={side === k}
              aria-controls={`${ids}-form`}
              onClick={(e) => choose(k, e)}
              disabled={side === k}
            >
              <span className="side-label">
                {SIDES[k].label}
                <svg className="side-ring" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
                  <path d={toPath(loop(150, 40, 146, 36, 60, k === "idea" ? 5 : 9), false)} pathLength={1} />
                </svg>
              </span>
              <span className="side-sub">{SIDES[k].sub}</span>
            </button>
          </div>
        ))}

        <svg ref={svgRef} className="choice-morph" aria-hidden="true">
          <path />
        </svg>

        <div id={`${ids}-form`} className="brief" data-side={side ?? undefined} hidden={!side}>
          {s ? (
            <>
              <div className="brief-fields">
                <label className="field-label" htmlFor={`${ids}-text`}>
                  {s.field}
                </label>
                <p className="field-hint" id={`${ids}-hint`}>
                  {s.hint}
                </p>
                <textarea
                  ref={fieldRef}
                  id={`${ids}-text`}
                  className="field"
                  rows={5}
                  value={text}
                  placeholder={s.placeholder}
                  aria-describedby={`${ids}-hint${error ? ` ${ids}-err` : ""}`}
                  aria-invalid={!!error}
                  onChange={(e) => {
                    setText(e.target.value);
                    setCopied(null);
                    if (error && e.target.value.trim().length >= 8) setError("");
                  }}
                />
                {error ? (
                  <p className="field-error" id={`${ids}-err`}>
                    {error}
                  </p>
                ) : null}
                <label className="field-label field-label--sm" htmlFor={`${ids}-contact`}>
                  איך אפשר לחזור אליכם? <span>(לא חובה)</span>
                </label>
                <input
                  id={`${ids}-contact`}
                  className="field field--line"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setCopied(null);
                  }}
                  placeholder="שם, ודרך שנוח לכם לקבל בה תשובה"
                  autoComplete="name"
                />
                <div className="brief-actions">
                  <button type="button" className={`btn ${side === "product" ? "btn--live" : "btn--ink"} copy-btn`} onClick={copy} data-done={copied === "ok" ? "" : undefined}>
                    <span className="copy-a">העתקת התקציר</span>
                    <span className="copy-b" aria-hidden="true">
                      הועתק
                    </span>
                  </button>
                  <button type="button" className="text-btn" onClick={() => {
                      rememberLabels();
                      setSide(side === "idea" ? "product" : "idea");
                      setCopied(null);
                    }}>
                    בעצם, אני בצד השני
                  </button>
                </div>
                <p className="brief-note" role="status">
                  {copied === "ok" ? (
                    <>
                      התקציר הועתק. עכשיו אפשר להדביק אותו במייל אליי:{" "}
                      <a href={mailto("רעיון מהאתר", summary)}>
                        <bdi>{EMAIL}</bdi>
                      </a>
                      .
                    </>
                  ) : copied === "manual" ? (
                    <>
                      ההעתקה האוטומטית לא עבדה בדפדפן הזה. התקציר מסומן למטה: העתיקו אותו ידנית ושלחו ל־
                      <a href={mailto("רעיון מהאתר", summary)}>
                        <bdi>{EMAIL}</bdi>
                      </a>
                      .
                    </>
                  ) : (
                    <>
                      אין כאן שירות שליחה. הכפתור מעתיק את התקציר, ואתם שולחים אותו בעצמכם במייל ל־
                      <a href={mailto("רעיון מהאתר", summary)}>
                        <bdi>{EMAIL}</bdi>
                      </a>
                      . הקישור פותח את אפליקציית המייל שלכם עם התקציר כבר בפנים.
                    </>
                  )}
                </p>
                {copied === "manual" ? <textarea ref={manualRef} className="field manual" readOnly value={summary} rows={6} aria-label="התקציר להעתקה" /> : null}
              </div>
              <figure className="brief-preview" aria-label="התקציר שיועתק">
                <figcaption>התקציר שיועתק</figcaption>
                <div className="brief-text">{summary}</div>
              </figure>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
