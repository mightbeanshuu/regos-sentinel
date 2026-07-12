import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {RegOSBackground} from '../system/Background';
import {Chrome} from '../system/Chrome';
import {AgentNode, Document} from '../system/icons';
import {SvgPop} from '../system/SvgPop';
import {
  COLOR_CHAT_BG,
  COLOR_EMERALD_500,
  COLOR_NAVY_700,
  COLOR_NAVY_900,
  COLOR_ROSE_500,
  COLOR_SLATE_400,
  COLOR_TEAL_400,
  COLOR_TEAL_500,
  COLOR_WHITE,
  STAGGER,
} from '../system/colors';
import {FONT_IBM_SANS, FONT_SORA} from '../system/fonts';
import {springSnappy, springSmooth} from '../system/springs';

const S03 = {
  TITLE: 'Judges ask: "Isn\'t this just RAG?"',
  LEFT_H: 'Generic chatbot',
  LEFT_GLOSS: 'Retrieval helps answers — without structure + gates it\'s still a chatbot.',
  BUBBLES: [
    {sent: true, text: 'What does CSCRF require for small REs?'},
    {
      sent: false,
      text: 'Small REs should maintain cyber controls, conduct audits, and follow SEBI guidelines…',
    },
  ],
  LEFT_STAMP: 'Prose. No owner. No deadline. No evidence. No citation.',
  RIGHT_H: 'RegOS Sentinel',
  COLS: ['Actor', 'Action', 'Deadline', 'Evidence', 'Clause', 'Conf.'],
  ROWS: [
    ['CISO', 'Annual cyber audit', 'Annual', 'VAPT + board note', '§4.2', '0.93'],
    ['Compliance', 'Incident reporting SLA', '6 hours', 'IR log', '§7.1', '0.91'],
  ],
  RIGHT_STAMP: 'Structured · cited · human-gated · audit-ready',
};

const ChatBubble: React.FC<{sent: boolean; text: string; delay: number}> = ({
  sent,
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = springSnappy(Math.max(0, frame - delay), fps);

  return (
    <div
      style={{
        alignSelf: sent ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        opacity: enter,
        transform: `translateY(${(1 - enter) * 20}px)`,
        background: sent ? '#334155' : '#1E293B',
        padding: '14px 18px',
        borderRadius: sent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        fontFamily: FONT_IBM_SANS,
        fontSize: 15,
        color: COLOR_WHITE,
        lineHeight: 1.45,
        marginBottom: 12,
      }}
    >
      {text}
    </div>
  );
};

export const S03_Contrast: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleSpring = springSmooth(frame, fps);
  const leftPanel = springSnappy(Math.max(0, frame - 20), fps);
  const rightPanel = springSnappy(Math.max(0, frame - 28), fps);
  const splitHeight = interpolate(frame, [15, 45], [0, 100], {extrapolateRight: 'clamp'});
  const verdictSpring = springSnappy(Math.max(0, frame - 300), fps);

  return (
    <AbsoluteFill>
      <RegOSBackground showHairline={false} atmosphere="calm" />
      <div
        style={{
          position: 'absolute',
          top: 108,
          left: 64,
          zIndex: 6,
        }}
      >
        <SvgPop>
          <AgentNode size={72} color={COLOR_TEAL_400} />
        </SvgPop>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: FONT_SORA,
          fontWeight: 600,
          fontSize: 40,
          color: COLOR_WHITE,
          opacity: titleSpring,
          textAlign: 'center',
          zIndex: 5,
          maxWidth: 1200,
          paddingLeft: 100,
        }}
      >
        {S03.TITLE}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 180,
          bottom: 80,
          left: '50%',
          width: 1,
          height: `${splitHeight}%`,
          background: COLOR_NAVY_700,
          transform: 'translateX(-50%)',
        }}
      />
      <AbsoluteFill style={{display: 'flex', paddingTop: 200, paddingBottom: 100}}>
        <div
          style={{
            flex: 1,
            background: COLOR_CHAT_BG,
            padding: '32px 40px',
            display: 'flex',
            flexDirection: 'column',
            opacity: leftPanel,
            transform: `translateX(${(1 - leftPanel) * -60}px)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20}}>
            <SvgPop delay={4}>
              <Document size={48} color={COLOR_ROSE_500} />
            </SvgPop>
            <div
              style={{
                fontFamily: FONT_IBM_SANS,
                fontWeight: 500,
                fontSize: 16,
                color: COLOR_SLATE_400,
              }}
            >
              {S03.LEFT_H}
            </div>
          </div>
          {S03.BUBBLES.map((b, i) => (
            <ChatBubble key={i} sent={b.sent} text={b.text} delay={45 + i * 38} />
          ))}
          <div
            style={{
              marginTop: 'auto',
              fontFamily: FONT_IBM_SANS,
              fontSize: 13,
              color: COLOR_ROSE_500,
              opacity: interpolate(frame, [150, 170], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            {S03.LEFT_STAMP}
          </div>
          <div
            style={{
              fontFamily: FONT_IBM_SANS,
              fontSize: 12,
              color: COLOR_SLATE_400,
              marginTop: 8,
              fontStyle: 'italic',
              opacity: interpolate(frame, [170, 190], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            {S03.LEFT_GLOSS}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: COLOR_NAVY_900,
            padding: '32px 40px',
            borderLeft: `3px solid ${COLOR_TEAL_500}`,
            opacity: rightPanel,
            transform: `translateX(${(1 - rightPanel) * 60}px)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20}}>
            <SvgPop delay={6}>
              <AgentNode size={48} color={COLOR_TEAL_400} />
            </SvgPop>
            <div
              style={{
                fontFamily: FONT_SORA,
                fontWeight: 600,
                fontSize: 18,
                color: COLOR_TEAL_400,
              }}
            >
              {S03.RIGHT_H}
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              fontFamily: FONT_IBM_SANS,
              fontSize: 13,
              color: COLOR_SLATE_400,
              borderBottom: `1px solid ${COLOR_NAVY_700}`,
              paddingBottom: 8,
              marginBottom: 8,
            }}
          >
            {S03.COLS.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          {S03.ROWS.map((row, ri) => {
            const rowEnter = springSnappy(Math.max(0, frame - (165 + ri * STAGGER * 6)), fps);
            return (
              <div
                key={ri}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 8,
                  fontFamily: FONT_IBM_SANS,
                  fontSize: 14,
                  color: COLOR_WHITE,
                  padding: '10px 0',
                  borderBottom: `1px solid ${COLOR_NAVY_700}`,
                  opacity: rowEnter,
                  transform: `translateX(${(1 - rowEnter) * 40}px)`,
                }}
              >
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    style={
                      ci === 5
                        ? {
                            background: `${COLOR_EMERALD_500}33`,
                            color: COLOR_EMERALD_500,
                            padding: '2px 8px',
                            borderRadius: 4,
                            textAlign: 'center',
                          }
                        : undefined
                    }
                  >
                    {cell}
                  </div>
                ))}
              </div>
            );
          })}
          <div
            style={{
              marginTop: 16,
              fontFamily: FONT_IBM_SANS,
              fontSize: 14,
              color: COLOR_TEAL_400,
              opacity: interpolate(frame, [240, 260], [0, 1], {extrapolateRight: 'clamp'}),
            }}
          >
            {S03.RIGHT_STAMP}
          </div>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 64px',
          background: COLOR_NAVY_900,
          borderTop: `1px solid ${COLOR_NAVY_700}`,
          opacity: verdictSpring,
          transform: `translateY(${(1 - verdictSpring) * 40}px)`,
          fontFamily: FONT_SORA,
          fontWeight: 600,
          fontSize: 28,
          color: COLOR_WHITE,
          textAlign: 'center',
        }}
      >
        Chat answers. RegOS{' '}
        <span style={{color: COLOR_TEAL_400}}>operationalizes</span>.
      </div>
      <Chrome slideIndex={3} totalSlides={10} />
    </AbsoluteFill>
  );
};
