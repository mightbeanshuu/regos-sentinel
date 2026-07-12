import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {
  ED_BLUE,
  ED_BLUE_DEEP,
  ED_BODY,
  ED_TEAL,
  ED_WHITE,
  ED_WHITE_PURE,
  Rise,
  useReveal,
} from './editorial';

// Coded replacements for the template's photo panels — flat, editorial,
// blue-monochrome product artifacts. No dark-SaaS glow in this system.

// ---------- shared frame ----------

export const PanelFrame: React.FC<{
  width: number | string;
  height: number | string;
  children: React.ReactNode;
  delay?: number;
  background?: string;
  style?: React.CSSProperties;
}> = ({width, height, children, delay = 0, background = ED_WHITE_PURE, style}) => {
  const p = useReveal(delay);
  return (
    <div
      style={{
        width,
        height,
        background,
        overflow: 'hidden',
        position: 'relative',
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        boxShadow: '0 18px 60px rgba(10,22,70,0.18)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Generated-art panel — drops the user's AI renders into template photo slots. */
export const ImagePanel: React.FC<{
  src: string;
  width: number | string;
  height: number | string;
  delay?: number;
  objectPosition?: string;
}> = ({src, width, height, delay = 0, objectPosition = 'center'}) => (
  <PanelFrame width={width} height={height} delay={delay} background="#050D1A">
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition,
      }}
    />
  </PanelFrame>
);

// ---------- RegOS cockpit UI (the "product photo") ----------

type Row = {
  id: string;
  text: string;
  owner: string;
  due: string;
  status: 'Approved' | 'In review' | 'Assigned';
};

const ROWS: Row[] = [
  {id: 'OB-114', text: 'Designate Cyber-Resilience officer & report to board', owner: 'CISO', due: 'Quarterly', status: 'Approved'},
  {id: 'OB-115', text: 'Run VAPT on critical systems; file closure report', owner: 'IT Ops', due: '30 Sep', status: 'In review'},
  {id: 'OB-121', text: 'Resolve SCORES complaints within 21 days, link ODR', owner: 'Grievance', due: 'Rolling', status: 'Approved'},
  {id: 'OB-127', text: 'Maintain client-fund segregation evidence log', owner: 'Compliance', due: 'Weekly', status: 'Assigned'},
  {id: 'OB-133', text: 'Annual system audit by CERT-In empanelled auditor', owner: 'CISO', due: '31 Mar', status: 'In review'},
];

const STATUS_FILL: Record<Row['status'], string> = {
  Approved: ED_TEAL,
  'In review': 'rgba(27,63,184,0.16)',
  Assigned: 'rgba(27,63,184,0.16)',
};

/** Browser-chromed RegOS cockpit mock, blue-on-white editorial duotone. */
export const CockpitPanel: React.FC<{
  width: number;
  height: number;
  delay?: number;
  zoom?: number;
  showCitation?: boolean;
}> = ({width, height, delay = 0, zoom = 1, showCitation = true}) => {
  const frame = useCurrentFrame();
  return (
    <PanelFrame width={width} height={height} delay={delay}>
      {/* browser chrome */}
      <div
        style={{
          height: 54,
          background: ED_BLUE,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 22,
          gap: 10,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: 999,
              border: `2px solid ${ED_WHITE_PURE}`,
              opacity: 0.85,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 18,
            height: 30,
            width: Math.min(430, width - 160),
            background: 'rgba(255,255,255,0.16)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 16,
            color: ED_WHITE_PURE,
            letterSpacing: '0.01em',
          }}
        >
          regos.sentinel / cockpit / obligations
        </div>
      </div>

      <div style={{transform: `scale(${zoom})`, transformOrigin: 'top left'}}>
        {/* app bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 26px 14px',
          }}
        >
          <div style={{fontFamily: ED_BODY, fontWeight: 700, fontSize: 24, color: ED_BLUE}}>
            Obligation Register — Small Stock Broker
          </div>
          <div
            style={{
              fontFamily: ED_BODY,
              fontWeight: 700,
              fontSize: 15,
              color: ED_BLUE,
              border: `2px solid ${ED_BLUE}`,
              padding: '6px 12px',
            }}
          >
            CSCRF · BROKER MC · SCORES/ODR
          </div>
        </div>

        {/* table header */}
        <div
          style={{
            display: 'flex',
            padding: '8px 26px',
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 15,
            color: 'rgba(27,63,184,0.55)',
            letterSpacing: '0.06em',
          }}
        >
          <div style={{width: 90}}>ID</div>
          <div style={{flex: 1}}>OBLIGATION</div>
          <div style={{width: 120}}>OWNER</div>
          <div style={{width: 100}}>DUE</div>
          <div style={{width: 120}}>STATUS</div>
        </div>

        {ROWS.map((r, i) => {
          const rowIn = interpolate(
            frame,
            [delay + 8 + i * 4, delay + 18 + i * 4],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '13px 26px',
                borderTop: '1px solid rgba(27,63,184,0.14)',
                opacity: rowIn,
                fontFamily: ED_BODY,
                fontSize: 17,
                color: ED_BLUE_DEEP,
              }}
            >
              <div style={{width: 90, fontWeight: 700}}>{r.id}</div>
              <div style={{flex: 1, fontWeight: 500, paddingRight: 14}}>{r.text}</div>
              <div style={{width: 120, fontWeight: 600}}>{r.owner}</div>
              <div style={{width: 100, fontWeight: 500}}>{r.due}</div>
              <div style={{width: 120}}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '5px 10px',
                    background: STATUS_FILL[r.status],
                    color: r.status === 'Approved' ? ED_BLUE_DEEP : ED_BLUE,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}

        {/* kanban summary row — fills tall panels */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            padding: '10px 26px 0',
          }}
        >
          {[
            ['NOT STARTED', '11'],
            ['EVIDENCE PENDING', '23'],
            ['UNDER REVIEW', '9'],
            ['APPROVED', '105'],
          ].map(([k, v], i) => (
            <Rise key={k} delay={delay + 20 + i * 4} style={{flex: 1}}>
              <div
                style={{
                  border: '2px solid rgba(27,63,184,0.3)',
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.07em',
                    color: 'rgba(27,63,184,0.6)',
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 34,
                    color: ED_BLUE,
                    marginTop: 2,
                  }}
                >
                  {v}
                </div>
              </div>
            </Rise>
          ))}
        </div>

        {/* simulator teaser — fills tall panels, plants the S07 payoff */}
        <Rise delay={delay + 24}>
          <div
            style={{
              margin: '16px 26px 0',
              border: `3px solid ${ED_TEAL}`,
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.08em',
                  color: 'rgba(27,63,184,0.6)',
                }}
              >
                CHANGE-IMPACT SIMULATOR
              </div>
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 20,
                  color: ED_BLUE,
                  marginTop: 4,
                }}
              >
                New circular dropped → +12 obligations · 8 controls · 21 tasks
              </div>
            </div>
            <div
              style={{
                fontFamily: ED_BODY,
                fontWeight: 700,
                fontSize: 15,
                color: ED_BLUE_DEEP,
                background: ED_TEAL,
                padding: '9px 14px',
                whiteSpace: 'nowrap',
              }}
            >
              SIMULATE →
            </div>
          </div>
        </Rise>

        {/* citation strip */}
        {showCitation && (
          <Rise delay={delay + 26}>
            <div
              style={{
                margin: '14px 26px',
                background: ED_BLUE,
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  SOURCE CLAUSE · VERBATIM
                </div>
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 600,
                    fontSize: 17,
                    color: ED_WHITE_PURE,
                    marginTop: 4,
                  }}
                >
                  “REs shall conduct VAPT of critical systems…” — CSCRF §Ⅳ, SEBI/HO/ITD-1/…/2024/113
                </div>
              </div>
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 15,
                  color: ED_BLUE,
                  background: ED_TEAL,
                  padding: '9px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                APPROVE ✓
              </div>
            </div>
          </Rise>
        )}
      </div>
    </PanelFrame>
  );
};

/** Purpose-built portrait cockpit — the title-slide monolith (Big Ben role).
 * Rises fluidly from below the canvas like the template's Big Ben. */
export const CockpitTower: React.FC<{
  width: number;
  height: number;
  delay?: number;
  riseFrom?: number;
}> = ({width, height, delay = 0, riseFrom = 900}) => {
  const frame = useCurrentFrame();
  const p = useReveal(delay, 26);
  const cards: Array<{id: string; text: string; status: string; teal?: boolean}> = [
    {id: 'OB-114', text: 'Cyber-resilience officer designated; board reporting live', status: 'APPROVED', teal: true},
    {id: 'OB-115', text: 'VAPT on critical systems — closure report due 30 Sep', status: 'IN REVIEW'},
    {id: 'OB-121', text: 'SCORES complaints ≤ 21 days · ODR linkage active', status: 'APPROVED', teal: true},
    {id: 'OB-127', text: 'Client-fund segregation evidence log — weekly', status: 'ASSIGNED'},
    {id: 'OB-133', text: 'Annual system audit · CERT-In empanelled auditor', status: 'IN REVIEW'},
  ];
  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        background: ED_WHITE_PURE,
        transform: `translateY(${(1 - p) * riseFrom}px)`,
        boxShadow: '0 30px 90px rgba(6,14,50,0.45)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* chrome */}
      <div
        style={{
          height: 52,
          background: ED_BLUE_DEEP,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 20,
          gap: 9,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              border: `2px solid ${ED_WHITE_PURE}`,
              opacity: 0.85,
            }}
          />
        ))}
        <div
          style={{
            marginLeft: 12,
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 15,
            color: ED_WHITE_PURE,
            opacity: 0.9,
          }}
        >
          regos.sentinel / cockpit
        </div>
      </div>

      {/* header */}
      <div style={{padding: '22px 26px 6px'}}>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.1em',
            color: 'rgba(27,63,184,0.55)',
          }}
        >
          SMALL STOCK BROKER · CSCRF TIER
        </div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 25,
            color: ED_BLUE,
            marginTop: 6,
          }}
        >
          Obligation Register
        </div>
      </div>

      {/* stacked obligation cards */}
      <div
        style={{
          padding: '10px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          flex: 1,
        }}
      >
        {cards.map((c, i) => {
          const inP = interpolate(
            frame,
            [delay + 10 + i * 5, delay + 24 + i * 5],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          return (
            <div
              key={c.id}
              style={{
                border: '2px solid rgba(27,63,184,0.35)',
                padding: '14px 16px',
                opacity: inP,
                transform: `translateY(${(1 - inP) * 16}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'rgba(27,63,184,0.6)',
                  }}
                >
                  {c.id}
                </span>
                <span
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 12.5,
                    letterSpacing: '0.05em',
                    padding: '4px 9px',
                    background: c.teal ? ED_TEAL : 'rgba(27,63,184,0.14)',
                    color: ED_BLUE_DEEP,
                  }}
                >
                  {c.status}
                </span>
              </div>
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 600,
                  fontSize: 17.5,
                  lineHeight: 1.28,
                  color: ED_BLUE_DEEP,
                  marginTop: 8,
                }}
              >
                {c.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* more-rows hint */}
      <div
        style={{
          padding: '12px 22px 0',
          fontFamily: ED_BODY,
          fontWeight: 700,
          fontSize: 15,
          color: 'rgba(27,63,184,0.55)',
          letterSpacing: '0.04em',
        }}
      >
        + 143 MORE OBLIGATIONS · ALL CLAUSE-CITED
      </div>

      {/* citation footer */}
      <div
        style={{
          margin: 22,
          marginTop: 'auto',
          background: ED_BLUE,
          padding: '14px 16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 12.5,
            letterSpacing: '0.09em',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          SOURCE CLAUSE · VERBATIM
        </div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 600,
            fontSize: 15.5,
            lineHeight: 1.3,
            color: ED_WHITE_PURE,
            marginTop: 5,
          }}
        >
          “REs shall conduct VAPT of critical systems…” — CSCRF §Ⅳ
        </div>
      </div>
    </div>
  );
};

// ---------- circular stack (problem art) ----------

export const CircularStackArt: React.FC<{
  width: number;
  height: number;
  delay?: number;
}> = ({width, height, delay = 0}) => {
  const sheets = [
    {label: 'MASTER CIRCULAR — STOCK BROKERS · JUN 2025', rot: -3, y: 0},
    {label: 'CSCRF FOR REGULATED ENTITIES · AUG 2024', rot: 2.4, y: 118},
    {label: 'FAQS — CSCRF & CLOUD FRAMEWORK · JUN 2025', rot: -1.6, y: 236},
    {label: 'SCORES ↔ ODR LINKAGE · SEP 2023', rot: 3.2, y: 354},
    {label: 'INTERMEDIARIES (AMENDMENT) REG · FEB 2025', rot: -2.2, y: 472},
  ];
  return (
    <PanelFrame width={width} height={height} delay={delay} background={ED_WHITE}>
      <div style={{position: 'absolute', inset: 0, padding: 40}}>
        {sheets.map((s, i) => (
          <Rise key={i} delay={delay + 8 + i * 5} distance={40}>
            <div
              style={{
                position: 'absolute',
                top: 60 + s.y * ((height - 260) / 590),
                left: 40,
                right: 40,
                height: 150 * ((height - 200) / 590),
                minHeight: 96,
                background: ED_WHITE_PURE,
                border: `2.5px solid ${ED_BLUE}`,
                transform: `rotate(${s.rot}deg)`,
                padding: '18px 24px',
              }}
            >
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 19,
                  color: ED_BLUE,
                  letterSpacing: '0.02em',
                }}
              >
                {s.label}
              </div>
              {[0.9, 0.72, 0.5].map((w, j) => (
                <div
                  key={j}
                  style={{
                    height: 7,
                    width: `${w * 100}%`,
                    background: 'rgba(27,63,184,0.22)',
                    marginTop: 11,
                  }}
                />
              ))}
            </div>
          </Rise>
        ))}
      </div>
    </PanelFrame>
  );
};

// ---------- weeks→minutes chart (T5 clone) ----------

export const WeeksToMinutesChart: React.FC<{
  width: number;
  height: number;
  delay?: number;
}> = ({width, height, delay = 0}) => {
  const frame = useCurrentFrame();
  const bars = [
    {label: 'Read & interpret', value: 14, unit: 'days', color: ED_WHITE_PURE},
    {label: 'Map & assign', value: 10, unit: 'days', color: ED_WHITE_PURE},
    {label: 'Evidence & audit prep', value: 12, unit: 'days', color: ED_WHITE_PURE},
    {label: 'RegOS Sentinel', value: 0.6, unit: 'minutes', color: ED_TEAL},
  ];
  const max = 14;
  const chartH = height - 120;
  return (
    <div style={{width, height, position: 'relative'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 100,
          height: 2,
          background: 'rgba(255,255,255,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 56,
          padding: '0 10px 100px',
        }}
      >
        {bars.map((b, i) => {
          const grow = interpolate(
            frame,
            [delay + 10 + i * 8, delay + 34 + i * 8],
            [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          const hpx = Math.max(14, (b.value / max) * chartH * grow);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: ED_BODY,
                  fontWeight: 700,
                  fontSize: 30,
                  color: b.color,
                  marginBottom: 12,
                  opacity: grow,
                }}
              >
                {b.value >= 1 ? `${b.value}d` : '≈min'}
              </div>
              <div
                style={{
                  width: '100%',
                  height: hpx,
                  background: b.color,
                  borderRadius: 10,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* labels row */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 30,
          display: 'flex',
          gap: 56,
          padding: '0 10px',
        }}
      >
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: ED_BODY,
              fontWeight: 600,
              fontSize: 22,
              color: i === bars.length - 1 ? ED_TEAL : ED_WHITE_PURE,
              lineHeight: 1.15,
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- five-agent pipeline (editorial flat) ----------

const AGENTS = ['WATCHER', 'INTERPRETER', 'MAPPER', 'EVIDENCE', 'AUDITOR'];

export const PipelineDiagram: React.FC<{
  width: number;
  delay?: number;
}> = ({width, delay = 0}) => {
  const cell = (width - 4 * 28) / 5;
  return (
    <div style={{width}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 0}}>
        {AGENTS.map((a, i) => (
          <React.Fragment key={a}>
            <Rise delay={delay + i * 6}>
              <div
                style={{
                  width: cell,
                  border: `3px solid ${ED_BLUE}`,
                  padding: '22px 0 18px',
                  textAlign: 'center',
                  background: ED_WHITE_PURE,
                }}
              >
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 17,
                    letterSpacing: '0.04em',
                    color: 'rgba(27,63,184,0.55)',
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    fontFamily: ED_BODY,
                    fontWeight: 700,
                    fontSize: 23,
                    letterSpacing: '0.03em',
                    color: ED_BLUE,
                    marginTop: 2,
                  }}
                >
                  {a}
                </div>
              </div>
            </Rise>
            {i < AGENTS.length - 1 && (
              <div style={{width: 28, height: 3, background: ED_BLUE, flexShrink: 0}} />
            )}
          </React.Fragment>
        ))}
      </div>
      <Rise delay={delay + 34}>
        <div
          style={{
            marginTop: 22,
            border: `3px solid ${ED_BLUE}`,
            background: ED_BLUE,
            color: ED_WHITE_PURE,
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 21,
            letterSpacing: '0.04em',
            textAlign: 'center',
            padding: '14px 0',
          }}
        >
          VERIFICATION LAYER + HUMAN APPROVAL GATE — BETWEEN EVERY STEP
        </div>
      </Rise>
    </div>
  );
};

// ---------- audit pack artifact (trust slide) ----------

export const AuditPackArt: React.FC<{
  width: number;
  height: number;
  delay?: number;
}> = ({width, height, delay = 0}) => {
  return (
    <PanelFrame width={width} height={height} delay={delay} background={ED_WHITE}>
      <div style={{padding: 44}}>
        <Rise delay={delay + 6}>
          <div
            style={{
              fontFamily: ED_BODY,
              fontWeight: 700,
              fontSize: 26,
              color: ED_BLUE,
              borderBottom: `3px solid ${ED_BLUE}`,
              paddingBottom: 14,
            }}
          >
            AUDIT PACK — Q2 FY27 · SMALL STOCK BROKER
          </div>
        </Rise>
        {[
          ['Obligations tracked', '148 · every one clause-cited'],
          ['Human approvals logged', '212 · zero silent auto-publish'],
          ['Evidence items linked', '96 · synthetic, labeled'],
          ['Open gaps flagged', '6 · owners + deadlines assigned'],
          ['Reg-Diff supersessions', '3 · flagged and resolved'],
          ['Simulator runs logged', '17 · minutes per impact plan'],
        ].map(([k, v], i) => (
          <Rise key={k} delay={delay + 12 + i * 6}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '17px 0',
                borderBottom: '1.5px solid rgba(27,63,184,0.22)',
                fontFamily: ED_BODY,
                fontSize: 21,
                color: ED_BLUE_DEEP,
              }}
            >
              <span style={{fontWeight: 700}}>{k}</span>
              <span style={{fontWeight: 500}}>{v}</span>
            </div>
          </Rise>
        ))}
        <Rise delay={delay + 40}>
          <div
            style={{
              marginTop: 26,
              background: ED_BLUE,
              padding: '16px 20px',
              fontFamily: ED_BODY,
              color: ED_WHITE_PURE,
            }}
          >
            <div style={{fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', opacity: 0.75}}>
              HASH-CHAINED MANIFEST · TAMPER-EVIDENT
            </div>
            <div style={{fontWeight: 600, fontSize: 18, marginTop: 5, letterSpacing: '0.02em'}}>
              sha256 : 8f3a…c41e ✓ verified against action log
            </div>
          </div>
        </Rise>
        <Rise delay={delay + 46}>
          <div
            style={{
              marginTop: 18,
              border: `3px solid ${ED_TEAL}`,
              padding: '14px 20px',
              fontFamily: ED_BODY,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: '0.08em',
                color: 'rgba(27,63,184,0.6)',
              }}
            >
              AUTONOMY DIAL · REG 16C
            </div>
            <div style={{fontWeight: 700, fontSize: 20, color: ED_BLUE, marginTop: 5}}>
              SUGGEST → DRAFT → ACT — always behind a human gate
            </div>
          </div>
        </Rise>
      </div>
    </PanelFrame>
  );
};

// ---------- corpus card (proof slide) ----------

export const CorpusCard: React.FC<{
  title: string;
  ref: string;
  date: string;
  delay?: number;
  height?: number;
}> = ({title, ref: refNo, date, delay = 0, height = 300}) => (
  <Rise delay={delay} style={{flex: 1}}>
    <div
      style={{
        height,
        background: ED_BLUE,
        padding: '30px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.09em',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          PUBLIC SEBI DOCUMENT · {date}
        </div>
        <div
          style={{
            fontFamily: ED_BODY,
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1.16,
            color: ED_WHITE_PURE,
            marginTop: 14,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          fontFamily: ED_BODY,
          fontWeight: 600,
          fontSize: 17,
          color: 'rgba(255,255,255,0.8)',
          borderTop: '1.5px solid rgba(255,255,255,0.3)',
          paddingTop: 14,
        }}
      >
        {refNo}
      </div>
    </div>
  </Rise>
);
