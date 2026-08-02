"use client";

import type { GraphNode, RegulationMapGraph } from "../../lib/impactGraph";
import { layoutRegulationMap } from "../../lib/impactGraph";
import { StateLabel } from "../ui";

export const KIND_LABEL: Record<GraphNode["kind"], string> = {
  source: "SEBI passage",
  obligation: "Requirement",
  control: "Control",
  evidence: "Evidence",
  task: "Mandatory task",
};

const KIND_COLOR: Record<GraphNode["kind"], string> = {
  source: "var(--accent)",
  obligation: "var(--accent-deep)",
  control: "var(--ok)",
  evidence: "var(--review)",
  task: "var(--ink-2)",
};

/**
 * What each colour on the map means. Five dots and five words, in the same
 * legend grammar the charts use — a colour with no key is a colour that says
 * nothing.
 */
export function MapLegend() {
  return (
    <ul className="segbar-legend" aria-label="What each point on the map is">
      {(Object.keys(KIND_LABEL) as Array<GraphNode["kind"]>).map((kind) => (
        <li className="legend-chip" key={kind}>
          <span
            className="legend-dot"
            style={{ background: KIND_COLOR[kind] }}
            aria-hidden="true"
          />
          <span className="legend-label">{KIND_LABEL[kind]}</span>
        </li>
      ))}
    </ul>
  );
}

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
        aria-label="Regulation impact map — select a point to read its details in the panel below"
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
                <title>{node.id}</title>
                {node.label.length > 16 ? `${node.label.slice(0, 14)}…` : node.label}
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
        Select a point on the map to see the SEBI passage, requirement, control, evidence or
        task behind it.
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
          Status <StateLabel value={node.status} />
        </p>
      )}
    </div>
  );
}
