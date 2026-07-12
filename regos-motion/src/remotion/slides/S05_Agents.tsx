import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  ED_BLUE,
  ED_BODY,
  ED_MARGIN,
  Rise,
} from '../system/editorial';
import {PipelineDiagram} from '../system/editorialArt';

// T6 clone — white field, giant blue title left, pipeline diagram right-top,
// five icon-crowned term/definition columns across the bottom.
const AGENT_DEFS: Array<[string, string, string]> = [
  ['Watcher', 'Detects new and amended circulars on public SEBI pages; emits change events.', 'assets/icon_watcher.jpg'],
  ['Interpreter', 'Schema-locked extraction — actor, action, deadline, evidence, citation, confidence.', 'assets/icon_interpreter.jpg'],
  ['Mapper', 'Applies the entity profile; maps obligations to controls, owners and deadlines.', 'assets/icon_mapper.jpg'],
  ['Evidence', 'Generates SLA tasks, accepts labeled proof uploads, tracks workflow states.', 'assets/icon_evidence.jpg'],
  ['Auditor', 'Assembles the risk heatmap and the hash-sealed, clause-cited audit pack.', 'assets/icon_auditor.jpg'],
];

export const S05_Agents: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="white">
        <EdHeader variant="white" />

        {/* giant title */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 216, zIndex: 20}}>
          <EdDisplay variant="white" lines={['HOW IT', 'WORKS']} size={190} delay={8} />
        </div>

        {/* pipeline diagram — template photo slot, right-top */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 216, zIndex: 20}}>
          <PipelineDiagram width={940} delay={14} />
        </div>

        {/* intro paragraph under diagram */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 545, zIndex: 20}}>
          <EdBody variant="white" width={860} delay={24} size={23}>
            Five narrow agents, one deterministic verification layer, and a human
            approval gate on every publish path. Low-confidence extractions route
            to review — nothing ships silently.
          </EdBody>
        </div>

        {/* five columns bottom */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            right: ED_MARGIN,
            bottom: 88,
            display: 'flex',
            gap: 44,
            zIndex: 20,
          }}
        >
          {AGENT_DEFS.map(([term, def, icon], i) => (
            <Rise key={term} delay={34 + i * 5} style={{flex: 1}}>
              <Img
                src={staticFile(icon)}
                style={{
                  width: 116,
                  height: 116,
                  objectFit: 'cover',
                  borderRadius: 22,
                  display: 'block',
                  marginBottom: 16,
                  boxShadow: '0 12px 32px rgba(10,22,70,0.35)',
                }}
              />
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 28,
                  color: ED_BLUE,
                  borderTop: `3px solid ${ED_BLUE}`,
                  paddingTop: 14,
                }}
              >
                {term}
              </div>
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 500,
                  fontSize: 19,
                  lineHeight: 1.32,
                  color: ED_BLUE,
                  marginTop: 8,
                  textAlign: 'justify',
                }}
              >
                {def}
              </div>
            </Rise>
          ))}
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
