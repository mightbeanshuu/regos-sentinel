"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Motion bound to data: these hooks exist so that the only things that ever move on
 * the dashboard are values that actually changed. Animating an unchanged value is a
 * false signal, and false signals are how an operator learns to ignore a screen.
 *
 * Both hooks resolve instantly under `prefers-reduced-motion`. The resting state is
 * always the true value — if JavaScript never runs, the correct number is what shows.
 */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Tween a number from its previous value to the new one. First render is instant. */
export function useTween(value: number, durationMs = 500): number {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (value === previous.current) return;
    const from = previous.current;
    previous.current = value;

    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }

    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - started) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return shown;
}

/**
 * A key that increments each time the watched value changes (never on first render).
 * Used to remount a span carrying the `flash-change` class, which re-runs its CSS
 * animation — a brief highlight that decays back to the resting ink.
 */
export function useChangeKey(watched: string | number | boolean | null | undefined): number {
  const [key, setKey] = useState(0);
  const previous = useRef(watched);

  useEffect(() => {
    if (previous.current !== watched) {
      previous.current = watched;
      setKey((current) => current + 1);
    }
  }, [watched]);

  return key;
}
