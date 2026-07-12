import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  EdTermDef,
  ED_MARGIN,
} from '../system/editorial';
import {ImagePanel} from '../system/editorialArt';

// T3 clone — blue field, giant two-line title left, tall artifact panel right,
// justified paragraph + two term/definition rows.
export const S02_Problem: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="blue">
        <EdHeader variant="blue" />

        {/* right art panel — template photo slot, user's generated render */}
        <div style={{position: 'absolute', right: 96, top: 0, zIndex: 10}}>
          <ImagePanel
            src="assets/docs2graph1.jpg"
            width={620}
            height={912}
            delay={10}
            objectPosition="16% 50%"
          />
        </div>

        {/* giant title */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 250, zIndex: 20}}>
          <EdDisplay
            variant="blue"
            lines={['PROBLEM', 'STATEMENT']}
            size={182}
            delay={8}
          />
        </div>

        {/* paragraph */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 620, zIndex: 20}}>
          <EdBody variant="blue" width={1010} delay={22} size={26}>
            SEBI regulates through continuous, unstructured text — circulars,
            master circulars, frameworks, FAQs. Operations need the opposite:
            structured, auditable rules with owners, deadlines and evidence. Lean
            compliance teams at small stock brokers bridge that gap by hand — slow,
            uneven, and hard to audit. 95% of intermediaries cite complexity and
            information gaps; a single circular takes weeks to operationalise.
          </EdBody>
        </div>

        {/* two term/def rows */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            top: 852,
            display: 'flex',
            flexDirection: 'column',
            gap: 34,
            zIndex: 20,
          }}
        >
          <EdTermDef
            variant="blue"
            delay={30}
            term="Dynamic regulatory translation"
            def="Every new or amended circular must be re-read, re-interpreted, mapped to processes and re-implemented — consistently, entity by entity."
            termWidth={420}
            defWidth={560}
            termSize={31}
            defSize={21}
          />
          <EdTermDef
            variant="blue"
            delay={36}
            term="Ongoing compliance management"
            def="Obligations, owners, deadlines, evidence trails and audit packs must stay current between inspections — or gaps become findings."
            termWidth={420}
            defWidth={560}
            termSize={31}
            defSize={21}
          />
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
