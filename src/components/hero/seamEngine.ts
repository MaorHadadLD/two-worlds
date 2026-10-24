import { clamp, lerpPts, loop, pencil, pill, roundedRect, smoothstep, toPath, type Pt } from "@/lib/sketch";

/**
 * The seam between the two worlds.
 *
 * One number, p (0 = all sketch, 1 = all product), places a vertical seam
 * across the stage. Everything left of the seam is product, everything right
 * of it is sketch. Objects do not flip all at once: each one transforms when
 * the seam passes over it, so dragging feels like inking the idea by hand.
 *
 * Nothing here goes through React. Pointer and key input write a target,
 * one requestAnimationFrame writes transforms, opacity, clip-path and path data.
 */

type Box = { x: number; y: number; w: number; h: number };

type Morph = {
  sk: HTMLElement;
  pr: HTMLElement;
  skFace: HTMLElement;
  prFace: HTMLElement;
  rot: number;
  skBox: Box;
  prBox: Box;
  cx: number;
  active: boolean;
};

type Frame = {
  el: HTMLElement;
  radius: number;
  seed: number;
  prod: Pt[];
  traces: Pt[][];
  fill: SVGPathElement;
  line: SVGPathElement;
  pencils: SVGPathElement[];
  active: boolean;
};

type Loop = {
  morph: Morph;
  path: SVGPathElement;
  fill: SVGPathElement;
  sketch: Pt[];
  product: Pt[];
};

const SVG = "http://www.w3.org/2000/svg";
const PENCIL: [number, number, number] = [39, 91, 166];
const LIVE: [number, number, number] = [201, 240, 62];

export type SeamOptions = {
  initial: number;
  reducedMotion: boolean;
  onChange?: (p: number) => void;
  onFirstTouch?: () => void;
};

export class SeamEngine {
  private stage: HTMLElement;
  private ink: HTMLElement;
  private seam: HTMLElement;
  private knob: HTMLElement;
  private svg: SVGSVGElement;
  private clipInk: SVGRectElement;
  private clipPaper: SVGRectElement;
  private morphs: Morph[] = [];
  private frames: Frame[] = [];
  private loops: Loop[] = [];
  private W = 0;
  private H = 0;
  private p: number;
  private raf = 0;
  private tween = 0;
  private reduced: boolean;
  private opts: SeamOptions;
  private touched = false;
  private ro: ResizeObserver;
  private drag: { id: number; x0: number; y0: number; p0: number; live: boolean } | null = null;
  private cleanup: (() => void)[] = [];
  private created: Element[] = [];

  constructor(stage: HTMLElement, opts: SeamOptions) {
    this.stage = stage;
    this.opts = opts;
    this.p = opts.initial;
    this.reduced = opts.reducedMotion;
    this.ink = stage.querySelector("[data-ink]") as HTMLElement;
    this.seam = stage.querySelector("[data-seam]") as HTMLElement;
    this.knob = stage.querySelector("[data-knob]") as HTMLElement;
    this.svg = stage.querySelector("[data-frames]") as SVGSVGElement;
    this.clipInk = this.svg.querySelector("[data-clip-ink] rect") as SVGRectElement;
    this.clipPaper = this.svg.querySelector("[data-clip-paper] rect") as SVGRectElement;

    this.collect();
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(stage);
    this.measure();
    this.bind();
    stage.dataset.ready = "true";
  }

  /* ---------- setup ---------- */

  private collect() {
    this.stage.querySelectorAll<HTMLElement>("[data-mo]").forEach((el) => {
      const sk = el.querySelector<HTMLElement>(":scope > [data-sk]");
      const pr = el.querySelector<HTMLElement>(":scope > [data-pr]");
      if (!sk || !pr) return;
      const m: Morph = {
        sk,
        pr,
        skFace: sk.querySelector<HTMLElement>("[data-face]") ?? sk,
        prFace: pr.querySelector<HTMLElement>("[data-face]") ?? pr,
        rot: Number(el.dataset.rot ?? 0),
        skBox: { x: 0, y: 0, w: 0, h: 0 },
        prBox: { x: 0, y: 0, w: 0, h: 0 },
        cx: 0,
        active: true,
      };
      this.morphs.push(m);
      if (el.dataset.loop !== undefined) {
        const fill = document.createElementNS(SVG, "path");
        fill.setAttribute("class", "loop-fill");
        const path = document.createElementNS(SVG, "path");
        path.setAttribute("class", "loop-line");
        this.svg.querySelector("[data-loops]")!.append(fill, path);
        this.created.push(fill, path);
        this.loops.push({ morph: m, path, fill, sketch: [], product: [] });
      }
    });

    const groupInk = this.svg.querySelector("[data-frames-ink]")!;
    const groupPaper = this.svg.querySelector("[data-frames-paper]")!;
    this.stage.querySelectorAll<HTMLElement>("[data-frame]").forEach((el, i) => {
      const fill = document.createElementNS(SVG, "path");
      fill.setAttribute("class", `frame-fill frame-fill--${el.dataset.frame}`);
      const line = document.createElementNS(SVG, "path");
      line.setAttribute("class", "frame-line");
      groupInk.append(fill, line);
      this.created.push(fill, line);
      const pencils = [0, 1].map((k) => {
        const p = document.createElementNS(SVG, "path");
        p.setAttribute("class", `frame-pencil${k ? " frame-pencil--second" : ""}`);
        groupPaper.append(p);
        this.created.push(p);
        return p;
      });
      this.frames.push({
        el,
        radius: Number(el.dataset.radius ?? 14),
        seed: 101 + i * 37,
        prod: [],
        traces: [],
        fill,
        line,
        pencils,
        active: true,
      });
    });
  }

  private box(el: HTMLElement): Box {
    // offset* ignore transforms, so measuring never fights the animation.
    return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
  }

  measure() {
    this.W = this.stage.clientWidth;
    this.H = this.stage.clientHeight;
    this.svg.setAttribute("viewBox", `0 0 ${this.W} ${this.H}`);
    this.clipInk.setAttribute("height", String(this.H));
    this.clipPaper.setAttribute("height", String(this.H));

    for (const m of this.morphs) {
      m.skBox = this.box(m.sk);
      m.prBox = this.box(m.pr);
      m.active = m.skBox.w > 0 && m.prBox.w > 0;
      m.cx = (m.skBox.x + m.skBox.w / 2 + m.prBox.x + m.prBox.w / 2) / 2;
    }
    for (const f of this.frames) {
      const b = this.box(f.el);
      f.active = b.w > 0;
      const n = Math.max(80, Math.round((b.w + b.h) / 9));
      f.prod = roundedRect(b.x, b.y, b.w, b.h, f.radius, n);
      const amp = Math.min(4.5, 1.8 + b.w / 260);
      f.traces = [pencil(f.prod, f.seed, amp), pencil(f.prod, f.seed + 13, amp * 0.8)];
      if (!f.active) {
        f.fill.setAttribute("d", "");
        f.line.setAttribute("d", "");
        f.pencils.forEach((p) => p.setAttribute("d", ""));
      }
    }
    for (const l of this.loops) {
      const s = l.morph.skBox;
      const p = l.morph.prBox;
      const n = 72;
      l.sketch = loop(s.x + s.w / 2, s.y + s.h / 2, s.w / 2 + 6, s.h / 2 + 2, n, 17);
      l.product = pill(p.x, p.y, p.w, p.h, n);
    }
    this.render();
  }

  /* ---------- state ---------- */

  get value() {
    return this.p;
  }

  set(p: number) {
    this.p = clamp(p);
    this.schedule();
  }

  /** Glide to a value. Used by the world buttons and the one-time demo, never by keys. */
  glide(target: number, ms = 720): Promise<void> {
    cancelAnimationFrame(this.tween);
    if (this.reduced) {
      this.set(target);
      return Promise.resolve();
    }
    const from = this.p;
    const start = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    return new Promise((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        this.set(from + (target - from) * ease(t));
        if (t < 1) this.tween = requestAnimationFrame(step);
        else resolve();
      };
      this.tween = requestAnimationFrame(step);
    });
  }

  stopGlide() {
    cancelAnimationFrame(this.tween);
  }

  /** Has the visitor taken the handle yet? The demo yields the moment they do. */
  get hasBeenTouched() {
    return this.touched;
  }

  private touch() {
    if (this.touched) return;
    this.touched = true;
    this.stopGlide();
    this.stage.dataset.touched = "true";
    this.opts.onFirstTouch?.();
  }

  private schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  /* ---------- render ---------- */

  private render() {
    const { W } = this;
    if (!W) return;
    const seamX = this.p * W;
    const zone = Math.max(110, W * 0.13);
    const tAt = (x: number) => smoothstep((seamX - x) / zone + 0.5);

    this.ink.style.clipPath = `inset(0 ${(W - seamX).toFixed(1)}px 0 0)`;
    this.seam.style.transform = `translate3d(${seamX.toFixed(1)}px,0,0)`;
    // At the edges the line may leave the stage, the knob never does.
    const keep = 34;
    this.knob.style.translate = `${(clamp(seamX, keep, W - keep) - seamX).toFixed(1)}px 0`;
    this.clipInk.setAttribute("width", seamX.toFixed(1));
    this.clipPaper.setAttribute("x", seamX.toFixed(1));
    this.clipPaper.setAttribute("width", Math.max(0, W - seamX).toFixed(1));

    const pct = Math.round(this.p * 100);
    this.knob.setAttribute("aria-valuenow", String(pct));
    this.knob.setAttribute("aria-valuetext", `${pct}% מוצר, ${100 - pct}% סקיצה`);

    for (const f of this.frames) {
      if (!f.active) continue;
      const a = f.traces[0];
      const b = f.traces[1];
      const morphedA: Pt[] = new Array(a.length);
      const morphedB: Pt[] = new Array(b.length);
      for (let i = 0; i < a.length; i++) {
        const t = tAt(f.prod[i][0]);
        const [px, py] = f.prod[i];
        morphedA[i] = [a[i][0] + (px - a[i][0]) * t, a[i][1] + (py - a[i][1]) * t];
        morphedB[i] = [b[i][0] + (px - b[i][0]) * t, b[i][1] + (py - b[i][1]) * t];
      }
      const dA = toPath(morphedA);
      f.fill.setAttribute("d", dA);
      f.line.setAttribute("d", dA);
      f.pencils[0].setAttribute("d", dA);
      f.pencils[1].setAttribute("d", toPath(morphedB));
    }

    for (const m of this.morphs) {
      if (!m.active) continue;
      const t = tAt(m.cx);
      this.paintMorph(m, t);
    }

    for (const l of this.loops) {
      if (!l.morph.active) continue;
      const t = tAt(l.morph.cx);
      const pts = lerpPts(l.sketch, l.product, this.reduced ? (t > 0.5 ? 1 : 0) : t);
      const d = toPath(pts, false);
      l.path.setAttribute("d", d);
      const c = PENCIL.map((v, i) => Math.round(v + (LIVE[i] - v) * t));
      l.path.style.stroke = `rgb(${c[0]},${c[1]},${c[2]})`;
      l.path.style.strokeWidth = String(1.8 + t * 0.6);
      l.fill.setAttribute("d", d);
      l.fill.style.opacity = String(smoothstep((t - 0.55) / 0.35));
    }

    this.opts.onChange?.(this.p);
  }

  private paintMorph(m: Morph, t: number) {
    const fadeIn = smoothstep((t - 0.3) / 0.4);
    m.skFace.style.opacity = String(1 - fadeIn);
    m.prFace.style.opacity = String(fadeIn);
    m.pr.style.pointerEvents = fadeIn > 0.5 ? "auto" : "none";
    m.sk.style.pointerEvents = fadeIn > 0.5 ? "none" : "auto";
    m.pr.dataset.world = fadeIn > 0.5 ? "product" : "sketch";

    if (this.reduced) {
      m.sk.style.transform = m.rot ? `rotate(${m.rot}deg)` : "";
      m.pr.style.transform = "";
      return;
    }

    const s = m.skBox;
    const p = m.prBox;
    const dx = s.x + s.w / 2 - (p.x + p.w / 2);
    const dy = s.y + s.h / 2 - (p.y + p.h / 2);
    const k = Math.sqrt((s.w * s.h) / (p.w * p.h)) || 1;
    // The object lifts a little while it changes worlds: weight, then landing.
    const lift = 1 + 0.05 * Math.sin(Math.PI * t);
    const rot = m.rot * (1 - t);
    const u = 1 - t;

    const prScale = (k + (1 - k) * t) * lift;
    m.pr.style.transform = `translate3d(${(dx * u).toFixed(2)}px,${(dy * u).toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${prScale.toFixed(4)})`;
    const skScale = (1 + (1 / k - 1) * t) * lift;
    m.sk.style.transform = `translate3d(${(-dx * t).toFixed(2)}px,${(-dy * t).toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${skScale.toFixed(4)})`;
    m.pr.style.zIndex = t > 0.02 && t < 0.98 ? "3" : "";
  }

  /* ---------- input ---------- */

  private bind() {
    const knob = this.knob;
    const stage = this.stage;

    const onKey = (e: KeyboardEvent) => {
      // Keys move the seam instantly: keyboard actions are never animated.
      const step = e.shiftKey ? 0.1 : 0.04;
      let next: number | null = null;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") next = this.p + step;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = this.p - step;
      if (e.key === "PageUp") next = this.p + 0.2;
      if (e.key === "PageDown") next = this.p - 0.2;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = 1;
      if (next === null) return;
      e.preventDefault();
      this.touch();
      this.set(next);
    };
    knob.addEventListener("keydown", onKey);

    const isControl = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("button:not([data-knob]), a, input, textarea, [data-nodrag]");

    const onDown = (e: PointerEvent) => {
      if (this.drag || (e.pointerType === "mouse" && e.button !== 0)) return;
      const onKnob = e.target instanceof Element && !!e.target.closest("[data-seam]");
      if (!onKnob && isControl(e.target)) return;
      this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: this.p, live: onKnob };
      if (onKnob) {
        this.touch();
        stage.dataset.dragging = "true";
        (e.target as Element).setPointerCapture?.(e.pointerId);
        // Grabbing the seam moves it under the finger at once.
        const rect = stage.getBoundingClientRect();
        this.drag.p0 = clamp((e.clientX - rect.left) / rect.width);
        this.drag.x0 = e.clientX;
        this.set(this.drag.p0);
      }
    };

    const onMove = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      if (!d.live) {
        // Anywhere on the stage, a horizontal drag takes the seam; a vertical one is a scroll.
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          this.drag = null;
          return;
        }
        if (Math.abs(dx) < 8) return;
        d.live = true;
        this.touch();
        stage.dataset.dragging = "true";
        stage.setPointerCapture?.(e.pointerId);
      }
      const w = stage.clientWidth || 1;
      let next = d.p0 + dx / w;
      // Rubber-band past the edges instead of a hard stop.
      if (next < 0) next = -Math.min(0.04, -next * 0.25);
      if (next > 1) next = 1 + Math.min(0.04, (next - 1) * 0.25);
      this.p = next;
      this.schedule();
    };

    const onUp = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || e.pointerId !== d.id) return;
      this.drag = null;
      delete stage.dataset.dragging;
      if (this.p < 0 || this.p > 1) this.glide(clamp(this.p), 260);
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    // Prevent native image/text drag from stealing the gesture.
    const noDrag = (e: Event) => e.preventDefault();
    stage.addEventListener("dragstart", noDrag);

    this.cleanup.push(() => {
      knob.removeEventListener("keydown", onKey);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("dragstart", noDrag);
    });
  }

  /** Called when the visitor uses a world button: it counts as taking control. */
  claim() {
    this.touch();
  }

  setReduced(r: boolean) {
    this.reduced = r;
    this.render();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.tween);
    this.ro.disconnect();
    this.cleanup.forEach((f) => f());
    this.created.forEach((el) => el.remove());
    delete this.stage.dataset.ready;
  }
}
