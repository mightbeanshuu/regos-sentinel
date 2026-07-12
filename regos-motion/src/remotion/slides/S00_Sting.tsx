import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {ED_BODY, ED_TEAL, useReveal} from '../system/editorial';

// Cinematic intro sting (video only, not in the PDF) — the user's aurora loop
// + glass hexagon emblem: the RegOS teal soul before the editorial deck.
export const S00_Sting: React.FC = () => {
  const frame = useCurrentFrame();
  const emblemIn = useReveal(16, 60);
  const wordIn = useReveal(30);
  const kickerIn = useReveal(42);
  const bgOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#050D1A'}}>
      <AbsoluteFill style={{opacity: bgOpacity}}>
        <Video
          muted
          loop
          src={staticFile('assets/aurora_loop.mp4')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* darkening vignette for legibility */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5,13,26,0.1) 0%, rgba(5,13,26,0.55) 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 34,
        }}
      >
        <Img
          src={staticFile('assets/emblem.jpg')}
          style={{
            width: 300,
            height: 300,
            objectFit: 'cover',
            borderRadius: 36,
            opacity: emblemIn,
            transform: `scale(${0.86 + emblemIn * 0.14})`,
            boxShadow: '0 40px 120px rgba(45,212,191,0.25)',
          }}
        />
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 78,
            letterSpacing: '-0.01em',
            color: '#F8FAFC',
            opacity: wordIn,
            transform: `translateY(${(1 - wordIn) * 24}px)`,
          }}
        >
          RegOS&nbsp;<span style={{color: ED_TEAL}}>Sentinel</span>
        </div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 27,
            letterSpacing: '0.22em',
            color: 'rgba(248,250,252,0.75)',
            opacity: kickerIn,
          }}
        >
          SEBI SECURITIES MARKET TECHSPRINT · PS2
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
