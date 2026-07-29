"use client";

import { useEffect, useRef } from "react";

/* ---------------------------------------------------------------------------
 * FlowScene — the ambient Three.js layer behind the "How it works" map.
 *
 * Particles drift left to right along the same lane the flow map draws:
 * clauses moving from source, through the rules, to a person, to the seal.
 * Roughly one in eight runs amber and, at the decision point, falls out of
 * the lane — the refusal branch, echoed in motion. Decorative only: the SVG
 * map above carries all the information, so this layer is aria-hidden, sits
 * behind it, and simply does not mount without WebGL or with reduced motion.
 * ------------------------------------------------------------------------- */

const PARTICLES = 110;
const LANE_Y = 0.62; // matches the flow map's connector height (fraction from top)
const BRANCH_X = 0.55; // where the refusal branch drops, as a fraction of width

function canUseWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function FlowScene() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!canUseWebGl()) return;

    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      const THREE = await import("three");
      if (disposed || !host) return;

      const width = host.clientWidth || 960;
      const height = host.clientHeight || 320;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, width, 0, height, -10, 10);

      const royal = new THREE.Color(0x205db1);
      const teal = new THREE.Color(0x2dd4bf);
      const amber = new THREE.Color(0xb35a1f);

      const positions = new Float32Array(PARTICLES * 3);
      const colors = new Float32Array(PARTICLES * 3);
      // Per-particle motion state, plain arrays — no allocation in the loop.
      const speed = new Float32Array(PARTICLES);
      const wobble = new Float32Array(PARTICLES);
      const phase = new Float32Array(PARTICLES);
      const refuses = new Uint8Array(PARTICLES);
      const falling = new Float32Array(PARTICLES); // 0 = in lane, >0 = fall progress

      const reset = (i: number, randomX: boolean) => {
        positions[i * 3] = randomX ? Math.random() * width : -8;
        positions[i * 3 + 1] = height * LANE_Y + (Math.random() - 0.5) * 26;
        positions[i * 3 + 2] = 0;
        speed[i] = 22 + Math.random() * 30; // px per second
        wobble[i] = 2 + Math.random() * 5;
        phase[i] = Math.random() * Math.PI * 2;
        refuses[i] = Math.random() < 0.125 ? 1 : 0;
        falling[i] = 0;
        const base = refuses[i] ? amber : Math.random() < 0.3 ? teal : royal;
        colors[i * 3] = base.r;
        colors[i * 3 + 1] = base.g;
        colors[i * 3 + 2] = base.b;
      };
      for (let i = 0; i < PARTICLES; i += 1) reset(i, true);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 3.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      scene.add(new THREE.Points(geometry, material));

      const clock = new THREE.Clock();
      const positionAttr = geometry.getAttribute("position") as import("three").BufferAttribute;

      const render = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        for (let i = 0; i < PARTICLES; i += 1) {
          const x = positions[i * 3] + speed[i] * dt;
          positions[i * 3] = x;
          if (falling[i] > 0 || (refuses[i] && x >= width * BRANCH_X)) {
            // The refusal: leave the lane and sink toward the "Needs you" card.
            falling[i] += dt;
            positions[i * 3] -= speed[i] * dt * 0.8; // nearly stops moving forward
            positions[i * 3 + 1] += (34 + falling[i] * 40) * dt;
            if (positions[i * 3 + 1] > height + 8) reset(i, false);
          } else {
            positions[i * 3 + 1] +=
              Math.sin(t * 1.4 + phase[i]) * wobble[i] * dt;
          }
          if (x > width + 8) reset(i, false);
        }
        positionAttr.needsUpdate = true;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();

      const onResize = () => {
        const w = host.clientWidth || width;
        const h = host.clientHeight || height;
        renderer.setSize(w, h);
        camera.right = w;
        camera.bottom = h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", onResize);
        host.removeChild(renderer.domElement);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        scene.clear();
      };
    };

    void run();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="flow-scene" aria-hidden="true" />;
}
