"use client";

import { useEffect, useRef } from "react";

import type { RegulationMapGraph } from "../../lib/impactGraph";
import { layoutRegulationMap } from "../../lib/impactGraph";

const KIND_COLOR: Record<string, number> = {
  source: 0x1b3fb8,
  obligation: 0x15328f,
  control: 0x087d70,
  evidence: 0x9b5d00,
  task: 0x4a5568,
};

export function RegulationMap3D({
  graph,
  selectedId,
  onSelect,
  reducedMotion,
}: {
  graph: RegulationMapGraph;
  selectedId: string | null;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  onSelectRef.current = onSelect;
  selectedRef.current = selectedId;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || graph.nodes.length === 0) return;

    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      const THREE = await import("three");
      if (disposed || !host) return;

      const width = host.clientWidth || 640;
      const height = 320;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0.8, 1.4, 8.2);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.88));
      const key = new THREE.DirectionalLight(0xffffff, 0.5);
      key.position.set(5, 8, 6);
      scene.add(key);

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x9aa3b5,
        transparent: true,
        opacity: 0.5,
      });
      const positions = layoutRegulationMap(graph);
      const meshById = new Map<string, import("three").Mesh>();

      for (const edge of graph.edges) {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) continue;
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(from.x, from.y, from.z),
          new THREE.Vector3(to.x, to.y, to.z),
        ]);
        scene.add(new THREE.Line(geometry, lineMaterial));
      }

      for (const node of graph.nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;
        const radius = node.kind === "source" ? 0.22 : 0.16;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 22, 22),
          new THREE.MeshStandardMaterial({
            color: KIND_COLOR[node.kind] ?? 0x6b7280,
            roughness: 0.42,
            metalness: 0.04,
          }),
        );
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.userData.id = node.id;
        scene.add(mesh);
        meshById.set(node.id, mesh);
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const onPointerMove = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onClick = () => {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects([...meshById.values()]);
        const id = hits[0]?.object.userData.id;
        if (typeof id === "string") onSelectRef.current(id);
      };

      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("click", onClick);

      const entryFrom = camera.position.clone();
      const entryTo = new THREE.Vector3(0.35, 0.85, 6.4);
      let entryT = reducedMotion ? 1 : 0;

      const render = () => {
        if (disposed) return;
        if (entryT < 1) {
          entryT = Math.min(1, entryT + 0.018);
          camera.position.lerpVectors(entryFrom, entryTo, entryT);
          camera.lookAt(0, 0, 0);
        }
        for (const [id, mesh] of meshById) {
          const scale = id === selectedRef.current ? 1.32 : 1;
          mesh.scale.setScalar(scale);
        }
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();

      const onResize = () => {
        const w = host.clientWidth || width;
        const h = 320;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("click", onClick);
        host.removeChild(renderer.domElement);
        renderer.dispose();
        scene.clear();
      };
    };

    void run();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [graph, reducedMotion]);

  return (
    <div
      ref={hostRef}
      className="reg-map-3d"
      role="application"
      aria-label="Interactive regulation impact map"
    />
  );
}
