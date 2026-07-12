import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdDisplay,
  EdLogo,
  ED_BLUE,
  ED_BODY,
  ED_DATE,
  ED_WHITE,
  Rise,
  edInk,
} from '../system/editorial';
import {CockpitPanel} from '../system/editorialArt';

// T4 clone — full-height product panel left, white field right with giant
// blue title, justified paragraph and two bullet paragraphs.
const Bullet: React.FC<{delay: number; children: React.ReactNode}> = ({
  delay,
  children,
}) => (
  <Rise delay={delay}>
    <div style={{display: 'flex', gap: 18, alignItems: 'flex-start'}}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: ED_BLUE,
          marginTop: 12,
          flexShrink: 0,
        }}
      />
      <p
        style={{
          fontFamily: ED_BODY,
          fontWeight: 500,
          fontSize: 23,
          lineHeight: 1.36,
          color: ED_BLUE,
          textAlign: 'justify',
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  </Rise>
);

export const S04_Solution: React.FC = () => {
  return (
    <AbsoluteFill style={{background: ED_WHITE}}>
      {/* left product panel — template photo slot, full height */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10}}>
        <CockpitPanel width={820} height={1080} delay={10} />
      </div>

      {/* right editorial field */}
      <div
        style={{
          position: 'absolute',
          left: 820,
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 20,
        }}
      >
        {/* local grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to right, rgba(27,63,184,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(27,63,184,0.10) 1px, transparent 1px)',
            backgroundSize: '96px 96px',
          }}
        />
        <Rise delay={6} style={{position: 'absolute', top: 64, left: 84}}>
          <EdLogo variant="white" />
        </Rise>
        <Rise delay={8} style={{position: 'absolute', top: 70, right: 84}}>
          <span
            style={{
              fontFamily: ED_BODY,
              fontWeight: 600,
              fontSize: 27,
              color: edInk('white'),
            }}
          >
            {ED_DATE}
          </span>
        </Rise>

        <div style={{position: 'absolute', left: 84, top: 250}}>
          <EdDisplay variant="white" lines={['OUR', 'SOLUTION']} size={168} delay={10} />
        </div>

        <div style={{position: 'absolute', left: 84, top: 620, right: 84}}>
          <EdBody variant="white" width="100%" delay={22} size={24}>
            RegOS Sentinel is an agentic compliance operating layer — a compiler,
            not a chatbot. Five supervised agents convert public SEBI documents
            into a clause-cited obligation graph, then into owned tasks, evidence
            workflows and exportable audit packs. A graduated autonomy dial keeps
            agent authority explicit: suggest, draft, or act — always behind a
            human gate.
          </EdBody>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 84,
            right: 84,
            top: 866,
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          <Bullet delay={30}>
            Every displayed obligation cites a verbatim source clause — 100%
            citation coverage, confidence-scored, contradiction-checked, logged
            for audit under Reg 16C.
          </Bullet>
          <Bullet delay={36}>
            A change-impact simulator diffs any new circular against the live
            graph — impacted controls, owners, tasks and evidence in minutes, not
            weeks.
          </Bullet>
        </div>
      </div>
    </AbsoluteFill>
  );
};
