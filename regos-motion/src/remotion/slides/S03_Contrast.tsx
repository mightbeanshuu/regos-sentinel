import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  ED_BLUE,
  ED_BODY,
  ED_MARGIN,
  ED_WHITE_PURE,
  Rise,
} from '../system/editorial';
import {PanelFrame} from '../system/editorialArt';

// T9 clone — blue field, giant right-aligned title, two stacked white panels
// left carrying the why-now evidence cards.
const WhyCard: React.FC<{
  kicker: string;
  title: string;
  body: string;
  delay: number;
  height?: number;
}> = ({kicker, title, body, delay, height = 380}) => (
  <PanelFrame width={560} height={height} delay={delay} background={ED_WHITE_PURE}>
    <div
      style={{
        padding: '34px 38px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: '0.1em',
          color: 'rgba(27,63,184,0.55)',
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 34,
          lineHeight: 1.12,
          color: ED_BLUE,
          marginTop: 12,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 500,
          fontSize: 21,
          lineHeight: 1.34,
          color: ED_BLUE,
          marginTop: 16,
          textAlign: 'justify',
        }}
      >
        {body}
      </div>
    </div>
  </PanelFrame>
);

export const S03_Contrast: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="blue">
        <EdHeader variant="blue" />

        {/* left stacked evidence cards */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            top: 150,
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
            zIndex: 10,
          }}
        >
          <WhyCard
            delay={12}
            kicker="SEBI REG 16C · IN FORCE FEB 2025"
            title="You are liable for your AI."
            body="Intermediaries are solely accountable for the accuracy, data integrity and legal compliance of every AI/ML output they use — including compliance tools. Black-box chat is now a regulatory liability."
            height={340}
          />
          <WhyCard
            delay={20}
            kicker="JUN 2026 · THE RULEBOOK IS MOVING"
            title="Rewrite season, right now."
            body="SEBI's Chair has promised responsible-AI guidelines with human-in-the-loop; master circulars are being cut ~50% in an ease-of-doing-business rewrite; CSCRF evidence deadlines bite small REs this year."
            height={360}
          />
        </div>

        {/* giant right-aligned title */}
        <div style={{position: 'absolute', right: ED_MARGIN - 6, top: 300, zIndex: 20}}>
          <EdDisplay
            variant="blue"
            lines={['WHY', 'NOW']}
            size={296}
            delay={8}
            align="right"
          />
        </div>

        {/* supporting paragraph bottom right */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 926, zIndex: 20}}>
          <EdBody variant="blue" width={1060} delay={30} size={25}>
            PS2 asks for exactly this: agentic systems that turn unstructured SEBI
            text into machine-actionable, auditable compliance — the AI-era
            continuation of 2025's member-compliance-monitoring track.
          </EdBody>
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
