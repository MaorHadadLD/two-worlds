/**
 * Pencil geometry. Every sketched outline is a list of points that can be
 * interpolated, point by point, into its finished counterpart. Seeds are fixed
 * so server and client draw the same wobble.
 */

export type Pt = [number, number];

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points along a rounded rectangle, evenly spaced by arc length, clockwise from the top-left. */
export function roundedRect(x: number, y: number, w: number, h: number, r: number, n: number): Pt[] {
  r = Math.min(r, w / 2, h / 2);
  const straightW = w - 2 * r;
  const straightH = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const segs: { len: number; at: (u: number) => Pt }[] = [
    { len: straightW, at: (u) => [x + r + u * straightW, y] },
    { len: arc, at: (u) => corner(x + w - r, y + r, -Math.PI / 2 + u * (Math.PI / 2)) },
    { len: straightH, at: (u) => [x + w, y + r + u * straightH] },
    { len: arc, at: (u) => corner(x + w - r, y + h - r, u * (Math.PI / 2)) },
    { len: straightW, at: (u) => [x + w - r - u * straightW, y + h] },
    { len: arc, at: (u) => corner(x + r, y + h - r, Math.PI / 2 + u * (Math.PI / 2)) },
    { len: straightH, at: (u) => [x, y + h - r - u * straightH] },
    { len: arc, at: (u) => corner(x + r, y + r, Math.PI + u * (Math.PI / 2)) },
  ];
  function corner(cx: number, cy: number, a: number): Pt {
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  const total = segs.reduce((s, g) => s + g.len, 0);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    let d = (i / n) * total;
    for (const g of segs) {
      if (d <= g.len || g === segs[segs.length - 1]) {
        pts.push(g.at(g.len === 0 ? 0 : Math.min(1, d / g.len)));
        break;
      }
      d -= g.len;
    }
  }
  return pts;
}

/**
 * The hand-drawn version of a closed outline: pushed along its normals by a
 * smooth, seeded noise, slightly skewed and overshooting, the way a pencil
 * goes round a box without lifting.
 */
export function pencil(points: Pt[], seed: number, amp: number): Pt[] {
  const r = rng(seed);
  const waves = [0, 1, 2].map((k) => ({
    f: 1 + k * 2 + Math.floor(r() * 2),
    p: r() * Math.PI * 2,
    a: amp / (k + 1),
  }));
  const n = points.length;
  let cy = 0;
  for (const [, y] of points) cy += y / n;
  const skew = (r() - 0.5) * 0.03;
  return points.map(([x, y], i) => {
    const u = i / n;
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    const nx = ty / len;
    const ny = -tx / len;
    let off = 0;
    for (const w of waves) off += Math.sin(u * Math.PI * 2 * w.f + w.p) * w.a;
    const sx = x + (y - cy) * skew;
    return [sx + nx * off, y + ny * off];
  });
}

/** Points of a loose loop drawn round a word: a little more than one turn, ends overlapping. */
export function loop(cx: number, cy: number, rx: number, ry: number, n: number, seed: number): Pt[] {
  const r = rng(seed);
  const start = -Math.PI * 0.85 + r() * 0.3;
  const turn = Math.PI * 2 * 1.08;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const a = start + u * turn;
    const grow = 1 + (u - 0.5) * 0.12;
    const wob = 1 + Math.sin(u * 9 + seed) * 0.035;
    pts.push([cx + Math.cos(a) * rx * grow * wob, cy + Math.sin(a) * ry * grow * wob]);
  }
  return pts;
}

/**
 * The pill a loop tightens into: same point count and the same 1.08 turns, so
 * the overlapping ends of the pencil loop slide onto each other and close.
 */
export function pill(x: number, y: number, w: number, h: number, n: number): Pt[] {
  const base = Math.round(n / 1.08);
  const ring = roundedRect(x, y, w, h, h / 2, base);
  // The loop starts at the upper left; roundedRect starts where the top edge leaves the left cap.
  const offset = base - Math.round(base * 0.06);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) pts.push(ring[(i + offset) % base]);
  return pts;
}

export function lerpPts(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
}

/** A smooth path through the points (quadratic curves between midpoints). */
export function toPath(pts: Pt[], closed = true): string {
  const n = pts.length;
  if (n < 2) return "";
  const f = (v: number) => Math.round(v * 10) / 10;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (!closed) {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < n - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
    }
    d += `L${f(pts[n - 1][0])} ${f(pts[n - 1][1])}`;
    return d;
  }
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + "Z";
}

/** A single pencil stroke from A to B with a slight bow and wobble. */
export function stroke(x1: number, y1: number, x2: number, y2: number, seed: number, bow = 0.04): string {
  const r = rng(seed);
  const n = 10;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / (len || 1);
  const ny = (x2 - x1) / (len || 1);
  const b = (r() - 0.5) * 2 * bow * len;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const off = Math.sin(u * Math.PI) * b + (r() - 0.5) * Math.min(2, len * 0.01);
    pts.push([x1 + (x2 - x1) * u + nx * off, y1 + (y2 - y1) * u + ny * off]);
  }
  return toPath(pts, false);
}

/** A hand-drawn box as a path string, for static sketches. */
export function sketchBox(x: number, y: number, w: number, h: number, seed: number, amp = 2.2, r = 6): string {
  return toPath(pencil(roundedRect(x, y, w, h, r, 64), seed, amp));
}

/** An arrow: a bowed shaft and two short head strokes. */
export function arrow(x1: number, y1: number, x2: number, y2: number, seed: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 9;
  const l = [x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h];
  const rr = [x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h];
  return `${stroke(x1, y1, x2, y2, seed, 0.12)}M${l[0].toFixed(1)} ${l[1].toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${rr[0].toFixed(1)} ${rr[1].toFixed(1)}`;
}

export const smoothstep = (t: number) => {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
};

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
