import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CHAR_FRAMES} from '../system/colors';

type TypewriterProps = {
  text: string;
  startFrame?: number;
  charFrames?: number;
  style?: React.CSSProperties;
  showCaret?: boolean;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  startFrame = 0,
  charFrames = CHAR_FRAMES,
  style,
  showCaret = true,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor(elapsed / charFrames));
  const display = text.slice(0, chars);
  const caretVisible = showCaret && Math.floor(frame / 16) % 2 === 0 && chars < text.length;

  return (
    <span style={style}>
      {display}
      {caretVisible && (
        <span style={{opacity: interpolate(frame % 16, [0, 8, 16], [1, 0, 1])}}>|</span>
      )}
    </span>
  );
};

type HighlightTextProps = {
  text: string;
  highlight: string;
  highlightColor?: string;
  style?: React.CSSProperties;
  highlightStyle?: React.CSSProperties;
};

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  highlightColor = '#2DD4BF',
  style,
  highlightStyle,
}) => {
  const idx = text.indexOf(highlight);
  if (idx === -1) return <span style={style}>{text}</span>;

  const before = text.slice(0, idx);
  const after = text.slice(idx + highlight.length);

  return (
    <span style={style}>
      {before}
      <span
        style={{
          borderBottom: `2px solid ${highlightColor}`,
          ...highlightStyle,
        }}
      >
        {highlight}
      </span>
      {after}
    </span>
  );
};

type WordCarouselProps = {
  words: string[];
  prefix: string;
  startFrame?: number;
  holdFrames?: number;
  flipFrames?: number;
  color?: string;
  prefixStyle?: React.CSSProperties;
  wordStyle?: React.CSSProperties;
};

export const WordCarousel: React.FC<WordCarouselProps> = ({
  words,
  prefix,
  startFrame = 0,
  holdFrames = 32,
  flipFrames = 18,
  color = '#2DD4BF',
  prefixStyle,
  wordStyle,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const cycleLength = holdFrames + flipFrames;
  const cycleIndex = Math.floor(elapsed / cycleLength) % words.length;
  const cycleProgress = (elapsed % cycleLength) / flipFrames;
  const isFlipping = elapsed % cycleLength > holdFrames;
  const opacity = isFlipping ? interpolate(cycleProgress, [0, 0.5, 1], [1, 0.3, 1]) : 1;
  const blur = isFlipping ? interpolate(cycleProgress, [0, 0.5, 1], [0, 4, 0]) : 0;

  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: 12}}>
      <span style={prefixStyle}>{prefix}</span>
      <span
        style={{
          color,
          opacity,
          filter: `blur(${blur}px)`,
          minWidth: 280,
          display: 'inline-block',
          ...wordStyle,
        }}
      >
        {words[cycleIndex]}
      </span>
    </div>
  );
};
