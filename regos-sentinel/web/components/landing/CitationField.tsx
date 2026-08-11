"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The hero scene: the corpus, as it actually is.
 *
 * This is not an abstract particle field with the brand colours sprinkled on
 * it. It is the product's own data model rendered in three dimensions — a set
 * of SEBI passages, and the citations that bind them. Every visual decision
 * below carries the same meaning it carries everywhere else in the product:
 *
 *   periwinkle  a passage the machine has read and computed over
 *   aqua        a passage whose text has been verified against the source
 *   peach       the one passage a person still has to rule on
 *
 * There is exactly ONE peach node, and it is the only thing on screen that
 * pulses. That is the entire argument of RegOS Sentinel expressed as motion:
 * a very large amount of automated reading, and one place where it stops and
 * waits for a human. A field where everything pulsed would say the opposite.
 *
 * Nothing here is random per load. The layout is seeded, so the composition a
 * visitor sees is the composition it was designed to be, and a screenshot
 * taken today matches one taken next week.
 */

/* A tiny deterministic PRNG. Same field every load, on every machine. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const NODES = 132;
const EDGES = 118;

/* The colour contract, in linear-ish sRGB hex — identical to romer.css. */
const C_ACCENT = new THREE.Color("#c8cbff"); // computed
const C_OK = new THREE.Color("#76d2e3"); // verified
const C_REVIEW = new THREE.Color("#ffc297"); // a person is required

export function CitationField() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      // No WebGL. The section is designed to read without it, so leave the
      // canvas empty rather than showing a broken-graphics placeholder.
      return;
    }

    // Cap at 2x: beyond that this scene costs fill rate for no visible gain.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    // Fog to the canvas colour, so the far side of the field dissolves into the
    // page instead of ending at a visible edge.
    scene.fog = new THREE.Fog(0x070708, 7.5, 20);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 13);

    /* ---- Lay the passages out ------------------------------------------ */
    const random = seeded(20260811);
    const positions = new Float32Array(NODES * 3);
    const colours = new Float32Array(NODES * 3);
    const sizes = new Float32Array(NODES);
    const points: THREE.Vector3[] = [];

    // The one node awaiting a person sits slightly forward of the cloud, so it
    // reads as the nearest thing to the viewer without needing to be bigger.
    const GAP_INDEX = 0;

    for (let i = 0; i < NODES; i += 1) {
      // A flattened shell — a disc with depth, which reads as a body of
      // documents rather than a planet.
      const theta = random() * Math.PI * 2;
      const radius = 2.2 + Math.pow(random(), 0.7) * 5.4;
      const y = (random() - 0.5) * 3.4;
      const v = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius * 0.72);
      if (i === GAP_INDEX) v.set(4.15, 0.75, 2.9);
      points.push(v);
      v.toArray(positions, i * 3);

      // Roughly a third verified, the rest computed, and exactly one waiting.
      const colour = i === GAP_INDEX ? C_REVIEW : random() < 0.34 ? C_OK : C_ACCENT;
      colour.toArray(colours, i * 3);
      sizes[i] = i === GAP_INDEX ? 17 : 4.6 + random() * 4.4;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nodeGeometry.setAttribute("aColour", new THREE.BufferAttribute(colours, 3));
    nodeGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    /* Round, soft-edged points. A default square point sprite is the single
       clearest "this is a WebGL demo" tell there is. */
    const nodeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
      vertexShader: `
        attribute vec3 aColour;
        attribute float aSize;
        uniform float uTime;
        uniform float uScale;
        varying vec3 vColour;
        varying float vPulse;
        void main() {
          vColour = aColour;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // Only the waiting node breathes; it is flagged by its larger size.
          vPulse = aSize > 12.0 ? 0.72 + 0.28 * sin(uTime * 2.0) : 1.0;
          gl_PointSize = aSize * vPulse * uScale * (12.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColour;
        varying float vPulse;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float edge = smoothstep(0.5, 0.12, d);
          gl_FragColor = vec4(vColour, edge * 0.92 * vPulse);
        }
      `,
    });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodes);

    /* ---- Citations ------------------------------------------------------ */
    // Each edge joins a passage to a NEAR one. Wiring random pairs produces a
    // ball of yarn; joining neighbours produces something that looks like a
    // corpus with structure, which is what a citation graph is.
    const linePositions: number[] = [];
    const lineColours: number[] = [];
    for (let e = 0; e < EDGES; e += 1) {
      const a = Math.floor(random() * NODES);
      let best = -1;
      let bestDistance = Infinity;
      for (let t = 0; t < 9; t += 1) {
        const b = Math.floor(random() * NODES);
        if (b === a) continue;
        const distance = points[a].distanceTo(points[b]);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = b;
        }
      }
      if (best < 0 || bestDistance > 3.4) continue;
      linePositions.push(...points[a].toArray(), ...points[best].toArray());
      // An edge touching the waiting passage is peach; the rest are quiet.
      const touchesGap = a === GAP_INDEX || best === GAP_INDEX;
      const colour = touchesGap ? C_REVIEW : C_ACCENT;
      const strength = touchesGap ? 1 : 0.55;
      for (let k = 0; k < 2; k += 1) {
        lineColours.push(colour.r * strength, colour.g * strength, colour.b * strength);
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColours, 3));
    const lines = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(lines);

    const field = new THREE.Group();
    field.add(nodes, lines);
    scene.add(field);

    /* ---- Size ----------------------------------------------------------- */
    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      // Pull back on narrow screens so the field is never cropped to a smear.
      camera.position.z = clientWidth < 720 ? 17 : 13;
      nodeMaterial.uniforms.uScale.value = clientWidth < 720 ? 0.72 : 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    /* ---- Pointer parallax ----------------------------------------------- */
    // Small, and eased, so it reads as the field having depth rather than as
    // something chasing the cursor.
    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    const onPointer = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 0.34;
      target.y = (event.clientY / window.innerHeight - 0.5) * 0.22;
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    /* ---- Run only while it is on screen and the tab is visible ----------- */
    let visible = true;
    const onScreen = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    onScreen.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;

      const elapsed = clock.getElapsedTime();
      nodeMaterial.uniforms.uTime.value = elapsed;

      if (reduced) {
        // Hold a composed still. The scene is worth looking at without motion.
        field.rotation.set(-0.06, 0.5, 0);
      } else {
        field.rotation.y = elapsed * 0.045;
        field.rotation.x = Math.sin(elapsed * 0.13) * 0.06;
        eased.x += (target.x - eased.x) * 0.045;
        eased.y += (target.y - eased.y) * 0.045;
        camera.position.x = eased.x * 3.1;
        camera.position.y = -eased.y * 2.4;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      onScreen.disconnect();
      window.removeEventListener("pointermove", onPointer);
      nodeGeometry.dispose();
      lineGeometry.dispose();
      nodeMaterial.dispose();
      (lines.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="lp-canvas" aria-hidden />;
}
