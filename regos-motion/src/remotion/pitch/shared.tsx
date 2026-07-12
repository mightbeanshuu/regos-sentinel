import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Video,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSoft, springUI} from '../system/springs';
import {Shield} from '../system/icons';
import {
  AMBIGUOUS,
  BLACK,
  NAVY_LINE,
  NAVY_PANEL,
  OFFWHITE,
  SLATE,
  TEAL,
  TRUTH_LABEL,
  VERIFIED,
  WHITE,
} from './constants';
import {ASSET_DIR, ASSET_FILES, HAS} from './assets';
import {SignalFieldSVG} from './vector/SignalFieldSVG';

// ————————————————————————————————————————————————————————————————
// Optional Canva plate layer (renders only when the asset exists)
// ————————————————————————————————————————————————————————————————

const plateSrc = (key: keyof typeof ASSET_FILES) =>
  staticFile(`${ASSET_DIR}/${ASSET_FILES[key]}`);

const VideoPlate: React.FC<{
  assetKey: 'bloom' | 'signal' | 'light';
  opacity?: number;
}> = ({assetKey, opacity = 1}) => {
  if (!HAS[assetKey]) return null;
  return (
    <AbsoluteFill style={{opacity}}>
      <Video
        src={plateSrc(assetKey)}
        muted
        loop
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    </AbsoluteFill>
  );
};

/** Isolated 3D still (transparent PNG) — used only when the asset exists. */
export const StillImage: React.FC<{
  assetKey: 'monolith' | 'docgraph' | 'appIcon';
  style?: React.CSSProperties;
}> = ({assetKey, style}) => {
  if (!HAS[assetKey]) return null;
  return <Img src={plateSrc(assetKey)} style={style} />;
};

// ————————————————————————————————————————————————————————————————
// Worlds
// ————————————————————————————————————————————————————————————————

/** Near-black signal void — hook, brand, ask. Code-native SignalFieldSVG. */
export const VoidField: React.FC<{plate?: boolean}> = ({plate = true}) => {
  return (
    <AbsoluteFill style={{background: BLACK, overflow: 'hidden'}}>
      {plate && HAS.bloom && <VideoPlate assetKey="bloom" />}
      {(!HAS.bloom || !plate) && (
        <SignalFieldSVG tone="dark" variant="void" focal={[0.5, 0.5]} seed={7} />
      )}
      {/* subtle center-out scrim so foreground type stays legible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 42%, rgba(4,8,20,0.35) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Near-black product stage — code-native SignalFieldSVG (stage variant). */
export const SignalField: React.FC<{intensity?: number}> = ({intensity = 1}) => {
  return (
    <AbsoluteFill style={{background: BLACK, overflow: 'hidden'}}>
      {HAS.signal && <VideoPlate assetKey="signal" />}
      {!HAS.signal && (
        <SignalFieldSVG tone="dark" variant="stage" focal={[0.5, 0.12]} intensity={intensity} seed={19} />
      )}
      {/* bottom vignette for caption legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(4,8,20,0.35) 0%, transparent 22%, transparent 62%, rgba(4,8,20,0.72) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Off-white inspection field — verify + Reg-Diff. Code-native SignalFieldSVG (light). */
export const OffWhiteField: React.FC = () => {
  const frame = useCurrentFrame();
  const glint = interpolate(frame, [22, 40], [-40, 130], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{background: OFFWHITE, overflow: 'hidden'}}>
      {HAS.light && <VideoPlate assetKey="light" />}
      {!HAS.light && (
        <SignalFieldSVG tone="light" variant="inspect" focal={[0.5, 0.46]} seed={31} />
      )}
      {/* single restrained entry glint (once), on top of the field */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${glint}%`,
          width: '3%',
          background: `linear-gradient(90deg, transparent, ${TEAL}44, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ————————————————————————————————————————————————————————————————
// Persistent overlays
// ————————————————————————————————————————————————————————————————

export const PersistentLogo: React.FC<{tone?: 'light' | 'dark'}> = ({tone = 'light'}) => {
  const color = tone === 'dark' ? '#0B1220' : WHITE;
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 60,
      }}
    >
      <Shield size={30} color={TEAL} progress={1} popped={1} />
      <div style={{display: 'flex', alignItems: 'baseline', gap: 6}}>
        <span
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 700,
            fontSize: 22,
            color,
            letterSpacing: '-0.02em',
          }}
        >
          RegOS
        </span>
        <span
          style={{
            fontFamily: FONT_SORA,
            fontWeight: 500,
            fontSize: 19,
            color: TEAL,
            letterSpacing: '-0.02em',
          }}
        >
          Sentinel
        </span>
      </div>
    </div>
  );
};

export const TruthLabel: React.FC<{tone?: 'light' | 'dark'}> = ({tone = 'light'}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 40,
      right: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      zIndex: 60,
      fontFamily: FONT_IBM_SANS,
      fontSize: 13,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: tone === 'dark' ? '#64748B' : SLATE,
      opacity: 0.75,
    }}
  >
    <span style={{width: 7, height: 7, borderRadius: '50%', background: TEAL, opacity: 0.9}} />
    {TRUTH_LABEL}
  </div>
);

/**
 * Integrated editorial edge-label (NO floating box). Short explanatory copy sits
 * on the frame's bottom-left margin, aligned to the grid — reads as part of the
 * composition, not a detached caption card. Masked line reveal on entry.
 */
export const CaptionBar: React.FC<{text: string; delay?: number; tone?: 'light' | 'dark'}> = ({
  text,
  delay = 8,
  tone = 'light',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSoft(Math.max(0, frame - delay), fps);
  const ink = tone === 'dark' ? '#0B1220' : WHITE;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 74,
        left: 56,
        maxWidth: 1080,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: 4,
          height: 46,
          borderRadius: 2,
          background: TEAL,
          transform: `scaleY(${enter})`,
          transformOrigin: 'top',
          marginTop: 4,
        }}
      />
      <div style={{overflow: 'hidden'}}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: FONT_IBM_SANS,
            fontSize: 30,
            lineHeight: 1.28,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: ink,
            textShadow: tone === 'light' ? '0 2px 18px rgba(4,8,20,0.65)' : 'none',
            transform: `translateY(${(1 - enter) * 46}px)`,
            opacity: enter,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

export const SectionKicker: React.FC<{
  index: string;
  step: string;
  concept: string;
  tone?: 'light' | 'dark';
  delay?: number;
}> = ({index, step, concept, tone = 'light', delay = 4}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springUI(Math.max(0, frame - delay), fps);
  const color = tone === 'dark' ? '#475569' : SLATE;
  return (
    <div
      style={{
        position: 'absolute',
        top: 44,
        left: '50%',
        transform: `translateX(-50%) translateY(${(1 - enter) * -10}px)`,
        opacity: enter,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: FONT_IBM_SANS,
        fontSize: 15,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        zIndex: 60,
      }}
    >
      <span style={{color: TEAL, fontWeight: 700}}>{index}</span>
      <span style={{color, fontWeight: 600}}>{step}</span>
      <span style={{color, opacity: 0.5}}>—</span>
      <span style={{color: tone === 'dark' ? '#0B1220' : WHITE, fontWeight: 600}}>{concept}</span>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Reference-inspired product primitives
// ————————————————————————————————————————————————————————————————

/** Glass notification/toast card (stacks one-by-one, like the reference). */
export const NotificationCard: React.FC<{
  glyph: React.ReactNode;
  title: string;
  sub: string;
  meta?: string;
  accent?: string;
  delay?: number;
  width?: number;
}> = ({glyph, title, sub, meta = 'now', accent = TEAL, delay = 0, width = 440}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springUI(Math.max(0, frame - delay), fps);
  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'rgba(14,24,48,0.9)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${NAVY_LINE}`,
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 12px 40px rgba(4,8,20,0.5)',
        opacity: enter,
        transform: `translateX(${(1 - enter) * 40}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${accent}1f`,
          border: `1px solid ${accent}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {glyph}
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div
          style={{
            fontFamily: FONT_IBM_SANS,
            fontSize: 16,
            fontWeight: 600,
            color: WHITE,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
        <div style={{fontFamily: FONT_IBM_SANS, fontSize: 13, color: SLATE}}>{sub}</div>
      </div>
      <div style={{fontFamily: FONT_IBM_SANS, fontSize: 12, color: accent, fontWeight: 600}}>
        {meta}
      </div>
    </div>
  );
};

/** Rounded score/confidence badge (reference-style number pill). */
export const ScoreBadge: React.FC<{value: string; color?: string}> = ({
  value,
  color = VERIFIED,
}) => (
  <div
    style={{
      minWidth: 42,
      height: 42,
      padding: '0 10px',
      borderRadius: 12,
      background: `${color}22`,
      border: `1px solid ${color}`,
      color,
      fontFamily: FONT_SORA,
      fontWeight: 700,
      fontSize: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {value}
  </div>
);

/** A curved citation beam that draws in, then sends one bright dot along it. */
export const CitationBeam: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay?: number;
  color?: string;
}> = ({x1, y1, x2, y2, delay = 0, color = TEAL}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const midX = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  const draw = interpolate(local, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dotT = interpolate(local, [24, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bez = (a: number, b: number, c: number, dd: number, tt: number) => {
    const u = 1 - tt;
    return u * u * u * a + 3 * u * u * tt * b + 3 * u * tt * tt * c + tt * tt * tt * dd;
  };
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
        opacity={0.85}
      />
      {dotT > 0 && dotT < 1 && (
        <circle cx={bez(x1, midX, midX, x2, dotT)} cy={bez(y1, y1, y2, y2, dotT)} r={4} fill={color} />
      )}
    </>
  );
};

/** Dark navy glass panel for the product stage. */
export const StagePanel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  delay?: number;
}> = ({children, style, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSoft(Math.max(0, frame - delay), fps);
  return (
    <div
      style={{
        background: NAVY_PANEL,
        border: `1px solid ${NAVY_LINE}`,
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(4,8,20,0.5)',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 22}px) scale(${0.97 + enter * 0.03})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export {AMBIGUOUS};
