"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type COBEOptions } from "cobe";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type LatLng = [number, number];

export const CORK: LatLng = [51.8985, -8.4756];
export const FRANKFURT: LatLng = [50.1109, 8.6821];
/** Marked at the country's centre — the desk is described, not pinned. */
export const INDIA: LatLng = [22.9734, 78.6569];

/** Longitude that should face the camera → cobe's phi. */
function phiFor(lng: number) {
  return Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2);
}

const BRAND: [number, number, number] = [0.65, 0.004, 0.004];
const ARC: [number, number, number] = [0.92, 0.26, 0.26];

function palette(dark: boolean): Partial<COBEOptions> {
  return dark
    ? {
        dark: 1,
        baseColor: [0.34, 0.3, 0.3],
        glowColor: [0.08, 0.06, 0.06],
        mapBrightness: 4.5,
        mapBaseBrightness: 0.05,
        diffuse: 1.8,
      }
    : {
        dark: 0,
        baseColor: [0.9, 0.87, 0.86],
        glowColor: [1, 1, 1],
        mapBrightness: 9,
        mapBaseBrightness: 0.08,
        diffuse: 1.15,
      };
}

function isDarkTheme() {
  const cls = document.documentElement.classList;
  return cls.contains("dark") || cls.contains("dark-mode");
}

/**
 * WebGL globe (cobe 2, ~5 kB) showing Cork, Frankfurt and India with arcs
 * between them. cobe 2 renders only when `update()` is called, so this
 * component owns the animation frame: it oscillates gently so both ends of
 * each arc stay visible, supports dragging, idles when off screen, and holds
 * still when the visitor prefers reduced motion.
 */
export function Globe({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(wrapRef, { amount: 0.15 });

  const inViewRef = useRef(inView);
  inViewRef.current = inView;
  const reducedRef = useRef(reduced);
  reducedRef.current = Boolean(reduced);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    // cobe multiplies width/height by devicePixelRatio itself.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = Math.max(wrap.clientWidth, 1);
    let renderedSize = size;
    let t = 0;
    let pointerStart: number | null = null;
    let dragOffset = 0;
    let dragBase = 0;
    let raf = 0;
    let revealed = false;

    const centre = phiFor(34); // midway between Cork and India
    const theta = 0.3;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size,
      height: size,
      phi: centre,
      theta,
      mapSamples: 18000,
      markerColor: BRAND,
      markers: [
        { location: CORK, size: 0.075 },
        { location: FRANKFURT, size: 0.045 },
        { location: INDIA, size: 0.075 },
      ],
      arcs: [
        { from: CORK, to: INDIA },
        { from: CORK, to: FRANKFURT },
      ],
      arcColor: ARC,
      arcWidth: 0.42,
      arcHeight: 0.26,
      markerElevation: 0.015,
      opacity: 0.96,
      scale: 1,
      offset: [0, 0],
      ...(palette(isDarkTheme()) as Pick<
        COBEOptions,
        "dark" | "baseColor" | "glowColor" | "mapBrightness" | "diffuse"
      >),
    });

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!inViewRef.current && revealed) return;
      if (!reducedRef.current && pointerStart === null) t += 0.0045;
      const next: Partial<COBEOptions> = {
        phi: centre + Math.sin(t) * 0.38 + dragOffset,
      };
      if (size !== renderedSize) {
        next.width = size;
        next.height = size;
        renderedSize = size;
      }
      globe.update(next);
      if (!revealed) {
        revealed = true;
        canvas.style.opacity = "1";
      }
    };
    raf = requestAnimationFrame(frame);

    const onPointerDown = (e: PointerEvent) => {
      pointerStart = e.clientX;
      dragBase = dragOffset;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerStart === null) return;
      dragOffset = dragBase + (e.clientX - pointerStart) / 220;
    };
    const onPointerUp = () => {
      pointerStart = null;
      canvas.style.cursor = "grab";
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const resize = new ResizeObserver(() => {
      size = Math.max(wrap.clientWidth, 1);
    });
    resize.observe(wrap);

    const theme = new MutationObserver(() => globe.update(palette(isDarkTheme())));
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      theme.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      globe.destroy();
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative aspect-square w-full", className)}>
      <canvas
        ref={canvasRef}
        aria-label="Globe showing Cork, Frankfurt and India, with arcs from Cork to each"
        role="img"
        className="h-full w-full cursor-grab opacity-0 transition-opacity duration-1000 [contain:layout_paint_size] [touch-action:pan-y]"
      />
    </div>
  );
}
