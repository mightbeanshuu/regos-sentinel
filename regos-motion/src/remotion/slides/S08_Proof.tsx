import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdHeader,
  ED_MARGIN,
} from '../system/editorial';
import {CorpusCard} from '../system/editorialArt';

// T2 clone — white field, giant hyphenated blue title left, justified
// paragraph right, three panels across the bottom (corpus cards).
export const S08_Proof: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="white">
        <EdHeader variant="white" />

        {/* giant title */}
        <div style={{position: 'absolute', left: ED_MARGIN, top: 240, zIndex: 20}}>
          <EdDisplay
            variant="white"
            lines={['REAL CORPUS,', 'REAL BUILD']}
            size={130}
            delay={8}
          />
        </div>

        {/* paragraph right */}
        <div style={{position: 'absolute', right: ED_MARGIN, top: 296, zIndex: 20}}>
          <EdBody variant="white" width={560} delay={22} size={23}>
            The MVP runs on real, public SEBI documents — evidence artifacts are
            synthetic and labeled; no PII, no live trading. Working prototype and
            demo video land inside the Round-02 window: Next.js compliance
            cockpit, FastAPI services, five supervised agents with retrieval
            grounding, provider-agnostic LLM layer, Postgres + pgvector.
          </EdBody>
        </div>

        {/* three corpus cards */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            right: ED_MARGIN,
            bottom: 96,
            display: 'flex',
            gap: 44,
            zIndex: 20,
          }}
        >
          <CorpusCard
            delay={30}
            date="JUN 2025"
            title="Master Circular for Stock Brokers"
            ref="SEBI/HO/MIRSD/MIRSD-PoD/P/CIR/2025/90"
          />
          <CorpusCard
            delay={35}
            date="AUG 2024 + FAQ JUN 2025"
            title="Cybersecurity & Cyber Resilience Framework (CSCRF)"
            ref="SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113"
          />
          <CorpusCard
            delay={40}
            date="SEP 2023"
            title="SCORES Grievance Redressal ↔ ODR Linkage"
            ref="SEBI/HO/OIAE/IGRD/CIR/P/2023/156"
          />
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
