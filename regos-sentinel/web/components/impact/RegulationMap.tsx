"use client";

import { useEffect, useMemo, useState } from "react";

import { buildRegulationMap } from "../../lib/impactGraph";
import type { WorkspaceState } from "../../lib/types";
import { Disclosure, Empty } from "../ui";
import { MapInspector, MapLegend, RegulationMap2D } from "./RegulationMap2D";
import { RegulationMap3D } from "./RegulationMap3D";

type ViewMode = "3d" | "2d";

function canUseWebGl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/**
 * Regulation / compliance impact map — the one Three.js surface in the product.
 * Nodes and edges are built only from workspace objects returned by the API.
 */
export function RegulationMap({
  state,
  onRunCheck,
}: {
  state: WorkspaceState;
  /** The page's own "run the check" action, when the caller has one. */
  onRunCheck?: () => void;
}) {
  const graph = useMemo(() => buildRegulationMap(state), [state]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("3d");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const reduced = media.matches;
      setReducedMotion(reduced);
      if (reduced) setMode("2d");
    };
    apply();
    media.addEventListener("change", apply);
    setWebglOk(canUseWebGl());
    if (!canUseWebGl()) setMode("2d");
    return () => media.removeEventListener("change", apply);
  }, []);

  const use3d = mode === "3d" && webglOk && !reducedMotion;

  if (graph.nodes.length === 0) {
    return (
      <Empty
        title="Nothing to map yet"
        hint="The map is drawn from what a review produced: run the check and approve the interpretation, and every passage, control, evidence item and task it touched appears here."
        action={
          onRunCheck && (
            <button type="button" className="btn btn--secondary btn--small" onClick={onRunCheck}>
              Run the check
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="reg-map">
      <div className="reg-map-toolbar">
        <p className="meta reg-map-toolbar-copy">
          Select any point to see its details below. The lines show real links between SEBI
          passages, the requirements drawn from them, the controls, the evidence and the tasks.
        </p>
        <div className="btn-row" role="group" aria-label="Choose how the map is drawn">
          <button
            type="button"
            className={`btn btn--small${use3d ? " btn--primary" : " btn--secondary"}`}
            disabled={!webglOk || reducedMotion}
            title={
              !webglOk || reducedMotion
                ? "3D view is off because your device or display settings do not support it."
                : undefined
            }
            onClick={() => setMode("3d")}
          >
            3D map
          </button>
          <button
            type="button"
            className={`btn btn--small${!use3d ? " btn--primary" : " btn--secondary"}`}
            onClick={() => setMode("2d")}
          >
            2D map
          </button>
        </div>
      </div>

      <MapLegend />

      {use3d ? (
        <RegulationMap3D
          graph={graph}
          selectedId={selectedId}
          onSelect={setSelectedId}
          reducedMotion={reducedMotion}
        />
      ) : (
        <RegulationMap2D
          graph={graph}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <MapInspector graph={graph} selectedId={selectedId} />

      <Disclosure summary="Why this map exists">
        <p className="meta">
          This shows everything an approved change touches: which SEBI passages produced which
          requirements, how those attach to controls, and what evidence and tasks moved as a
          result. Every point on the map is a record you can open under Full record.
        </p>
      </Disclosure>
    </div>
  );
}
