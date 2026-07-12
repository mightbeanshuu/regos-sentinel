import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdArrow,
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  EdLabelValue,
  ED_BODY,
  ED_MARGIN,
  Rise,
} from '../system/editorial';
import {CockpitTower} from '../system/editorialArt';

// T1 clone — blue field, colossal wordmark crossing the full bleed,
// tall product monolith standing through the type (Big Ben role).
export const S01_Title: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="blue">
        <EdHeader variant="blue" />

        {/* colossal type — one full-bleed line, sits BEHIND the tower */}
        <div
          style={{
            position: 'absolute',
            top: 366,
            left: -10,
            width: 1944,
            zIndex: 5,
          }}
        >
          <EdDisplay
            variant="blue"
            lines={['REGOS SENTINEL']}
            size={196}
            delay={8}
            align="center"
          />
        </div>

        {/* product monolith */}
        <div style={{position: 'absolute', left: 745, top: 118, zIndex: 10}}>
          <CockpitTower width={430} height={962} delay={14} />
        </div>

        {/* intro paragraph — lower left, template position */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 712, zIndex: 20}}>
          <EdBody variant="blue" width={560} delay={26} size={25}>
            Supervised agentic compliance for SEBI intermediaries — real circulars
            in; clause-cited obligations, owned tasks, evidence and audit-ready
            action out. Every output human-approved.
          </EdBody>
        </div>

        {/* presented by / to */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            bottom: 58,
            display: 'flex',
            gap: 96,
            zIndex: 20,
          }}
        >
          <EdLabelValue
            variant="blue"
            delay={32}
            label="Presented By :"
            value="Team RegOS — Anshu"
          />
          <EdLabelValue
            variant="blue"
            delay={36}
            label="Presented To :"
            value="SEBI TechSprint Jury"
          />
        </div>

        {/* right meta + arrow */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 690, zIndex: 20}}>
          <EdArrow variant="blue" delay={30} />
        </div>
        <Rise
          delay={38}
          style={{position: 'absolute', right: ED_MARGIN, bottom: 66, zIndex: 20}}
        >
          <div
            style={{
              fontFamily: ED_BODY,
              fontWeight: 700,
              fontSize: 26,
              color: '#FFFFFF',
              textAlign: 'right',
            }}
          >
            PS2 : Agentic Compliance —<br />
            Regulatory Text to Operational Action
          </div>
        </Rise>
      </EdCanvas>
    </AbsoluteFill>
  );
};
