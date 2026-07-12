import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLOR_TEAL_400, COLOR_TEAL_500} from './colors';

// Animated "obligation constellation" — nodes + drawing lines, inspired by the
// Canva AI hero reference. Recreated as pure SVG so it animates crisply in Remotion.
type Node = {x: number; y: number; r: number};

const NODES: Node[] = [
  {x: 150, y: 980, r: 7}, // 0 bottom-left anchor (bright)
  {x: 340, y: 700, r: 5}, // 1
  {x: 560, y: 792, r: 5}, // 2
  {x: 1080, y: 560, r: 7}, // 3 hub
  {x: 1190, y: 415, r: 3.5}, // 4 small above hub
  {x: 1365, y: 470, r: 6}, // 5 right
  {x: 1285, y: 628, r: 4}, // 6 below-right
  {x: 1560, y: 300, r: 5}, // 7 top-right
  // faint decorative scatter
  {x: 760, y: 470, r: 2.5}, // 8
  {x: 1460, y: 720, r: 2.5}, // 9
  {x: 980, y: 300, r: 2}, // 10
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [3, 5],
  [3, 6],
  [6, 5],
  [4, 5],
  [5, 7],
  [0, 2],
  [3, 10],
  [5, 9],
];

const NODE_STAGGER = 4;
const EDGE_STAGGER = 3;

export const NetworkField: React.FC<{
  opacity?: number;
  startFrame?: number;
}> = ({opacity = 1, startFrame = 0}) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - startFrame);

  return (
    <AbsoluteFill style={{opacity}}>
      {/* soft radial glow behind the hub */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 520px at 58% 48%, ${COLOR_TEAL_500}14 0%, transparent 62%)`,
        }}
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{position: 'absolute', inset: 0}}
      >
        <defs>
          <filter id="nf-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* edges — draw in, staggered */}
        <g filter="url(#nf-glow)">
          {EDGES.map(([a, b], i) => {
            const na = NODES[a];
            const nb = NODES[b];
            const len = Math.hypot(nb.x - na.x, nb.y - na.y);
            const appear = Math.max(a, b) * NODE_STAGGER + i * EDGE_STAGGER + 6;
            const t = interpolate(f, [appear, appear + 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <line
                key={`e${i}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={COLOR_TEAL_400}
                strokeWidth={1.4}
                strokeOpacity={0.4 * t}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - t)}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* nodes — halo + core, pop + twinkle */}
        {NODES.map((n, i) => {
          const appear = i * NODE_STAGGER + 4;
          const pop = interpolate(f, [appear, appear + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const twinkle =
            0.72 + 0.28 * Math.sin((f + i * 21) * 0.06);
          const o = pop * twinkle;
          return (
            <g key={`n${i}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r * 3.4}
                fill={COLOR_TEAL_400}
                opacity={0.1 * o}
                filter="url(#nf-glow)"
              />
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r * pop}
                fill="#BFF6ED"
                opacity={o}
                filter="url(#nf-glow)"
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
