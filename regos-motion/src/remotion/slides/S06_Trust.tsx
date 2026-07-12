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
import {AuditPackArt} from '../system/editorialArt';

// T7 clone — blue field, full-height artifact panel left, giant white title,
// justified paragraph, two term/definition pairs side by side.
export const S06_Trust: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="blue">
        {/* left artifact strip — template photo slot, clears the header */}
        <div style={{position: 'absolute', left: 0, top: 150, bottom: 0, zIndex: 10}}>
          <AuditPackArt width={600} height={930} delay={10} />
        </div>

        <EdHeader variant="blue" />

        {/* giant title — right zone */}
        <div style={{position: 'absolute', left: 680, top: 250, zIndex: 20}}>
          <EdDisplay
            variant="blue"
            lines={['TRUST, BY', 'DESIGN']}
            size={172}
            delay={8}
          />
        </div>

        {/* paragraph */}
        <div style={{position: 'absolute', left: 680, top: 646, zIndex: 20}}>
          <EdBody variant="blue" width={1120} delay={22} size={24}>
            Reg 16C makes regulated entities accountable for every AI output —
            so accountability is the architecture. Retrieval-grounded citations on
            100% of displayed obligations, a labeled extraction benchmark, model
            card, risk register and DPDP-aligned data minimisation: public corpus
            and synthetic evidence only, no PII, no safeguard bypass. Decision
            support — never autonomous legal advice.
          </EdBody>
        </div>

        {/* two term/defs side by side */}
        <div
          style={{
            position: 'absolute',
            left: 680,
            top: 872,
            display: 'flex',
            gap: 80,
            zIndex: 20,
          }}
        >
          <EdTermDef
            variant="blue"
            delay={30}
            term="Human gates"
            def="Nothing publishes without a compliance officer's sign-off. The autonomy dial — suggest, draft, act — keeps agent authority explicit and logged."
            termWidth={230}
            defWidth={300}
            termSize={30}
            defSize={20}
          />
          <EdTermDef
            variant="blue"
            delay={36}
            term="Tamper-evident"
            def="A hash-chained AI action log seals every audit pack with a verifiable manifest — an inspector can replay exactly what the agents did, and why."
            termWidth={240}
            defWidth={300}
            termSize={30}
            defSize={20}
          />
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
