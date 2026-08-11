"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";

import {
  ASSISTANT_GLYPHS,
  ClauseSheet,
  EvidenceChain,
  Glyph,
  PipelineDiagram,
  ShieldMark,
} from "../components/landing/art";
import { CitationField } from "../components/landing/CitationField";
import "./landing.css";

/**
 * The landing page. It is the front door: this is `/`, and the working product
 * is one click away at `/app`.
 *
 * It used to live at /landing, on the reasoning that a submission being judged
 * should not have its entry point moved by a marketing page. That was reversed
 * deliberately on 2026-08-11 — a visitor who arrives cold needs the argument
 * before the workspace, and a judge who wants the product is one labelled
 * button away. `/landing` still resolves: it permanently redirects here, so
 * every link already shared stays good.
 *
 * Both CTAs point at /app. If this page ever moves again, they are the two
 * places to change, plus the redirect in next.config.ts and the harnesses in
 * scripts/qa that drive the product.
 *
 * EVERY FIGURE AND QUOTATION BELOW IS REAL OUTPUT. The refusal is what the
 * assistant actually returns for that question; the quoted answer and its
 * locator come from the same call; 27 is the true size of the searched corpus
 * (18 workspace spans + 9 advisory); 26 steps and 14 findings are what the
 * four assistants actually produce against the seeded workspace. A page that
 * says "10x faster compliance" would contradict the product it is selling,
 * whose entire claim is that it does not assert things it cannot show.
 *
 * That constraint is also the design brief. The strongest thing this product
 * does is REFUSE — so the refusal gets a section of its own, set at the same
 * scale as the answer, rather than being hidden in a footnote.
 */

const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/** One reveal. Collapses to a plain fade when the visitor asks for less motion. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? { hidden: { opacity: 0 }, shown: { opacity: 1 } } : rise}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Section({
  id,
  kicker,
  title,
  lede,
  children,
  wide,
}: {
  id: string;
  kicker: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`lp-section${wide ? " lp-section--wide" : ""}`} id={id}>
      <Reveal>
        <p className="lp-kicker">{kicker}</p>
        <h2 className="lp-h2">{title}</h2>
        {lede ? <p className="lp-lede">{lede}</p> : null}
      </Reveal>
      {children}
    </section>
  );
}

const ASSISTANTS = [
  {
    key: "resolver",
    name: "Reference resolver",
    job: "Checks that every “see Table 19” really points at Table 19.",
    steps: 5,
    tone: "var(--ok)",
  },
  {
    key: "scout",
    name: "Source scout",
    job: "Spots when SEBI’s wording quietly moves.",
    steps: 11,
    tone: "var(--accent)",
  },
  {
    key: "adversary",
    name: "Adversary",
    job: "Tries to break our own conclusions before a regulator can.",
    steps: 2,
    tone: "var(--review)",
  },
  {
    key: "extractor",
    name: "Extractor",
    job: "Asks of every sentence: can this make a calendar date?",
    steps: 8,
    tone: "var(--accent)",
  },
];

export default function LandingPage() {
  return (
    <main className="lp">
      {/* ---- Hero ------------------------------------------------------- */}
      <header className="lp-hero">
        <CitationField />
        <div className="lp-hero-scrim" aria-hidden />

        <div className="lp-hero-inner">
          <Reveal className="lp-brandline">
            <ShieldMark size={22} />
            <span>RegOS Sentinel</span>
            <span className="lp-brandline-sep" aria-hidden />
            <span className="lp-brandline-ps">SEBI TechSprint · PS2</span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="lp-h1">
              One week.
              <br />
              <span className="lp-h1-accent">From when?</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="lp-sub">
              SEBI’s cyber framework tells a broker to close a high-severity finding within one
              week. It never says one week from <em>when</em>. RegOS Sentinel reads the circular,
              finds the gap, and refuses to invent the date — it puts the decision in front of a
              named person instead.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="lp-cta">
            <Link href="/app" className="lp-btn lp-btn--primary">
              Open the workspace
            </Link>
            <a
              href="https://github.com/mightbeanshuu/regos-sentinel"
              className="lp-btn"
              target="_blank"
              rel="noreferrer"
            >
              Read the source
            </a>
          </Reveal>

          <Reveal delay={0.32}>
            <dl className="lp-stats">
              {[
                ["27", "SEBI passages read"],
                ["4", "assistants, one job each"],
                ["26", "steps, every one hashed"],
                ["0", "dates invented"],
              ].map(([figure, label]) => (
                <div key={label} className="lp-stat">
                  <dt className="lp-stat-figure">{figure}</dt>
                  <dd className="lp-stat-label">{label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="lp-legend" aria-hidden>
          <span><i style={{ background: "var(--accent)" }} />computed</span>
          <span><i style={{ background: "var(--ok)" }} />verified</span>
          <span><i style={{ background: "var(--review)" }} />a person decides</span>
        </div>
      </header>

      {/* ---- The defect -------------------------------------------------- */}
      <Section
        id="gap"
        kicker="The defect"
        title={<>A period is not a deadline</>}
        lede={
          <>
            A rule can tell you how long you have and never tell you when the clock starts. You
            cannot work out a date from that, and confidence does not help. Most tools fill the gap
            with an assumption. This one names it.
          </>
        }
      >
        <div className="lp-split">
          <Reveal className="lp-split-art">
            <ClauseSheet />
          </Reveal>
          <motion.ul
            className="lp-points"
            variants={stagger}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.3 }}
          >
            {[
              ["Reads the period", "“a period of 6 months” — stated plainly, and found."],
              ["Looks for the trigger", "Nothing in the passage says what starts it."],
              ["Stops", "No due date is computed. None is guessed."],
              ["Hands it over", "The gap goes to a named person, with the passage attached."],
            ].map(([term, detail]) => (
              <motion.li key={term} variants={rise} className="lp-point">
                <span className="lp-point-term">{term}</span>
                <span className="lp-point-detail">{detail}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </Section>

      {/* ---- Pipeline ----------------------------------------------------- */}
      <Section
        id="how"
        wide
        kicker="How it works"
        title={<>Four steps, and a place it stops</>}
        lede="Before it asks you to trust anything, it shows you what it does."
      >
        <Reveal>
          <div className="lp-panel lp-panel--flush">
            <PipelineDiagram />
          </div>
          <p className="lp-caption">…and it stops wherever the source stops.</p>
        </Reveal>
      </Section>

      {/* ---- The refusal --------------------------------------------------- */}
      <Section
        id="refusal"
        kicker="The part most tools hide"
        title={<>It would rather say nothing than guess</>}
        lede="Both of these are real answers from the running product, to two questions a compliance officer would actually ask."
      >
        <div className="lp-answers">
          <Reveal className="lp-answer lp-answer--quoted">
            <p className="lp-answer-q">“What is the reporting timeline for a cyber incident?”</p>
            <p className="lp-answer-tag" style={{ color: "var(--ok)" }}>
              SEBI’s words, quoted · 1 citation
            </p>
            <blockquote className="lp-answer-body">
              Please refer Section 4.3. ‘VAPT’ under ‘CSCRF Compliance, Audit Report Submission, and
              Timelines’ in CSCRF. It mentions VAPT related reporting, periodicity, and timelines.
            </blockquote>
            <p className="lp-answer-cite">FAQ dated 11 June 2025 · PDF pages 8–9 · Q16</p>
          </Reveal>

          <Reveal delay={0.1} className="lp-answer lp-answer--refused">
            <p className="lp-answer-q">“How long do we have to report a cyber incident to SEBI?”</p>
            <p className="lp-answer-tag" style={{ color: "var(--review)" }}>
              No answer given · 0 citations
            </p>
            <blockquote className="lp-answer-body">
              I don’t have SEBI wording that answers that, so I’m not going to answer it. Everything
              I say has to be a quotation from a document in this workspace — if it isn’t there,
              guessing would be worse than saying nothing.
            </blockquote>
            <p className="lp-answer-cite">Nothing in the reviewed passages scored high enough to be a match.</p>
          </Reveal>
        </div>
      </Section>

      {/* ---- Assistants ---------------------------------------------------- */}
      <Section
        id="assistants"
        wide
        kicker="AI assistants"
        title={<>Four readers, one job each</>}
        lede="They read. Fixed rules decide. A person judges. No assistant holds a tool that writes."
      >
        <motion.div
          className="lp-grid"
          variants={stagger}
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, amount: 0.2 }}
        >
          {ASSISTANTS.map((assistant) => (
            <motion.article key={assistant.key} variants={rise} className="lp-card">
              <span className="lp-card-glyph" style={{ borderColor: `color-mix(in oklab, ${assistant.tone} 34%, transparent)` }}>
                <Glyph path={ASSISTANT_GLYPHS[assistant.key]} tone={assistant.tone} />
              </span>
              <h3 className="lp-card-name">{assistant.name}</h3>
              <p className="lp-card-job">{assistant.job}</p>
              <p className="lp-card-steps">{assistant.steps} recorded steps</p>
            </motion.article>
          ))}
        </motion.div>
      </Section>

      {/* ---- The record ----------------------------------------------------- */}
      <Section
        id="record"
        wide
        kicker="The record"
        title={<>A trace you can recompute</>}
        lede="Every step an assistant takes carries the digest of the step before it. That is what makes the trace evidence rather than a log."
      >
        <Reveal>
          <div className="lp-panel lp-panel--flush">
            <EvidenceChain />
          </div>
        </Reveal>
      </Section>

      {/* ---- Close ------------------------------------------------------------ */}
      <footer className="lp-foot">
        <Reveal>
          <ShieldMark size={44} />
          <h2 className="lp-foot-title">Decision support that shows its work</h2>
          <p className="lp-foot-sub">— and stops where the source stops.</p>
          <div className="lp-cta">
            <Link href="/app" className="lp-btn lp-btn--primary">
              Open the workspace
            </Link>
          </div>
          <p className="lp-foot-note">
            A prototype built for the SEBI Securities Market TechSprint at GFF 2026. It supports a
            compliance decision; it is not legal advice, not a SEBI determination, and nothing is
            filed automatically.
          </p>
        </Reveal>
      </footer>
    </main>
  );
}
