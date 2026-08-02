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
  // Where the last animation left off, so a score change moves from the value on
  // screen to the new one. Replaying from zero would animate a change that never
  // happened — the score did not fall to nothing and climb back.
  const settledScore = useRef(0);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  // Three-quarter dial: the gap at the bottom stops it reading as a pie chart.
  const sweep = 0.75;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Offset only within the sweep: the dash pattern already ends at the
    // bottom gap, so shifting by the gap as well under-draws every score.
    const offsetFor = (score: number) =>
      circumference * sweep * (1 - score / 100);
    const from = settledScore.current;
    settledScore.current = report.score;

    if (reduced) {
      setShown(report.score);
      if (arcRef.current) {
        arcRef.current.style.strokeDashoffset = String(offsetFor(report.score));
      }
      return;
    }

    const counter = { value: from };
    const stop = animate(counter, {
      value: report.score,
      duration: from === 0 ? 1100 : 500,
      ease: "outExpo",
      onUpdate: () => setShown(Math.round(counter.value)),
    });

    if (arcRef.current) {
      animate(arcRef.current, {
        strokeDashoffset: [
          from === 0 ? circumference : offsetFor(from),
          offsetFor(report.score),
        ],
        duration: from === 0 ? 1300 : 600,
        ease: "outExpo",
      });
    }
    return () => { stop.pause(); };
  }, [report.score, circumference]);

  const tone =
    report.score >= 81 ? "ok" : report.score >= 61 ? "review" : "fail";

  return (
    <div className="cci cci--glass">
      <div className="cci-dial">
        <svg viewBox="0 0 200 200" role="img" aria-label={`Cyber Capability Index: ${report.score} out of 100. Band: ${report.band}.`}>
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
        <p className="micro">Band</p>
        <p className="cci-band">{report.band}</p>
        <p className="cci-meaning">{report.band_meaning}</p>
        {/* The ratio, glanceable. The sentence under it says what the gap means — the
            bar never replaces the words, it only makes them quicker to read. The inline
            track is used rather than the full `Meter` row because this column is only
            ~34ch wide: a three-column meter wraps its figure onto a line of its own. */}
        <p className="cci-coverage">
          Parameters assessed{" "}
          <span
            className="meter--inline"
            role="meter"
            aria-label="Parameters assessed"
            aria-valuenow={report.parameters_assessed}
            aria-valuemin={0}
            aria-valuemax={report.parameters_total}
            aria-valuetext={`${report.parameters_assessed} of ${report.parameters_total}`}
          >
            <span className="meter-track">
              <span
                className="meter-fill meter-fill--accent"
                style={{
                  transform: `scaleX(${
                    report.parameters_total > 0
                      ? report.parameters_assessed / report.parameters_total
                      : 0
                  })`,
                }}
              />
            </span>
            <span className="meter-figure">
              {report.parameters_assessed}/{report.parameters_total}
            </span>
          </span>
        </p>
        <p className="cci-coverage">
          Based on {report.parameters_assessed} of {report.parameters_total} parameters.
          The other {report.parameters_total - report.parameters_assessed} are not assessed —
          scoring them zero would be a guess.
        </p>
      </div>
    </div>
  );
}
