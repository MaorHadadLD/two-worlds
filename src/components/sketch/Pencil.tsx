import { arrow, loop, sketchBox, stroke, toPath } from "@/lib/sketch";

/** Every drawing in the sketch world goes through these few pencil marks. */

type Common = { className?: string; seed?: number };

export function PencilBox({ className, seed = 1, w = 200, h = 120, r = 8 }: Common & { w?: number; h?: number; r?: number }) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox={`-4 -4 ${w + 8} ${h + 8}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={sketchBox(0, 0, w, h, seed, 2.4, r)} />
      <path d={sketchBox(1, 1, w - 2, h - 2, seed + 11, 1.8, r)} opacity="0.55" />
    </svg>
  );
}

export function Squiggle({ className, seed = 3, lines = 1, w = 120 }: Common & { lines?: number; w?: number }) {
  const h = lines * 14;
  const paths: string[] = [];
  for (let l = 0; l < lines; l++) {
    const y = 7 + l * 14;
    const len = l === lines - 1 && lines > 1 ? w * 0.62 : w;
    let d = `M${w} ${y}`;
    const steps = Math.max(4, Math.round(len / 10));
    for (let i = 1; i <= steps; i++) {
      const x = w - (len * i) / steps;
      const yy = y + (i % 2 ? -3.2 : 3.2) * (0.7 + ((seed * (i + l)) % 5) / 10);
      d += `Q${(x + len / steps / 2).toFixed(1)} ${yy.toFixed(1)} ${x.toFixed(1)} ${y}`;
    }
    paths.push(d);
  }
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox={`-2 0 ${w + 4} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Ring({ className, seed = 5 }: Common) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true">
      <path d={toPath(loop(60, 30, 54, 25, 48, seed), false)} />
    </svg>
  );
}

/** A cup seen from above, on its saucer. */
export function CupDrawing({ className, seed = 7 }: Common) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox="0 0 120 120" aria-hidden="true">
      <path d={toPath(loop(60, 62, 50, 46, 56, seed), false)} />
      <path d={toPath(loop(58, 60, 30, 28, 44, seed + 2), false)} />
      <path d={toPath(loop(58, 60, 21, 19, 36, seed + 4), false)} opacity="0.6" />
      <path d={stroke(88, 64, 108, 70, seed + 6, 0.1)} />
      <path d={stroke(56, 50, 62, 66, seed + 8, 0.3)} opacity="0.7" />
      <path d={stroke(50, 56, 66, 58, seed + 9, 0.3)} opacity="0.7" />
    </svg>
  );
}

/** A glass with ice. */
export function GlassDrawing({ className, seed = 9 }: Common) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox="0 0 120 120" aria-hidden="true">
      <path d={stroke(30, 14, 38, 106, seed, 0.02)} />
      <path d={stroke(90, 14, 82, 106, seed + 1, 0.02)} />
      <path d={stroke(38, 106, 82, 106, seed + 2, 0.06)} />
      <path d={toPath(loop(60, 14, 30, 5, 30, seed + 3), false)} />
      <path d={sketchBox(42, 26, 16, 14, seed + 4, 1.2, 2)} />
      <path d={sketchBox(62, 34, 15, 13, seed + 5, 1.2, 2)} />
      <path d={stroke(36, 50, 84, 50, seed + 6, 0.08)} opacity="0.6" />
    </svg>
  );
}

/** Tally marks, grouped by five, the way an order gets counted on paper. */
export function Tally({ className, count, seed = 12 }: Common & { count: number }) {
  const marks: { d: string; key: string }[] = [];
  for (let i = 0; i < count; i++) {
    const group = Math.floor(i / 5);
    const inGroup = i % 5;
    const gx = group * 46;
    if (inGroup < 4) {
      const x = gx + 6 + inGroup * 8;
      marks.push({ d: stroke(x, 6, x + 1.5, 34, seed + i, 0.08), key: `m${i}` });
    } else {
      marks.push({ d: stroke(gx + 2, 30, gx + 36, 10, seed + i, 0.05), key: `m${i}` });
    }
  }
  const groups = Math.max(1, Math.ceil(count / 5));
  return (
    <svg className={`pencil tally ${className ?? ""}`} viewBox={`0 0 ${groups * 46} 40`} aria-hidden="true">
      {marks.map((m) => (
        <path key={m.key} d={m.d} pathLength={1} />
      ))}
    </svg>
  );
}

export function PencilArrow({
  className,
  seed = 21,
  from,
  to,
  box = [100, 60],
}: Common & { from: [number, number]; to: [number, number]; box?: [number, number] }) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox={`0 0 ${box[0]} ${box[1]}`} aria-hidden="true">
      <path d={arrow(from[0], from[1], to[0], to[1], seed)} />
    </svg>
  );
}

export function Underline({ className, seed = 31, w = 100 }: Common & { w?: number }) {
  return (
    <svg className={`pencil ${className ?? ""}`} viewBox={`0 0 ${w} 10`} preserveAspectRatio="none" aria-hidden="true">
      <path d={stroke(w - 2, 5, 2, 6, seed, 0.06)} />
    </svg>
  );
}
