"use client";

import { useEffect, useMemo, useState } from "react";

import { buildRegulationMap } from "../../lib/impactGraph";
import type { WorkspaceState } from "../../lib/types";
import { Disclosure } from "../ui";
import { MapInspector, RegulationMap2D } from "./RegulationMap2D";
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
export function RegulationMap({ state }: { state: WorkspaceState }) {
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
      <p className="meta">
        Run the check and approve the policy to populate the regulation map from this build.
      </p>
    );
  }

  return (
    <div className="reg-map">
      <div className="reg-map-toolbar">
        <p className="meta reg-map-toolbar-copy">
          Click any node to open it in the inspector. Lines follow real links between source
          spans, compiled requirements, controls, evidence, and tasks.
        </p>
        <div className="btn-row" role="group" aria-label="Map view">
          <button
            type="button"
            className={`btn btn--small${use3d ? " btn--primary" : " btn--secondary"}`}
            disabled={!webglOk || reducedMotion}
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
          This is the blast-radius view for an approved change: which SEBI passages fed which
          requirements, how they attach to controls, and what evidence and tasks moved. It is
          not decorative — every node is an object you can audit under Full record.
        </p>
      </Disclosure>
    </div>
  );
}
