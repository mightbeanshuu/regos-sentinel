import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadArchivoBlack} from '@remotion/google-fonts/ArchivoBlack';
import {loadFont as loadArchivo} from '@remotion/google-fonts/Archivo';

// === EDITORIAL SYSTEM — "Blue & White Modern Startup" clone for RegOS ===
// Two canvases: royal blue with white type · off-white with blue type.
// Colossal uppercase display, blueprint hairline grid, strict rectangles.

const archivoBlack = loadArchivoBlack('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
const archivo = loadArchivo('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const ED_DISPLAY = archivoBlack.fontFamily;
export const ED_BODY = archivo.fontFamily;

export const ED_BLUE = '#1B3FB8';
export const ED_BLUE_DEEP = '#16349A';
export const ED_WHITE = '#F4F4F0';
export const ED_WHITE_PURE = '#FFFFFF';
export const ED_TEAL = '#2DD4BF';
export const ED_INK_ON_WHITE = ED_BLUE;
export const ED_INK_ON_BLUE = ED_WHITE_PURE;

export const ED_DATE = 'July - 12 - 2026';
export const ED_MARGIN = 110;

type Variant = 'blue' | 'white';

export const edInk = (v: Variant) => (v === 'blue' ? ED_INK_ON_BLUE : ED_INK_ON_WHITE);
export const edBg = (v: Variant) => (v === 'blue' ? ED_BLUE : ED_WHITE);
const gridLine = (v: Variant) =>
  v === 'blue' ? 'rgba(255,255,255,0.09)' : 'rgba(27,63,184,0.10)';

// ---------- reveal helpers ----------

export const useReveal = (delay: number, stiffness = 90) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 200, stiffness},
  });
};

export const Rise: React.FC<{
  delay?: number;
  children: React.ReactNode;
  distance?: number;
  style?: React.CSSProperties;
}> = ({delay = 0, children, distance = 28, style}) => {
  const p = useReveal(delay);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ---------- canvas + grid ----------

export const EdCanvas: React.FC<{
  variant: Variant;
  children: React.ReactNode;
}> = ({variant, children}) => {
  const frame = useCurrentFrame();
  const gridOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const line = gridLine(variant);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: edBg(variant),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: gridOpacity,
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: '96px 96px',
        }}
      />
      {children}
    </div>
  );
};

// ---------- header chrome ----------

export const EdLogo: React.FC<{variant: Variant; scale?: number}> = ({
  variant,
  scale = 1,
}) => {
  const ink = edInk(variant);
  const s = 40 * scale;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 14 * scale}}>
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <path
          d="M24 5 L41 14.5 L41 33.5 L24 43 L7 33.5 L7 14.5 Z"
          stroke={ink}
          strokeWidth={3.4}
          strokeLinejoin="round"
          fill="none"
        />
        <rect x={21.5} y={15} width={5} height={18} rx={2.5} fill={ink} />
      </svg>
      <span
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 30 * scale,
          color: ink,
          letterSpacing: '-0.01em',
        }}
      >
        RegOS&nbsp;Sentinel
      </span>
    </div>
  );
};

export const EdHeader: React.FC<{variant: Variant; date?: string}> = ({
  variant,
  date = ED_DATE,
}) => {
  const ink = edInk(variant);
  return (
    <>
      <Rise
        delay={4}
        style={{position: 'absolute', top: 64, left: ED_MARGIN, zIndex: 40}}
      >
        <EdLogo variant={variant} />
      </Rise>
      <Rise
        delay={8}
        style={{position: 'absolute', top: 70, right: ED_MARGIN, zIndex: 40}}
      >
        <span
          style={{
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 27,
            color: ink,
          }}
        >
          {date}
        </span>
      </Rise>
    </>
  );
};

// ---------- typography ----------

/** Colossal uppercase display headline. Lines reveal with a clip-rise. */
export const EdDisplay: React.FC<{
  lines: string[];
  variant: Variant;
  size?: number;
  delay?: number;
  align?: 'left' | 'right' | 'center';
  color?: string;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({
  lines,
  variant,
  size = 170,
  delay = 10,
  align = 'left',
  color,
  lineHeight = 0.94,
  style,
}) => {
  return (
    <div style={{...style}}>
      {lines.map((line, i) => (
        <ClipRise key={i} delay={delay + i * 7}>
          <div
            style={{
              fontFamily: ED_DISPLAY,
              fontSize: size,
              lineHeight,
              color: color ?? edInk(variant),
              textTransform: 'uppercase',
              letterSpacing: '-0.005em',
              textAlign: align,
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        </ClipRise>
      ))}
    </div>
  );
};

export const ClipRise: React.FC<{delay?: number; children: React.ReactNode}> = ({
  delay = 0,
  children,
}) => {
  const p = useReveal(delay, 70);
  return (
    <div style={{overflow: 'hidden'}}>
      <div style={{transform: `translateY(${(1 - p) * 105}%)`}}>{children}</div>
    </div>
  );
};

/** Justified body paragraph, template style. */
export const EdBody: React.FC<{
  children: React.ReactNode;
  variant: Variant;
  size?: number;
  width?: number | string;
  delay?: number;
  justify?: boolean;
  weight?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  variant,
  size = 27,
  width = 760,
  delay = 20,
  justify = true,
  weight = 500,
  style,
}) => (
  <Rise delay={delay} style={{width, ...style}}>
    <p
      style={{
        fontFamily: ED_BODY,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.38,
        color: edInk(variant),
        textAlign: justify ? 'justify' : 'left',
        margin: 0,
      }}
    >
      {children}
    </p>
  </Rise>
);

/** Bold term + small definition, template's signature pair. */
export const EdTermDef: React.FC<{
  term: string;
  def: string;
  variant: Variant;
  delay?: number;
  termWidth?: number;
  defWidth?: number;
  termSize?: number;
  defSize?: number;
}> = ({
  term,
  def,
  variant,
  delay = 0,
  termWidth = 330,
  defWidth = 460,
  termSize = 34,
  defSize = 22,
}) => {
  const ink = edInk(variant);
  return (
    <Rise delay={delay}>
      <div style={{display: 'flex', gap: 40, alignItems: 'flex-start'}}>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: termSize,
            lineHeight: 1.12,
            color: ink,
            width: termWidth,
            flexShrink: 0,
          }}
        >
          {term}
        </div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 500,
            fontSize: defSize,
            lineHeight: 1.32,
            color: ink,
            width: defWidth,
            textAlign: 'justify',
          }}
        >
          {def}
        </div>
      </div>
    </Rise>
  );
};

export const EdLabelValue: React.FC<{
  label: string;
  value: string;
  variant: Variant;
  delay?: number;
  size?: number;
}> = ({label, value, variant, delay = 0, size = 27}) => {
  const ink = edInk(variant);
  return (
    <Rise delay={delay}>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: size,
          color: ink,
          lineHeight: 1.25,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 500,
          fontSize: size * 0.96,
          color: ink,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </Rise>
  );
};

export const EdArrow: React.FC<{variant: Variant; size?: number; delay?: number}> = ({
  variant,
  size = 64,
  delay = 26,
}) => {
  const ink = edInk(variant);
  return (
    <Rise delay={delay}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path
          d="M14 50 L50 14 M22 14 H50 V42"
          stroke={ink}
          strokeWidth={7}
          strokeLinecap="square"
        />
      </svg>
    </Rise>
  );
};
