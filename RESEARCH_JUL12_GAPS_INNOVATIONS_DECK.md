# Jul 12 Pre-Submit Research — Gaps, Innovation Veins, Funnel Stats, Deck Rebuild

> Generated 2026-07-12 (submission day). Companion to `SUBMISSION_PACKAGE.md` (now updated with top innovations) and the deck rebuild in `regos-motion/`.

---

## 1. Selection-funnel research (how many make the prototype round)

**2026 TechSprint (this one):**
- Round 01 — preliminary shortlisting of idea applications (deadline **Jul 12, 2026**)
- Round 02 — shortlist based on **working prototype + solution video** (video window **Aug 17–21, 2026**)
- Round 03 — **Demo & Jury** at SEBI, **Sep 9–11, 2026**, then Final Pitch & Awards at GFF (Jio World Centre, Mumbai)
- **No official "top X" count published** for Round-02/Round-03 as of Jul 12.

**2025 edition (Securities Market Hackathon @ GFF '25) — best available triangulation:**
- ~**872 submissions** (participant-sourced; MIDAS/IIIT-D team claim — no official SEBI master list exists)
- Funnel: submissions (Sep 5) → solution video (Sep 10) → shortlisting Sep 15–20 → **jury evaluation Sep 28–30** → finals at GFF
- Jury/demo round appears to be **single-digit: ~top 6** (MIDAS claims 4th/872, "Top-6 finalist / Jury Recommendation")
- Sister event proxy: **SBI Hackathon @ GFF 2026 officially states top-10 to jury round**

**Implication (strategic):** expect roughly **6–10 teams at demo/jury** out of ~900+ entries — a ~1% funnel. Round-01 idea deck is the single biggest filter (it's the only artifact SEBI sees today). Deck quality is not cosmetic; it IS the game. Prototype (Aug) must actually work — "shortlisting based on working prototype" is explicit.

Sources: sebi.gov.in PR Jun 2026 (TechSprint launch), globalfintechfest.com/gff-hackathons/sebi-techsprint, hackculture.io listing, sebi-gff-winners.finance-midas.tech (participant page), GFF 2025 hackathon page timeline, SBI Hackathon GFF 2026 page.

---

## 2. Feature gaps found in the current champion (RegOS Sentinel)

| # | Gap | Why it matters |
|---|---|---|
| G1 | **No blockchain story** despite rules explicitly encouraging Blockchain | Free rubric points; Reg 16C accountability pairs perfectly with tamper-evidence |
| G2 | **DPI buried** (DigiLocker was "stretch"; no Bhashini) | Rules explicitly encourage DPI; judges are GFF/India-stack people |
| G3 | **Agentic autonomy is binary** (HITL everywhere) — reads as "supervised workflow", weak on the "agentic" keyword | PS2 is literally titled *Agentic* Compliance; need explicit graduated autonomy |
| G4 | **No enforcement-risk lens** — obligations aren't linked to what non-compliance costs (public SEBI enforcement orders) | Market-impact criterion; makes pain quantifiable for judges |
| G5 | **Supersession/contradiction detection hidden inside Verification** — not a named feature | SEBI is rewriting master circulars NOW (comments closed Jul 13); "Reg Diff" is perfectly timed |
| G6 | **No deadline-horizon UX** (compliance calendar / nudges) | Small-broker reality; cheap to build, very demoable |
| G7 | **Benchmark not framed as open artifact** | "Open labeled SEBI obligation benchmark" = inspectability proof, zero extra build |
| G8 | **Deck shows zero product UI** — all abstract text slides | Judges shortlist what they can see; every reference deck the user likes is product-mockup-forward |

## 3. Innovation veins — adopted vs parked

**ADOPTED into SUBMISSION_PACKAGE.md today (edits applied):**
1. **Autonomy dial** (suggest → draft → act-with-approval; authority logged per action) → §5, §8 safeguards
2. **Tamper-evident hash-chained AI action log + audit-pack manifest** (SHA-256 chain, Merkle root printed on pack; optional public-chain anchor later — no data on-chain) → §5, §7, §8
3. **Reg-Diff supersession view** timed to the 2026 master-circular rewrite → §5
4. **DPI hooks: DigiLocker-verifiable evidence + Bhashini multilingual obligation briefs (Hindi first)** → §5, §7

**PARKED for Aug prototype round (build if time):**
5. Enforcement-risk lens (public SEBI enforcement orders linked to obligations → "cost of non-compliance" badge)
6. Compliance calendar export (ICS) + deadline nudges
7. SupTech readiness percentile vs anonymized peers
8. Entity-profile what-if switcher (Small ↔ Mid ↔ Qualified RE re-renders the whole obligation graph)

**REJECTED:** anything chat-first (RAG-chatbot smell), autonomous filing/actioning (breaks Reg 16C posture), "first/only" claims (locked out by L1).

---

## 4. Deck rebuild — diagnosis & plan

**Diagnosis of current `RegOSIdeaDeck` (AI-slop causes):**
- 50–70% empty navy void per slide; content floats top-left, bottom half dead
- No product UI anywhere — no dashboard, no obligation table, no simulator mock
- Cheap glowing-circle icons; leftover red debug underline on S02; random color grid on S07
- Single-column text slides = template smell; reference decks are dense bento + mockup-forward

**Target system (from user's reference screenshots — premium dark SaaS: Linear/Ramp-class):**
- Full-bleed aurora/gradient hero fields; fine grain; glass (frosted, 1px hairline borders) bento cards
- **Coded product mockups** as slide heroes (browser-chromed dashboard, obligation table with citation popover, Kanban, simulator diff panel) — built in React/Remotion, crisper than AI images; `BrowserChrome.tsx` already exists in the demo-video beats and can be reused for the deck
- Eyebrow label → huge display headline → support line → bento row; badges/pills; big metric numerals
- Motion: springs on cards, stroke-draw connectors, counter roll-ups, aurora drift

**Slide architecture v2 (same 10-slide contract, new layouts):**
| # | Slide | Hero element |
|---|---|---|
| S01 | Title | Aurora bg + glass emblem + wordmark + 3 badges (PS2 · Sandbox-ready · Reg 16C-native) |
| S02 | Problem | Docs→graph transformation art right, copy left, 3-stat bento bottom (95% · Weeks · 1% funnel-free stat: circular volume) |
| S03 | Why now | Glowing timeline rail: Reg 16C (Feb 25) → Pandey HITL (Jun 12 26) → MC rewrite (Jun 22 26) → CSCRF pressure → TechSprint PS2 |
| S04 | Solution | CODED cockpit mockup in browser chrome + 3 feature chips; "not a chatbot — a compiler" |
| S05 | Agents | 5 glass icon nodes on pipeline + Verification band beneath + autonomy dial widget |
| S06 | Trust | 6-tile bento: 100% citations · HITL gates · hash-chained action log · model card+DPDP · open benchmark · autonomy dial |
| S07 | Impact | Simulator mock (diff panel) + Weeks→Minutes counter + impact-tree art |
| S08 | Proof/MVP | 4 real corpus cards (real SEBI doc numbers) + Aug-9 build path |
| S09 | Market | Differentiation table (OnFinance/Corlytics/RegOS) + wedge + SaaS tiers |
| S10 | Ask | Sandbox stepper (public corpus → 90-day pilot → MII → SupTech) + KPIs + emblem bookend |

**Assets:** AI-generated (Canva/Gemini) for organic/3D art only — aurora bg, emblem, docs→graph art, constellation, 6 glass icons, impact tree. All UI mockups coded. Prompts delivered to user in chat (see conversation 2026-07-12); waiting on PNGs before slide rebuild continues.

---

## 5. Sanity locks (unchanged)
- No "first/only agentic" anywhere; wedge = small-RE / sandbox-inspectable / CSCRF-first
- Change-impact simulator stays the climax
- No invented customers/revenue/winners; 2025 funnel stats are participant-sourced — cite as such if ever asked
