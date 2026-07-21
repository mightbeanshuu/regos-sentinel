"use client";

import { useEffect, useRef } from "react";

import type { BuildStatus } from "../lib/types";

type VerificationStatus = BuildStatus | "IDLE";

const STATUS_COLOR: Record<VerificationStatus, number> = {
  IDLE: 0x1b3fb8,
  READY: 0x1b3fb8,
  BLOCKED_AWAITING_HUMAN: 0x9b5d00,
  FAILED: 0xbd2433,
  APPROVED: 0x087d70,
};

export function VerificationField({ status = "IDLE" }: { status?: BuildStatus | "IDLE" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup = () => undefined;

    void import("three").then((THREE) => {
      if (disposed) return;

      const contextAttributes: WebGLContextAttributes = {
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      };
      const context = canvas.getContext("webgl2", contextAttributes)
        ?? canvas.getContext("webgl", contextAttributes);
      if (!context) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          context,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-2.2, 2.2, 1.25, -1.25, 0.1, 10);
      camera.position.z = 4;

      const color = STATUS_COLOR[status];
      const pointPositions: number[] = [];
      const linePositions: number[] = [];
      const columns = 8;
      const rows = 4;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const x = -1.8 + column * 0.52;
          const safeBreak = status === "BLOCKED_AWAITING_HUMAN" && column >= 5 ? 0.22 : 0;
          const y = 0.72 - row * 0.48 - safeBreak;
          pointPositions.push(x, y, 0);
          if (column < columns - 1) {
            const nextBreak = status === "BLOCKED_AWAITING_HUMAN" && column + 1 >= 5 ? 0.22 : 0;
            linePositions.push(x, y, -0.02, x + 0.52, 0.72 - row * 0.48 - nextBreak, -0.02);
          }
        }
      }

      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(pointPositions, 3),
      );
      const pointsMaterial = new THREE.PointsMaterial({
        color,
        size: status === "APPROVED" ? 0.075 : 0.065,
        transparent: true,
        opacity: 0.48,
        sizeAttenuation: false,
      });
      const points = new THREE.Points(pointsGeometry, pointsMaterial);

      const linesGeometry = new THREE.BufferGeometry();
      linesGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePositions, 3),
      );
      const linesMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.14,
      });
      const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(lines, points);

      const render = () => {
        const width = Math.max(canvas.clientWidth, 1);
        const height = Math.max(canvas.clientHeight, 1);
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
      };
      const observer = new ResizeObserver(render);
      observer.observe(canvas);
      render();

      cleanup = () => {
        observer.disconnect();
        pointsGeometry.dispose();
        pointsMaterial.dispose();
        linesGeometry.dispose();
        linesMaterial.dispose();
        renderer.dispose();
      };
    }).catch(() => undefined);

    return () => {
      disposed = true;
      cleanup();
    };
  }, [status]);

  return <canvas ref={canvasRef} className="verification-field" aria-hidden="true" />;
}
