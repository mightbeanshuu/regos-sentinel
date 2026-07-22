"use client";

import type { GraphNode, RegulationMapGraph } from "../../lib/impactGraph";
import { layoutRegulationMap } from "../../lib/impactGraph";
import { labelOf } from "../../lib/presentation";
import { StateLabel } from "../ui";

const KIND_LABEL: Record<GraphNode["kind"], string> = {
  source: "SEBI source span",
  obligation: "Compiled requirement",
  control: "Control",
  evidence: "Evidence",
  task: "Mandatory task",
};

const KIND_COLOR: Record<GraphNode["kind"], string> = {
  source: "var(--accent)",
  obligation: "var(--accent-deep)",
  control: "var(--teal, var(--ok))",
  evidence: "var(--review)",
  task: "var(--ink-2)",
};

export function RegulationMap2D({
  graph,
  selectedId,
  onSelect,
}: {
  graph: RegulationMapGraph;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const positions = layoutRegulationMap(graph);
  const width = 720;
  const height = 360;
  const scale = 42;

  const toSvg = (id: string) => {
    const pos = positions.get(id);
    if (!pos) return { x: width / 2, y: height / 2 };
    return {
      x: width / 2 + pos.x * scale,
      y: height / 2 - pos.z * scale * 0.55 + pos.y * scale * 0.35,
    };
  };

  return (
    <div className="reg-map-2d">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Regulation impact map"
        className="reg-map-svg"
      >
        {graph.edges.map((edge) => {
          const from = toSvg(edge.from);
          const to = toSvg(edge.to);
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="reg-map-edge"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {graph.nodes.map((node) => {
          const { x, y } = toSvg(node.id);
          const selected = selectedId === node.id;
          return (
            <g key={node.id}>
              <circle
                cx={x}
                cy={y}
                r={selected ? 14 : 11}
                className={`reg-map-node reg-map-node--${node.kind}${selected ? " reg-map-node--selected" : ""}`}
                style={{ fill: KIND_COLOR[node.kind] }}
                tabIndex={0}
                role="button"
                aria-label={`${KIND_LABEL[node.kind]}: ${node.label}`}
                onClick={() => onSelect(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(node.id);
                  }
                }}
              />
              <text x={x} y={y + 22} className="reg-map-label" textAnchor="middle">
                {node.id.length > 16 ? `${node.id.slice(0, 14)}…` : node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MapInspector({
  graph,
  selectedId,
}: {
  graph: RegulationMapGraph;
  selectedId: string | null;
}) {
  const node = graph.nodes.find((item) => item.id === selectedId) ?? null;
  if (!node) {
    return (
      <p className="meta reg-map-hint">
        Select a node to inspect the linked source, requirement, control, evidence, or task.
      </p>
    );
  }
  return (
    <div className="reg-map-inspector" aria-live="polite">
      <p className="micro">{KIND_LABEL[node.kind]}</p>
      <p className="strong-ink">{node.label}</p>
      <p className="meta">{node.detail}</p>
      {node.status && (
        <p className="meta">
          Status <StateLabel value={node.status} /> · {labelOf(node.status)}
        </p>
      )}
    </div>
  );
}
