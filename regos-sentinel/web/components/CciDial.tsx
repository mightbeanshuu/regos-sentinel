"use client";

import { animate } from "animejs";
import { useEffect, useRef, useState } from "react";

import type { CciReport } from "../lib/types";

/**
 * The Cyber Capability Index, drawn as the one figure worth looking at first.
 *
 * The arc animates from zero on mount and whenever the score moves, which is not
 * decoration: the number changes as a person makes decisions elsewhere in the product,
 * and a figure that slides is a figure you notice has changed. It settles quickly and
 * then stays still — nothing here loops.
 *
 * The band under it does the real work. "78" means nothing to most readers; "Manageable"
 * is the word the framework uses, and the sentence under that says what it implies.
 */
export function CciDial({ report }: { report: CciReport }) {
  const arcRef = useRef<SVGCircleElement | null>(null);
  const [shown, setShown] = useState(0);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  // Three-quarter dial: the gap at the bottom stops it reading as a pie chart.
  const sweep = 0.75;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = circumference * sweep * (1 - report.score / 100);
    const settled = circumference * (1 - sweep);

    if (reduced) {
      setShown(report.score);
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = String(target + settled);
      }
      return;
    }

    const counter = { value: 0 };
    const stop = animate(counter, {
      value: report.score,
      duration: 1100,
      ease: "outExpo",
      onUpdate: () => setShown(Math.round(counter.value)),
    });

    if (arcRef.current) {
      animate(arcRef.current, {
        strokeDashoffset: [circumference, target + settled],
        duration: 1300,
        ease: "outExpo",
      });
    }
    return () => { stop.pause(); };
  }, [report.score, circumference]);

  const tone =
    report.score >= 81 ? "ok" : report.score >= 61 ? "review" : "fail";

  return (
    <div className="cci">
      <div className="cci-dial">
        <svg viewBox="0 0 200 200" role="img" aria-label={`Score ${report.score} of 100`}>
          <circle
            className="cci-track"
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={`${circumference * sweep} ${circumference}`}
          />
          <circle
            ref={arcRef}
            className={`cci-arc cci-arc--${tone}`}
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={`${circumference * sweep} ${circumference}`}
            strokeDashoffset={circumference}
          />
        </svg>
        <div className="cci-centre">
          <span className="cci-score">{shown}</span>
          <span className="cci-of">out of 100</span>
        </div>
      </div>

      <div className="cci-read">
        <p className="cci-band">{report.band}</p>
        <p className="cci-meaning">{report.band_meaning}</p>
        <p className="cci-coverage">
          Based on {report.parameters_assessed} of {report.parameters_total} parameters.
          The rest are marked not assessed — scoring them zero would be a guess.
        </p>
      </div>
    </div>
  );
}
