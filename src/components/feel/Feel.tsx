"use client";

import { useEffect, useRef, useState } from "react";
import { loop, toPath } from "@/lib/sketch";
import "./feel.css";

type Phase = "idle" | "loading" | "success" | "error";
type Skin = "sketch" | "product";

const NETWORK_MS = 1400;
const SUCCESS_HOLD_MS = 2400;

const ROWS: { group: string; items: { id: string; text: string; time: string }[] }[] = [
  {
    group: "לחיצה",
    items: [
      { id: "press", text: "הכפתור שוקע מעט, כדי שתרגישו שהוא נלחץ", time: "0.14 שנ׳" },
      { id: "swap", text: "הטקסט מפנה מקום לסימן טעינה", time: "0.22 שנ׳" },
    ],
  },
  {
    group: "המתנה",
    items: [{ id: "wait", text: "אי אפשר ללחוץ פעמיים בטעות", time: "עד התשובה" }],
  },
  {
    group: "הצלחה",
    items: [
      { id: "check", text: "וי מצטייר, והכפתור אומר מה קרה", time: "0.4 שנ׳" },
      { id: "reset", text: "חוזר למצב רגיל", time: "אחרי 2.4 שנ׳" },
    ],
  },
  {
    group: "תקלה",
    items: [
      { id: "shake", text: "רעידה קצרה והסבר במילים", time: "0.3 שנ׳" },
      { id: "retry", text: "אפשר לנסות שוב מיד", time: "מיד" },
    ],
  },
];

const RING = toPath(loop(60, 22, 56, 19, 44, 3), false);

export default function Feel() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pressed, setPressed] = useState(false);
  const [skin, setSkin] = useState<Skin>("product");
  const [fail, setFail] = useState(false);
  const [slow, setSlow] = useState(false);
  const [active, setActive] = useState<string[]>([]);
  const [shakeKey, setShakeKey] = useState(0);
  const timers = useRef<number[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const k = slow ? 4 : 1;
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  // A short horizontal shake says "that didn't work" before the words do. Never under reduced motion.
  useEffect(() => {
    const el = btnRef.current;
    if (!shakeKey || !el || skin !== "product") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
      { duration: 300 * k, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    return () => a.cancel();
  }, [shakeKey, skin, k]);

  function run() {
    if (phase === "loading") return;
    clear();
    setPhase("loading");
    setActive(["press", "swap", "wait"]);
    later(() => {
      if (fail) {
        setPhase("error");
        setShakeKey((n) => n + 1);
        setActive(["shake", "retry"]);
      } else {
        setPhase("success");
        setActive(["check", "reset"]);
        later(() => {
          setPhase("idle");
          setActive([]);
        }, SUCCESS_HOLD_MS * k);
      }
    }, NETWORK_MS * k);
  }

  function reset(next: Partial<{ skin: Skin; fail: boolean; slow: boolean }>) {
    clear();
    setPhase("idle");
    setActive([]);
    if (next.skin) setSkin(next.skin);
    if (next.fail !== undefined) setFail(next.fail);
    if (next.slow !== undefined) setSlow(next.slow);
  }

  const label =
    skin === "sketch"
      ? phase === "success"
        ? "הועלה"
        : phase === "error"
          ? "שגיאה"
          : "העלאה לאוויר"
      : phase === "success"
        ? "באוויר"
        : phase === "error"
          ? "לנסות שוב"
          : "העלאה לאוויר";

  const message =
    phase === "success"
      ? skin === "product"
        ? "גרסה 2.4 עלתה לאוויר. אפשר לחזור לעבודה."
        : ""
      : phase === "error"
        ? skin === "product"
          ? "לא הצלחנו להתחבר לשרת, ושום דבר לא השתנה באתר. נסו שוב."
          : ""
        : "";

  return (
    <section id="feel" className="chapter feel" aria-labelledby="feel-title" style={{ ["--k" as string]: k }}>
      <div className="wrap feel-grid">
        <div className="feel-copy" data-enter>
          <h2 id="feel-title" className="chapter-title" data-part style={{ ["--i" as string]: 0 }}>
            ממסך לחוויה
          </h2>
          <p className="chapter-lead" data-part style={{ ["--i" as string]: 1 }}>
            אותו כפתור יכול להיות מלבן שמחליף טקסט, או תגובה שמרגישה שמישהו הקשיב. ההבדל בפרטים: כמה הוא שוקע, מה קורה בזמן ההמתנה, ואיך נראות הצלחה ותקלה. נסו את שני העולמות.
          </p>

          <div className="device" data-skin={skin} data-part style={{ ["--i" as string]: 2 }}>
            <div className="device-head">
              <span className="device-title">גרסה 2.4</span>
              <span className="device-sub">{skin === "product" ? "מוכנה להעלאה" : "מוכנה?"}</span>
            </div>

            <button
              ref={btnRef}
              type="button"
              className="deploy"
              data-phase={phase}
              data-pressed={pressed ? "" : undefined}
              aria-busy={phase === "loading"}
              aria-disabled={phase === "loading"}
              onPointerDown={() => setPressed(true)}
              onPointerUp={() => setPressed(false)}
              onPointerLeave={() => setPressed(false)}
              onClick={run}
            >
              <span className="deploy-label">{skin === "product" && phase === "loading" ? <span className="sr-only">מעלה…</span> : label}</span>
              {skin === "product" ? (
                <>
                  <span className="deploy-spin" aria-hidden="true" />
                  <svg className="deploy-check" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
                  </svg>
                </>
              ) : null}
            </button>

            <p className="device-msg" role="status">
              {message}
            </p>

            <div className="device-controls">
              <div className="skin" role="group" aria-label="איך הכפתור מתנהג">
                <button type="button" aria-pressed={skin === "sketch"} onClick={() => reset({ skin: "sketch" })}>
                  כמו בסקיצה
                </button>
                <button type="button" aria-pressed={skin === "product"} onClick={() => reset({ skin: "product" })}>
                  כמו במוצר
                </button>
              </div>
              <label className="check">
                <input type="checkbox" checked={fail} onChange={(e) => reset({ fail: e.target.checked })} />
                <span>לדמות תקלה ברשת</span>
              </label>
              <label className="check">
                <input type="checkbox" checked={slow} onChange={(e) => reset({ slow: e.target.checked })} />
                <span>הילוך איטי ×4</span>
              </label>
            </div>
          </div>
        </div>

        <div className="slip-wrap">
          <div className="slip" data-skin={skin}>
            <h3 className="slip-title">מה קורה כשלוחצים</h3>
            {ROWS.map((g) => (
              <div key={g.group} className="slip-group">
                <h4>{g.group}</h4>
                <ul>
                  {g.items.map((r) => {
                    const on = skin === "product" && active.includes(r.id);
                    return (
                      <li key={r.id} data-on={on ? "" : undefined}>
                        <span className="slip-text">{r.text}</span>
                        <span className="leader" aria-hidden="true" />
                        <span className="slip-time nums">
                          {r.time}
                          <svg className="slip-ring pencil" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">
                            <path d={RING} pathLength={1} />
                          </svg>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <p className="slip-total">
              <span>התשובה הראשונה ללחיצה</span>
              <span className="nums">אחרי 0.14 שנ׳</span>
            </p>
            <p className={`slip-note hand ${skin === "sketch" ? "is-on" : ""}`} aria-hidden={skin !== "sketch"}>
              בסקיצה הכפתור לא עונה. לוחצים שוב?
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
