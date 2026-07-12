import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  EdBody,
  EdCanvas,
  EdDisplay,
  EdLogo,
  ED_BLUE,
  ED_BODY,
  ED_DATE,
  ED_TEAL,
  ED_WHITE_PURE,
  ED_MARGIN,
  Rise,
  edInk,
} from '../system/editorial';

// T8 clone — full-width blue band on top (competitive frame replaces the
// photo band), giant centered title, two justified paragraph columns.
const BandCard: React.FC<{
  kicker: string;
  title: string;
  body: string;
  delay: number;
  highlight?: boolean;
}> = ({kicker, title, body, delay, highlight}) => (
  <Rise delay={delay} style={{flex: 1}}>
    <div
      style={{
        height: 250,
        border: `3px solid ${highlight ? ED_TEAL : 'rgba(255,255,255,0.55)'}`,
        background: highlight ? 'rgba(45,212,191,0.10)' : 'transparent',
        padding: '26px 30px',
      }}
    >
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '0.1em',
          color: highlight ? ED_TEAL : 'rgba(255,255,255,0.65)',
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 29,
          color: ED_WHITE_PURE,
          marginTop: 10,
          lineHeight: 1.12,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 500,
          fontSize: 19,
          lineHeight: 1.3,
          color: 'rgba(255,255,255,0.88)',
          marginTop: 12,
        }}
      >
        {body}
      </div>
    </div>
  </Rise>
);

export const S09_SebiValue: React.FC = () => {
  return (
    <AbsoluteFill>
      <EdCanvas variant="white">
        {/* top blue band — template photo band slot */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 380,
            background: ED_BLUE,
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: ED_MARGIN,
              right: ED_MARGIN,
              top: 62,
              display: 'flex',
              gap: 40,
            }}
          >
            <BandCard
              delay={10}
              kicker="ENTERPRISE COMPLIANCEOS"
              title="Tier-1 BFSI, closed stack"
              body="Category proven in India — enterprise-priced, sold to the largest institutions."
            />
            <BandCard
              delay={16}
              kicker="GLOBAL GRC SUITES"
              title="Western corpora, bank-scale"
              body="Obligations management for Tier-1 banks across jurisdictions — not SEBI-first."
            />
            <BandCard
              delay={22}
              highlight
              kicker="REGOS SENTINEL — THE WEDGE"
              title="Small SEBI REs, inspectable"
              body="Sandbox-ready, clause-cited, CSCRF-first — built for the lean broker segment those tools don't serve."
            />
          </div>
        </div>

        {/* header sits below band */}
        <Rise delay={6} style={{position: 'absolute', top: 428, left: ED_MARGIN, zIndex: 20}}>
          <EdLogo variant="white" />
        </Rise>
        <Rise delay={8} style={{position: 'absolute', top: 434, right: ED_MARGIN, zIndex: 20}}>
          <span
            style={{fontFamily: ED_BODY, fontWeight: 600, fontSize: 27, color: edInk('white')}}
          >
            {ED_DATE}
          </span>
        </Rise>

        {/* giant centered title */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 528,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <EdDisplay variant="white" lines={['BUSINESS MODEL']} size={150} delay={14} align="center" />
        </div>

        {/* two paragraph columns */}
        <div
          style={{
            position: 'absolute',
            left: ED_MARGIN,
            right: ED_MARGIN,
            top: 762,
            display: 'flex',
            gap: 80,
            zIndex: 20,
          }}
        >
          <EdBody variant="white" width="100%" delay={26} size={23} style={{flex: 1}}>
            Buyer: the compliance officer / CISO at small and mid-size stock
            brokers facing circular churn, CSCRF evidence burden and Reg 16C AI
            liability — without enterprise RegTech budgets. Willingness to pay is
            proven by the enterprise tier; our white-space is the underserved
            segment, served openly and inspectably.
          </EdBody>
          <EdBody variant="white" width="100%" delay={32} size={23} style={{flex: 1}}>
            Per-entity SaaS (corpus packs + seats + evidence storage), corpus
            onboarding, and a labeled-benchmark QA add-on. The schema is
            corpus-agnostic: expand to IAs, RTAs and AMCs, then MII multi-member
            licences and anonymized SupTech readiness views. Path: TechSprint →
            SEBI Innovation Sandbox → 90-day broker pilot → paid pilots.
          </EdBody>
        </div>
      </EdCanvas>
    </AbsoluteFill>
  );
};
