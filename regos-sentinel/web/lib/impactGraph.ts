import type { WorkspaceState } from "./types";

export type GraphNodeKind = "source" | "obligation" | "control" | "evidence" | "task";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  detail: string;
  status?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface RegulationMapGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const ACTIVE_OBLIGATION = (status: string) =>
  !status.startsWith("SUPERSEDED") && status !== "SUPERSEDED_BY_REVIEW";

/** Build a blast-radius graph from live workspace objects only. */
export function buildRegulationMap(state: WorkspaceState): RegulationMapGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  const addNode = (node: GraphNode) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    nodes.push(node);
  };

  const spanIds = new Set<string>();
  for (const entry of state.coverage) {
    if (entry.obligation_ids.length > 0) spanIds.add(entry.span_id);
  }
  spanIds.add("FAQ-Q17-A");
  spanIds.add("FAQ-Q15");

  for (const spanId of spanIds) {
    const span = state.source_spans.find((item) => item.id === spanId);
    if (!span) continue;
    addNode({
      id: span.id,
      kind: "source",
      label: span.question,
      detail: span.locator,
    });
  }

  for (const obligation of state.obligations) {
    if (!ACTIVE_OBLIGATION(obligation.status)) continue;
    addNode({
      id: obligation.id,
      kind: "obligation",
      label: `${obligation.action} ${obligation.object}`,
      detail: obligation.condition,
      status: obligation.status,
    });
  }

  for (const control of state.controls) {
    addNode({
      id: control.id,
      kind: "control",
      label: control.name,
      detail: control.rule_summary,
      status: control.status,
    });
    for (const obligationId of control.source_obligation_ids) {
      if (seen.has(obligationId)) edges.push({ from: obligationId, to: control.id });
    }
  }

  for (const entry of state.coverage) {
    for (const obligationId of entry.obligation_ids) {
      if (seen.has(entry.span_id) && seen.has(obligationId)) {
        edges.push({ from: entry.span_id, to: obligationId });
      }
    }
  }

  for (const item of state.evidence) {
    addNode({
      id: item.id,
      kind: "evidence",
      label: item.name,
      detail: item.kind,
      status: item.status,
    });
    if (seen.has(item.control_id)) edges.push({ from: item.control_id, to: item.id });
  }

  for (const task of state.tasks) {
    addNode({
      id: task.id,
      kind: "task",
      label: task.title,
      detail: `${task.owner} · ${task.work_type}`,
      status: task.status,
    });
    if (seen.has(task.source_obligation_id)) {
      edges.push({ from: task.source_obligation_id, to: task.id });
    }
  }

  return { nodes, edges };
}

/** Layered layout positions for 2D and 3D views (deterministic from ids). */
export function layoutRegulationMap(graph: RegulationMapGraph): Map<string, { x: number; y: number; z: number }> {
  const layers: Record<GraphNodeKind, number> = {
    source: -2.4,
    obligation: -0.8,
    control: 0.8,
    evidence: 2.2,
    task: 2.2,
  };

  const byKind = new Map<GraphNodeKind, GraphNode[]>();
  for (const node of graph.nodes) {
    const list = byKind.get(node.kind) ?? [];
    list.push(node);
    byKind.set(node.kind, list);
  }

  const positions = new Map<string, { x: number; y: number; z: number }>();
  for (const [kind, list] of byKind) {
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const spread = Math.max(sorted.length - 1, 1);
    sorted.forEach((node, index) => {
      const t = sorted.length === 1 ? 0 : index / spread;
      const x = (t - 0.5) * 5.5;
      const y = (index % 2 === 0 ? 0.15 : -0.15) * (kind === "task" || kind === "evidence" ? 1 : 0.5);
      positions.set(node.id, { x, y, z: layers[kind] });
    });
  }
  return positions;
}
