import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdArrow,
  EdCanvas,
  EdDisplay,
  EdHeader,
  EdLabelValue,
  ED_BLUE,
  ED_BODY,
  ED_MARGIN,
} from '../system/editorial';
import {CockpitTower} from '../system/editorialArt';

// T10 clone — white grid field, colossal blue type crossing the bleed with the
// product tower standing through it, contact/ask grid below.
export const S10_Ask: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="white">
        <EdHeader variant="white" />

        {/* colossal type */}
        <div style={{position: 'absolute', top: 268, left: -14, width: 1948, zIndex: 5}}>
          <EdDisplay variant="white" lines={['SANDBOX']} size={318} delay={8} align="left" />
        </div>
        <div style={{position: 'absolute', top: 600, left: ED_MARGIN, zIndex: 5}}>
          <EdDisplay variant="white" lines={['READY.']} size={216} delay={16} align="left" />
        </div>

        {/* product tower bookend */}
        <div style={{position: 'absolute', left: 1010, top: 150, zIndex: 10}}>
          <CockpitTower width={400} height={930} delay={12} />
        </div>

        {/* ask block right */}
        <div
          style={{
            position: 'absolute',
            right: ED_MARGIN,
            top: 636,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 34,
            width: 400,
          }}
        >
          <EdLabelValue
            variant="white"
            delay={26}
            label="The ask :"
            value="SEBI Innovation Sandbox mentorship + a 90-day small-broker pilot"
          />
          <EdLabelValue
            variant="white"
            delay={32}
            label="Pilot KPIs :"
            value="100% citation coverage · time-to-plan in minutes · human-approval rate"
          />
          <div style={{alignSelf: 'flex-end'}}>
            <EdArrow variant="white" delay={38} />
          </div>
        </div>

        {/* bottom contact row */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            bottom: 64,
            display: 'flex',
            gap: 110,
            zIndex: 20,
          }}
        >
          <EdLabelValue
            variant="white"
            delay={40}
            label="Presented By :"
            value="Team RegOS — Anshu"
          />
          <EdLabelValue
            variant="white"
            delay={44}
            label="Event :"
            value="SEBI Securities Market TechSprint @ GFF 2026 · PS2"
          />
        </div>

        {/* safeguard line bottom-right */}
        <div
          style={{
            position: 'absolute',
            right: ED_MARGIN,
            bottom: 64,
            zIndex: 20,
            width: 520,
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 20,
            lineHeight: 1.3,
            color: ED_BLUE,
            textAlign: 'right',
          }}
        >
          Decision-support only — preserves KYC, AML and investor-protection
          safeguards. No PII. No exemptions sought.
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
