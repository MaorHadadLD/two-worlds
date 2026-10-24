"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./board.css";

type ColId = "todo" | "doing" | "review" | "done";
type Cols = Record<ColId, string[]>;

const COLUMNS: { id: ColId; name: string; limit?: number }[] = [
  { id: "todo", name: "לעשות" },
  { id: "doing", name: "בעבודה", limit: 3 },
  { id: "review", name: "בבדיקה" },
  { id: "done", name: "הושלם" },
];

const TASKS: { id: string; title: string; note: string; tag: string }[] = [
  { id: "t1", title: "טופס הרשמה שמסביר שגיאות", note: "טופס הרשמה!! השגיאות לא ברורות", tag: "אתר" },
  { id: "t2", title: "חיבור תשלומים לסל", note: "לחבר תשלומים???", tag: "חנות" },
  { id: "t3", title: "הסל נחתך בטלפון", note: "באג: הסל נחתך בטלפון", tag: "באג" },
  { id: "t4", title: "בדיקות למסך התשלום", note: "לכתוב בדיקות (מתי?)", tag: "איכות" },
  { id: "t5", title: "מסך הזמנות לצוות", note: "מסך לצוות: מי הזמין מה", tag: "מערכת" },
  { id: "t6", title: "התראה כשהמלאי נגמר", note: "מלאי נגמר ← התראה", tag: "מערכת" },
  { id: "t7", title: "העלאה לאוויר", note: "להעלות לאוויר!", tag: "שחרור" },
];
const byId = Object.fromEntries(TASKS.map((t) => [t.id, t]));

const START: Cols = { todo: ["t2", "t6", "t7"], doing: ["t1", "t5"], review: ["t3"], done: ["t4"] };

/** Where each note lies in the pile: x and y as a share of the free area, and a tilt. */
const SCATTER: [number, number, number][] = [
  [0.06, 0.12, -7],
  [0.3, 0.02, 5],
  [0.55, 0.2, -3],
  [0.82, 0.05, 8],
  [0.18, 0.62, 4],
  [0.45, 0.68, -8],
  [0.72, 0.6, 3],
];

type Rect = { x: number; y: number; w: number; h: number };

function layout(cols: Cols, W: number) {
  const narrow = W < 720;
  const gap = narrow ? 10 : 14;
  const head = narrow ? 56 : 68;
  const cardH = narrow ? 104 : 112;
  const step = cardH + 10;
  const cards: Record<string, Rect & { col: ColId; index: number }> = {};
  const colRects: Record<ColId, Rect> = {} as Record<ColId, Rect>;
  let height = 0;
  if (!narrow) {
    const colW = (W - gap * 3) / 4;
    const longest = Math.max(4, ...COLUMNS.map((c) => cols[c.id].length));
    height = head + longest * step + 18;
    COLUMNS.forEach((c, i) => {
      // Right to left: the first stage sits at the reading start.
      const x = W - (i + 1) * colW - i * gap;
      colRects[c.id] = { x, y: 0, w: colW, h: height };
      cols[c.id].forEach((id, k) => {
        cards[id] = { x: x + 10, y: head + k * step, w: colW - 20, h: cardH, col: c.id, index: k };
      });
    });
  } else {
    let y = 0;
    COLUMNS.forEach((c) => {
      const n = cols[c.id].length;
      const h = head + Math.max(1, n) * step + 6;
      colRects[c.id] = { x: 0, y, w: W, h };
      cols[c.id].forEach((id, k) => {
        cards[id] = { x: 10, y: y + head + k * step, w: W - 20, h: cardH, col: c.id, index: k };
      });
      y += h + gap;
    });
    height = y - gap;
  }
  return { cards, colRects, height, narrow, cardH };
}

function move(cols: Cols, id: string, to: ColId, index?: number): Cols {
  const next = { ...cols } as Cols;
  for (const c of COLUMNS) next[c.id] = cols[c.id].filter((x) => x !== id);
  const list = [...next[to]];
  list.splice(index ?? list.length, 0, id);
  next[to] = list;
  return next;
}

const colOf = (cols: Cols, id: string) => COLUMNS.find((c) => cols[c.id].includes(id))!.id;
const nameOf = (id: ColId) => COLUMNS.find((c) => c.id === id)!.name;

function ArrowIcon({ dir }: { dir: "next" | "prev" }) {
  // In RTL the next stage is to the left.
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {dir === "next" ? <path d="M15 10H5m4-4-4 4 4 4" /> : <path d="M5 10h10m-4-4 4 4-4 4" />}
    </svg>
  );
}

const lifted = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0) rotate(-1.5deg) scale(1.03)`;

export default function Board() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  const [organized, setOrganized] = useState(false);
  const [cols, setCols] = useState<Cols>(START);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<{ id: string; col: ColId; index: number } | null>(null);
  // The dragged card renders its pickup transform; pointer moves then write to the element directly.
  const [dragging, setDragging] = useState<{ id: string; transform: string } | null>(null);
  const dragId = dragging?.id ?? null;
  const [landed, setLanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const cardEls = useRef<Record<string, HTMLDivElement | null>>({});
  const drag = useRef<{ id: string; px: number; py: number; ox: number; oy: number; started: boolean; pointer: number } | null>(null);
  const dragPos = useRef({ x: 0, y: 0 });
  const previewRef = useRef<{ id: string; col: ColId; index: number } | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // The layout the cards are heading to: the committed columns, or the preview while dragging.
  const shown = useMemo(() => (preview ? move(cols, preview.id, preview.col, preview.index) : cols), [cols, preview]);
  const L = useMemo(() => layout(shown, W || 1200), [shown, W]);

  const done = cols.done.length;
  const doing = cols.doing.length;
  const overLimit = doing > (COLUMNS[1].limit ?? 99);

  const commit = useCallback(
    (id: string, to: ColId, index?: number) => {
      const from = colOf(cols, id);
      const next = move(cols, id, to, index);
      setCols(next);
      setLanded(id);
      const t = byId[id].title;
      if (from !== to) {
        const extra = to === "doing" && next.doing.length > 3 ? " יש עכשיו יותר משלוש משימות בעבודה." : to === "done" ? ` הושלמו ${next.done.length} מתוך ${TASKS.length}.` : "";
        setStatus(`״${t}״ עברה ל״${nameOf(to)}״.${extra}`);
      } else {
        setStatus(`״${t}״ נשארה ב״${nameOf(to)}״, במקום ${(index ?? 0) + 1}.`);
      }
    },
    [cols],
  );

  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => setLanded(null), 900);
    return () => clearTimeout(t);
  }, [landed, cols]);

  function toggle() {
    setOrganized((o) => !o);
    setToggling(true);
    setStatus(organized ? "הפתקים חזרו לערימה." : "הפתקים סודרו בלוח: לעשות, בעבודה, בבדיקה, הושלם.");
  }

  useEffect(() => {
    if (!toggling) return;
    const t = setTimeout(() => setToggling(false), 1100);
    return () => clearTimeout(t);
  }, [toggling, organized]);

  function step(id: string, dir: 1 | -1, e: React.MouseEvent<HTMLButtonElement>) {
    const from = COLUMNS.findIndex((c) => c.id === colOf(cols, id));
    const to = from + dir;
    if (to < 0 || to >= COLUMNS.length) return;
    commit(id, COLUMNS[to].id);
    // Keep keyboard focus useful when the card reaches an end of the flow.
    if (to === 0 || to === COLUMNS.length - 1) {
      const card = e.currentTarget.closest(".task");
      requestAnimationFrame(() => card?.querySelector<HTMLButtonElement>(`[data-dir="${dir === 1 ? "prev" : "next"}"]`)?.focus());
    }
  }

  /* ---------- Pointer drag (mouse and pen; touch uses the buttons and keeps the page scrolling) ---------- */

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    if (!organized || e.pointerType === "touch" || e.button !== 0) return;
    if ((e.target as Element).closest("button")) return;
    const r = L.cards[id];
    drag.current = { id, px: e.clientX, py: e.clientY, ox: r.x, oy: r.y, started: false, pointer: e.pointerId };
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointer) return;
      const dx = e.clientX - d.px;
      const dy = e.clientY - d.py;
      if (!d.started) {
        if (Math.hypot(dx, dy) < 5) return;
        d.started = true;
        setDragging({ id: d.id, transform: lifted(d.ox + dx, d.oy + dy) });
        previewRef.current = { id: d.id, col: colOf(cols, d.id), index: cols[colOf(cols, d.id)].indexOf(d.id) };
        setPreview(previewRef.current);
      }
      dragPos.current = { x: d.ox + dx, y: d.oy + dy };
      const el = cardEls.current[d.id];
      if (el) el.style.transform = lifted(dragPos.current.x, dragPos.current.y);

      // Which column is under the pointer, and where in it.
      const box = boxRef.current!.getBoundingClientRect();
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      const narrow = W < 720;
      let target: ColId = colOf(cols, d.id);
      for (const c of COLUMNS) {
        const r = L.colRects[c.id];
        if (narrow ? py >= r.y && py <= r.y + r.h : px >= r.x && px <= r.x + r.w) target = c.id;
      }
      const others = cols[target].filter((x) => x !== d.id);
      const colTop = narrow ? L.colRects[target].y : 0;
      const head = narrow ? 56 : 68;
      const stepH = L.cardH + 10;
      const index = Math.max(0, Math.min(others.length, Math.round((py - colTop - head - L.cardH / 2) / stepH)));
      const p = previewRef.current;
      if (!p || p.col !== target || p.index !== index) {
        previewRef.current = { id: d.id, col: target, index };
        setPreview(previewRef.current);
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointer) return;
      drag.current = null;
      if (!d.started) return;
      setDragging(null);
      const p = previewRef.current;
      previewRef.current = null;
      setPreview(null);
      if (p) commit(p.id, p.col, p.index);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [cols, L, W, commit]);

  /* ---------- Render ---------- */

  const pileH = L.narrow ? 640 : 560;
  const noteW = L.narrow ? 150 : 196;
  const noteH = L.narrow ? 128 : 160;

  function transformFor(id: string, i: number) {
    if (dragging && id === dragging.id) return dragging.transform;
    const r = L.cards[id];
    if (!organized) {
      const [fx, fy, rot] = SCATTER[i];
      const x = fx * Math.max(0, (W || 1200) - noteW) + noteW / 2 - r.w / 2;
      const y = fy * (pileH - noteH) + noteH / 2 - r.h / 2;
      return `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
    }
    return `translate3d(${r.x}px, ${r.y}px, 0)`;
  }

  return (
    <section id="flow" className="chapter flow" data-organized={organized ? "" : undefined} data-toggling={toggling ? "" : undefined} aria-labelledby="flow-title">
      <div className="wrap flow-head" data-enter>
        <div className="flow-intro" data-part style={{ ["--i" as string]: 0 }}>
          <h2 id="flow-title" className="chapter-title">
            מעומס לזרימה
          </h2>
          <p className="chapter-lead">
            רשימת משימות על פתקים היא התחלה. מערכת טובה נותנת לכל משימה מקום, ומראה מה תקוע, מה עמוס ומה כבר נגמר.
          </p>
        </div>
        <div className="flow-controls" data-part style={{ ["--i" as string]: 1 }}>
          <button type="button" className={`btn ${organized ? "btn--ghost-ink" : "btn--ink"} flow-toggle`} onClick={toggle} aria-pressed={organized}>
            {organized ? "להחזיר לבלגן" : "לסדר את הפתקים"}
          </button>
          <div className="flow-stats" aria-hidden={!organized}>
            <div className="meter" role="img" aria-label={`הושלמו ${done} מתוך ${TASKS.length}`}>
              <span style={{ transform: `scaleX(${done / TASKS.length})` }} />
            </div>
            <p className="nums">
              הושלמו {done} מתוך {TASKS.length}
              {overLimit ? <span className="flow-warn"> · יותר משלוש בעבודה במקביל</span> : null}
            </p>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div
          ref={boxRef}
          className="board on-ink"
          data-dragging={dragId ? "" : undefined}
          style={{ height: organized ? L.height : pileH }}
          role="region"
          aria-label={organized ? "לוח משימות" : "ערימת פתקים"}
        >
          {COLUMNS.map((c, i) => {
            const r = L.colRects[c.id];
            const count = shown[c.id].length;
            const warn = c.limit !== undefined && count > c.limit;
            return (
              <div
                key={c.id}
                className="col"
                data-warn={warn ? "" : undefined}
                data-over={preview && preview.col === c.id && dragId ? "" : undefined}
                style={{ transform: `translate3d(${r.x}px, ${r.y}px, 0)`, width: r.w, height: r.h, ["--i" as string]: i }}
                aria-hidden={!organized}
              >
                <div className="col-head">
                  <h3>{c.name}</h3>
                  <span className="col-count nums" key={count}>
                    {count}
                    {c.limit ? <span className="col-limit">/{c.limit}</span> : null}
                  </span>
                </div>
                {warn ? <p className="col-warn">עמוס. כדאי לסיים משימה לפני שמתחילים עוד אחת.</p> : null}
              </div>
            );
          })}

          {TASKS.map((t, i) => {
            const r = L.cards[t.id];
            const col = colOf(cols, t.id);
            const ci = COLUMNS.findIndex((c) => c.id === col);
            return (
              <div
                key={t.id}
                ref={(el) => {
                  cardEls.current[t.id] = el;
                }}
                className="task"
                data-col={col}
                data-drag={t.id === dragId ? "" : undefined}
                data-landed={t.id === landed ? "" : undefined}
                style={{ width: r.w, height: r.h, transform: transformFor(t.id, i), ["--i" as string]: i, ["--nw" as string]: `${noteW}px`, ["--nh" as string]: `${noteH}px` }}
                onPointerDown={(e) => onPointerDown(e, t.id)}
                role="group"
                aria-label={organized ? `${t.title}. ${nameOf(col)}, ${cols[col].indexOf(t.id) + 1} מתוך ${cols[col].length}` : t.title}
              >
                <div className="task-note hand" aria-hidden="true">
                  {t.note}
                </div>
                <div className="task-card">
                  <span className="task-tag">{t.tag}</span>
                  <p className="task-title">
                    {col === "done" ? (
                      <svg className="task-check" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 10.5l4 4 8-9" pathLength={1} />
                      </svg>
                    ) : null}
                    {t.title}
                  </p>
                  <div className="task-moves">
                    <button
                      type="button"
                      data-dir="prev"
                      disabled={!organized || ci === 0}
                      tabIndex={organized ? 0 : -1}
                      aria-label={ci > 0 ? `החזרה ל״${COLUMNS[ci - 1].name}״` : "אין שלב קודם"}
                      onClick={(e) => step(t.id, -1, e)}
                    >
                      <ArrowIcon dir="prev" />
                    </button>
                    <button
                      type="button"
                      data-dir="next"
                      disabled={!organized || ci === COLUMNS.length - 1}
                      tabIndex={organized ? 0 : -1}
                      aria-label={ci < COLUMNS.length - 1 ? `העברה ל״${COLUMNS[ci + 1].name}״` : "אין שלב הבא"}
                      onClick={(e) => step(t.id, 1, e)}
                    >
                      <ArrowIcon dir="next" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="flow-hint">
          {organized ? "גררו כרטיס לשלב אחר, או השתמשו בחצים שעל הכרטיס." : "שבעה פתקים, אין סדר. לחצו על ״לסדר את הפתקים״."}
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </section>
  );
}
