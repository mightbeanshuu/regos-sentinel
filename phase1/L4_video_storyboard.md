# L4 — Demo Video Storyboard (≤3 min)

> **Jul 12 update:** This 172-second version remains the expanded Round-02 working-prototype storyboard. For the Round-01 submission link, use the tighter 112-second hybrid pitch/prototype-visualization plan in `SAAS_UI_MOTION_BLUEPRINT_JUL12.md` sections 11-17. Do not present Remotion UI as a working prototype; replace seeded metrics with measured results before Round 02.

> **Product:** RegOS Sentinel · **PS2** Agentic Compliance  
> **Constraint:** HackCulture “Demo video link (maximum 3 minutes)” → **HARD CAP 180s**  
> **Target runtime:** **172s** (8s buffer) · FPS **30** · Aspect **16:9 (1920×1080)**  
> **Remotion base:** [`template-prompt-to-motion-graphics-saas`](https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas) + [`remotion`](https://github.com/remotion-dev/remotion)  
> **Spine (compressed from 5–6 min):** CSCRF → cited obligations → plan/evidence → **change-impact simulator climax** → audit pack + SupTech → sandbox ask  
> **Round:** Expanded working-prototype cut for the post-shortlist phase; product-led SaaS motion, with synthetic and simulated data labeled explicitly.

---

## 0. Production constants

| Constant | Value |
| --- | --- |
| `FPS` | 30 |
| `DURATION_FRAMES` | 5160 (172s) |
| `SAFE_CAP` | 5400 (180s) — never exceed |
| Brand | RegOS Sentinel |
| Entity | Small Stock Broker — “Aarohan Securities” (synthetic) |
| Corpus shown | CSCRF (Aug 2024) + Stock Broker Master Circular (Jun 2025) |
| Climax circular | Simulated “CSCRF Amendment — Incident Reporting SLA” |
| Metric overlays | Docs **4** · Obligations **127** · Citation **100%** · Time-to-plan **<3 min** |
| VO voice | Calm, precise, product-demo (not hype reel) |
| Music | Soft ambient tech bed, duck under VO; swell on simulator beat |
| Disclaimer lower-third | Persistent micro: “Decision support · Not legal advice · Human approval required” (beats 2–7) |

### Remotion scene-type vocabulary (map to template skills)

| Scene type | Template skill / pattern | Use |
| --- | --- | --- |
| `KineticType` | typography + spring-physics | Hook, titles, metric callouts |
| `BrowserChrome` | UI mock + sequencing | Product surfaces inside fake browser |
| `UICursor` | sequencing + spring | Cursor click, hover, approve |
| `AgentPipeline` | sequencing + transitions | 5-agent strip (Watcher→…→Auditor) |
| `SourceSplit` | crossfade + highlight | PDF left / obligation card right |
| `MetricHUD` | charts + spring counters | Floating KPI chips |
| `ImpactDiff` | TransitionSeries + wipe/slide | Simulator climax |
| `ExportReveal` | spring + PDF page stack | Audit pack |
| `HeatmapGrid` | charts staggered | SupTech view |
| `LogoOutro` | spring + fade | Close / ask |

**Motion grammar (SaaS, not slideshow):**
- Prefer `spring({ damping: 18–28, stiffness: 120 })` for UI entrances
- Scene changes via `TransitionSeries` + `springTiming` / soft `fade` (12–18 frames) — never hard cuts between product beats
- Cursor moves with slight overshoot; clicks flash a 4px ring
- Metric chips count-up with spring, then settle
- No emoji, no purple glow, no pill-stat strips in hero — dark slate UI chrome, crisp white content plane, single accent (teal `#0D9488` or SEBI-adjacent deep navy `#0B1F3A`)

---

## 1. Beat map (172s total)

| # | Timecode | Dur | Beat | Climax weight |
| --- | ---: | ---: | --- | --- |
| 1 | 00:00–00:12 | 12s | Problem hook | Setup |
| 2 | 00:12–00:22 | 10s | Brand + agentic promise | Setup |
| 3 | 00:22–00:36 | 14s | Entity setup | Setup |
| 4 | 00:36–01:06 | 30s | Source → cited obligation | Proof |
| 5 | 01:06–01:32 | 26s | Workflow + evidence | Proof |
| 6 | **01:32–02:10** | **38s** | **Change-impact simulator** | **CLIMAX** |
| 7 | 02:10–02:35 | 25s | Audit pack + SupTech | Payoff |
| 8 | 02:35–02:52 | 17s | Metrics + sandbox ask | Close |
| — | 02:52–03:00 | 8s | **Unused buffer** | — |

**Word budget:** ~2.4 words/sec spoken ≈ **~410 words** total VO. Scripts below are exact and timed.

---

## 2. Second-by-second storyboard

### BEAT 1 — Problem hook  
**00:00–00:12** · 12s · Scene: `KineticType` + abstract doc→chaos morph

| t | On-screen | Motion |
| ---: | --- | --- |
| 0.0–1.5 | Black → deep navy wash. Tiny SEBI circular PDF icons drift in. | Fade + slow parallax |
| 1.5–5.0 | Headline words stack: **“Circulars are text.”** then **“Compliance needs structure.”** | Word-by-word spring |
| 5.0–9.0 | Split: left = dense PDF paragraphs; right = empty Kanban / blank owners. Red dashed gap labeled **manual translation**. | Wipe reveal |
| 9.0–12.0 | Stat chip fades: **“Weeks per circular.”** | Soft pulse once |

**VO (exact):**  
“SEBI publishes obligations as circulars. Small brokers still translate each one by hand — who does what, by when, with what evidence. Slow. Uneven. Un-auditable.”

**B-roll / notes:** Pure motion graphics. No product UI yet. Keep first viewport brand-adjacent (navy + paper texture), not purple SaaS cliché.

**Real vs mock (Jul 12):** **Pure MG** — no screenshots needed.

---

### BEAT 2 — Brand + agentic promise  
**00:12–00:22** · 10s · Scene: `LogoOutro` intro + `AgentPipeline`

| t | On-screen | Motion |
| ---: | --- | --- |
| 12–14 | Wordmark **RegOS Sentinel** locks center; tagline under: *Agentic compliance OS*. | Spring scale 0.92→1 |
| 14–19 | Horizontal agent strip appears: **Watcher · Interpreter · Mapper · Evidence · Auditor**. Each node lights in sequence. | Staggered spring, 6f delay |
| 19–22 | Subline: **Cited. Scored. Human-approved.** | Fade up |

**VO (exact):**  
“RegOS Sentinel turns those circulars into clause-cited obligations, evidence workflows, and an audit pack — every line traceable, every AI step human-gated.”

**B-roll / notes:** Agent nodes are compact pills with subtle connector lines (not a flowchart slide). One accent color only.

**Real vs mock:** **Pure MG** logo + diagram. Ship-quality vector, not Figma export with drop shadows.

---

### BEAT 3 — Entity setup  
**00:22–00:36** · 14s · Scene: `BrowserChrome` + `UICursor` + `MetricHUD` (seed)

| t | On-screen | Motion |
| ---: | --- | --- |
| 22–24 | Browser chrome slides up: URL `app.regos.sentinel/cockpit`. | Spring from y+40 |
| 24–28 | Entity picker: select **Stock Broker → Small-size RE → Aarohan Securities**. | Cursor click; dropdown spring |
| 28–32 | Corpus chips check on: **CSCRF**, **Stock Broker MC**. (SCORES/ODR stays unchecked — keep focus.) | Checkmark pop |
| 32–36 | Cockpit loads: posture ring **62%**, open tasks **18**, last sync **just now**. Agent strip mini in sidebar. | Skeleton → content crossfade |

**VO (exact):**  
“Meet a small stock broker. We load its profile, then two real public SEBI documents — CSCRF and the Stock Broker Master Circular.”

**Metric overlay (seed, top-right HUD):**  
`Docs 0→2` counting up as chips check.

**B-roll / notes:** Cursor path should feel intentional (ease-in-out, 400–600ms). No narration of every click.

**Real vs mock (Jul 12):** **High-fidelity Remotion UI mock** of cockpit. If a live Next.js screen exists by shoot day, replace with **real screenshot** of entity picker; otherwise keep mock but match final design tokens.

---

### BEAT 4 — Source → cited obligation (trust proof)  
**00:36–01:06** · 30s · Scene: `SourceSplit` + `UICursor` + `MetricHUD`

| t | On-screen | Motion |
| ---: | --- | --- |
| 36–40 | Watcher toast: **“2 documents ingested.”** Interpreter progress bar runs. | Toast slide + bar fill |
| 40–46 | Obligation register fills rows (stagger): Actor / Action / Deadline / Evidence / Confidence. Counter: **Obligations 0→127**. | Row cascade |
| 46–52 | Cursor clicks row: **“Conduct cyber audit after audit period”** (CISO). Split view opens. | Click + panel slide |
| 52–60 | Left: CSCRF PDF; yellow highlight on verbatim clause. Right: obligation card with fields + **citation span** + confidence **0.91** + status **Pending review**. | Highlight draw-on |
| 60–66 | Officer clicks **Approve**. Status → **Human-approved**. Audit log line appends. | Button press + check spring |
| 66–70 | HUD chip: **Citation coverage 100%**. | Counter settle |

**VO (exact):**  
“The Interpreter compiles a structured register — not a chat answer. Open one obligation: the source viewer highlights the exact clause, with confidence and review status. Nothing is taken on faith. Approve it — and the audit log records the human gate.”

**Metric overlays:**  
- `Docs: 4` (finalize count — include FAQ/supporting as “loaded corpus”)  
- `Obligations: 127`  
- `Citation: 100%`

**B-roll / notes:** This beat kills the “just RAG” objection visually. Hold the highlighted clause ≥2.5s so judges can read a fragment. Use real CSCRF clause text (short excerpt), not lorem.

**Real vs mock (Jul 12):**  
- **Prefer real:** PDF page crop of actual CSCRF + highlighted span (even if extraction is seeded).  
- **Mock OK:** Obligation table chrome, approve button, confidence badge — Remotion components styled as product.  
- **Must look real:** Citation binding (yellow span ↔ card) — do not fake with unrelated text.

---

### BEAT 5 — Workflow + evidence  
**01:06–01:32** · 26s · Scene: `BrowserChrome` + `UICursor` + light `HeatmapGrid` tease

| t | On-screen | Motion |
| ---: | --- | --- |
| 66–72 | Button **Generate Compliance Plan** → click. | Cursor + ripple |
| 72–80 | Kanban columns populate: **CISO / Compliance / Ops / Grievance**. Cards fly to owners with deadlines. | Staggered card flight |
| 80–86 | Evidence Locker: drag-drop **VAPT_report.pdf** (labeled SYNTHETIC). Maps to cyber-audit obligation. | Drop + link pulse |
| 86–92 | Evidence graph node lights green; posture ring **62% → 71%**. | Ring animate |
| 92–98 | Tiny timer chip: **Time-to-plan 2m 14s**. | Spring in |

**VO (exact):**  
“Mapper turns obligations into a plan — owners, deadlines, evidence required. Upload synthetic proof — a VAPT report — and readiness moves. Circular to operational plan: under three minutes.”

**Metric overlay:**  
`Time-to-plan < 3 min` (show **2:14** as concrete demo number).

**B-roll / notes:** Keep evidence clearly badged **SYNTHETIC** (trust with judges). Do not linger on upload UX — one clean drop.

**Real vs mock (Jul 12):**  
- **Mock OK:** Kanban + evidence graph (Remotion).  
- **Nice if real:** File drop interaction screenshot.  
- Always show **SYNTHETIC** badge on evidence artifacts.

---

### BEAT 6 — CHANGE-IMPACT SIMULATOR (CLIMAX)  
**01:32–02:10** · 38s · Scene: `ImpactDiff` + `MetricHUD` + `TransitionSeries`

| t | On-screen | Motion |
| ---: | --- | --- |
| 98–102 | Full-bleed moment title (over dimmed UI): **Change-Impact Simulator**. | KineticType, 1 beat |
| 102–108 | Button **Simulate New SEBI Circular** — cursor clicks. Watcher badge flashes **NEW**. | Emphasis zoom 1.0→1.04 |
| 108–116 | Incoming circular card: *CSCRF Amendment — Incident Reporting SLA (simulated)*. Diff mode engages. | Card fly-in from top |
| 116–128 | Impact panel cascades: **+12 obligations added** · **7 changed** · **4 controls impacted** · **CISO + Ops owners** · **9 new tasks** · **Evidence reqs updated**. Risk score **Medium → Elevated**. | Staggered counters + red/amber diffs |
| 128–136 | Side-by-side: before/after control graph; changed edges pulse. | Wipe / slide transition |
| 136–142 | Overlay line (kinetic): **Weeks → Minutes.** | Hard hold |

**VO (exact):**  
“Now the key moment. A new circular drops. RegOS simulates the operational impact instantly — new and changed obligations, controls hit, owners affected, tasks generated, risk movement. What normally takes a compliance team weeks… RegOS surfaces in minutes.”

**B-roll / notes:**  
- This is the **signature beat** (flagship §12 / build spec Surface 7). Give it the most motion budget.  
- Use `TransitionSeries` with `slide` or soft `wipe` + `springTiming({ damping: 200, durationInFrames: 18 })`.  
- Music swell + 1 subtle whoosh on impact cascade — then duck for VO.  
- Do **not** cut away early; let judges feel the “aha.”

**Real vs mock (Jul 12):**  
- **High-fidelity mock is fine** for idea round — but animate like a live product (diff rows appearing, not a static slide titled “Simulator”).  
- If prototype exists: **real UI recording** of Simulate click → impact panel is the single highest-ROI capture.

---

### BEAT 7 — Audit pack + SupTech  
**02:10–02:35** · 25s · Scene: `ExportReveal` + `HeatmapGrid`

| t | On-screen | Motion |
| ---: | --- | --- |
| 130–136 | Click **Export Audit Pack**. PDF stack builds: Entity · Obligations · Citations · Evidence · Approvals · Gaps · Disclaimer. | Page peel / stack spring |
| 136–142 | Zoom into one page: obligation row with **clause citation + approval stamp**. | Ken Burns light |
| 142–152 | Switch: **SupTech / SEBI–MII view** — anonymized readiness across synthetic brokers; common gaps; slow circulars. | Crossfade to heatmap |
| 152–155 | Caption: **Anonymized · No PII · Supervision signal.** | Fade |

**VO (exact):**  
“Export the audit pack — every obligation, evidence, owner approval, and source citation. Then the SupTech view: anonymized readiness across intermediaries — supervision value for SEBI and MIIs, without raw PII.”

**B-roll / notes:** Audit pack should look printable (margins, table, footer disclaimer). SupTech = aggregate only; no broker names that look like real firms beyond synthetic labels (Broker A/B/C or clearly fake).

**Real vs mock (Jul 12):**  
- **Mock OK:** PDF pages as Remotion layouts.  
- **Prefer real asset:** One generated sample audit-pack PDF page screenshot if exporter exists.  
- SupTech: **pure MG / mock dashboard** acceptable for idea round.

---

### BEAT 8 — Metrics + sandbox ask  
**02:35–02:52** · 17s · Scene: `MetricHUD` full + `LogoOutro`

| t | On-screen | Motion |
| ---: | --- | --- |
| 155–162 | Four metric tiles slam in (2×2): **Docs 4** · **Obligations 127** · **Citation 100%** · **Time-to-plan <3 min**. | Spring stagger |
| 162–168 | Closing card: **Built for SEBI Innovation Sandbox.** Sub: *Public circulars → synthetic evidence → MII/intermediary pilot.* | Fade |
| 168–172 | Wordmark + URL/GitHub placeholder + line: **Pilot path: one broker → industry body → MII.** | Hold |

**VO (exact):**  
“Four docs. One hundred twenty-seven obligations. One hundred percent citation coverage. Plan in under three minutes. RegOS Sentinel is sandbox-ready — preserve safeguards, human in the loop, ready to pilot.”

**B-roll / notes:** End on ask, not features. No “thank you” slide bloat. Last frame holds 1.5s for freeze-frame / thumbnail.

**Real vs mock:** **Pure MG** metrics + outro. Numbers must match on-screen HUD from earlier beats.

---

## 3. Full VO script (contiguous, ~172s)

```text
[00:00] SEBI publishes obligations as circulars. Small brokers still translate each one by hand —
        who does what, by when, with what evidence. Slow. Uneven. Un-auditable.

[00:12] RegOS Sentinel turns those circulars into clause-cited obligations, evidence workflows,
        and an audit pack — every line traceable, every AI step human-gated.

[00:22] Meet a small stock broker. We load its profile, then two real public SEBI documents —
        CSCRF and the Stock Broker Master Circular.

[00:36] The Interpreter compiles a structured register — not a chat answer. Open one obligation:
        the source viewer highlights the exact clause, with confidence and review status.
        Nothing is taken on faith. Approve it — and the audit log records the human gate.

[01:06] Mapper turns obligations into a plan — owners, deadlines, evidence required.
        Upload synthetic proof — a VAPT report — and readiness moves.
        Circular to operational plan: under three minutes.

[01:32] Now the key moment. A new circular drops. RegOS simulates the operational impact instantly —
        new and changed obligations, controls hit, owners affected, tasks generated, risk movement.
        What normally takes a compliance team weeks… RegOS surfaces in minutes.

[02:10] Export the audit pack — every obligation, evidence, owner approval, and source citation.
        Then the SupTech view: anonymized readiness across intermediaries —
        supervision value for SEBI and MIIs, without raw PII.

[02:35] Four docs. One hundred twenty-seven obligations. One hundred percent citation coverage.
        Plan in under three minutes. RegOS Sentinel is sandbox-ready —
        preserve safeguards, human in the loop, ready to pilot.
```

**Approx word count:** ~390 · **Fits ≤175s** at measured demo pace (~2.3 wps) with intentional pauses on simulator.

---

## 4. Metric overlay spec (persistent HUD)

Mount a top-right `MetricHUD` from **00:28** onward; update values at beat boundaries.

| Metric | Start | End value | Animate at | Style |
| --- | --- | --- | --- | --- |
| Docs loaded | 0 | **4** | 00:28–00:36 (→2), 00:40 (→4) | Mono chip |
| Obligations | 0 | **127** | 00:40–00:46 count-up | Mono chip |
| Citation coverage | — | **100%** | 01:02–01:06 | Green settle |
| Time-to-plan | — | **<3 min** (show **2:14**) | 01:28–01:32 | Amber→green |

On climax (01:32+), dim HUD 40% so ImpactDiff owns attention; restore for Beat 8 tiles.

---

## 5. Remotion composition plan

```text
<Composition id="RegOSDemo172" durationInFrames={5160} fps={30} width={1920} height={1080}>
  <TransitionSeries>
    Beat1_ProblemHook          // 0–360f
    Beat2_BrandAgents          // 360–660f
    Beat3_EntitySetup          // 660–1080f
    Beat4_SourceCitation       // 1080–1980f
    Beat5_WorkflowEvidence     // 1980–2760f
    Beat6_ImpactSimulator      // 2760–3900f   ← climax
    Beat7_AuditSupTech         // 3900–4650f
    Beat8_MetricsSandboxAsk    // 4650–5160f
  </TransitionSeries>
  <MetricHUD />                // AbsoluteFill overlay, gated by frame
  <TrustDisclaimer />          // lower-third microcopy
</Composition>
```

**Transition budget between beats:** 12–18 frames (`fade` or `slide`), counted *inside* beat edges so total stays 5160f.

**Constants-first (template pattern):** declare all VO-synced timings, colors, metric targets, and copy strings at top of each scene file for fast Jul 12 iteration.

**Suggested project bootstrap (Phase 2/4):**
```bash
npx create-video@latest --template prompt-to-motion-graphics-saas
# or remotion scaffold + port spring/TransitionSeries patterns from that template
```

---

## 6. Real UI screenshots vs pure motion graphics (Jul 12 idea round)

Idea round may be **conceptual** — still grade as shipped SaaS demo.

| Surface | Jul 12 recommendation | Why |
| --- | --- | --- |
| Problem hook / logo / agents | **Pure MG** | Faster, cleaner brand control |
| Cockpit / entity picker | **Remotion UI mock** (or real if ready) | Looks productized without full app |
| CSCRF source highlight | **Real PDF crop + highlight** | Trust; proves corpus is real |
| Obligation register + approve | **Mock UI** OK | Schema clarity > pixel-perfect app |
| Kanban / evidence drop | **Mock UI** + SYNTHETIC badge | Speed |
| **Change-impact simulator** | **Best available:** real capture > animated mock | Signature beat — invest here |
| Audit pack pages | **Mock PDF** or 1 real export page | Tangible close |
| SupTech heatmap | **Pure MG / mock** | Synthetic aggregates fine |
| Metric tiles / outro | **Pure MG** | Consistency |

**Recording rule if any live UI exists:** 60fps screen capture → retimed in Remotion; overlay cursor in Remotion for polish rather than raw OS cursor.

**Do not:** slideshow of static Figma frames with Ken Burns only. Judges feel the difference.

---

## 7. Audio / caption / accessibility

| Track | Spec |
| --- | --- |
| VO | Single narrator, dry + light room; -14 LUFS integrated |
| Music | Low bed; −20 dB under VO; +4 dB swell 01:32–01:40 only |
| SFX | Soft UI clicks, one impact whoosh, PDF “stack” tick — sparse |
| Captions | Burned-in lower-third captions (HackCulture may mute); max 2 lines |
| Trust line | Always-on micro disclaimer from 00:12 |

---

## 8. 30-second teaser cut (social / thumbnail loop)

**Runtime:** 30s exact · Composition `RegOSTeaser30` · 900 frames @ 30fps  
**Use:** LinkedIn/X, deck appendix, optional HackCulture secondary — **not** a substitute for the ≤3 min field.

| t | Visual | VO |
| ---: | --- | --- |
| 0–5 | Kinetic: “Circulars are text. Compliance needs structure.” | “SEBI circulars still become compliance work by hand.” |
| 5–10 | Logo + 5-agent strip | “RegOS Sentinel — agentic, cited, human-approved.” |
| 10–18 | Source split: clause highlight ↔ obligation card | “Every obligation bound to its source clause.” |
| 18–26 | **Simulator climax** (compressed impact cascade) | “New circular? See the operational impact in minutes.” |
| 26–30 | Metrics 4 / 127 / 100% / <3 min + Sandbox ask | “Sandbox-ready. RegOS Sentinel.” |

**Teaser rule:** Steal *only* Beats 1→2→4 fragment→6→8; skip entity/workflow/SupTech detail.

---

## 9. Compression map (5–6 min → 172s)

| Long demo (build spec §8 / flagship §12) | Video treatment |
| --- | --- |
| Minute 0 problem | Beat 1 (12s) |
| Entity + corpus | Beat 3 (14s) — drop SCORES/ODR on-screen |
| Source-to-obligation + approve | Beat 4 (30s) — one obligation only |
| Workflow board | Beat 5a (merged) |
| Evidence + audit log | Beat 5b (merged) — one upload |
| **Simulator** | **Beat 6 (38s) — expanded** |
| Audit export + SupTech | Beat 7 (25s) |
| Sandbox close | Beat 8 (17s) |
| Benchmark deep-dive / model card | **Cut** (deck/docs carry) |
| Multi-corpus tour | **Cut** |

---

## 10. Shot list checklist (production)

- [ ] Lock VO take to script (single continuous preferred)
- [ ] CSCRF PDF stills with real clause text for Beat 4
- [ ] Design tokens: navy `#0B1F3A`, teal `#0D9488`, paper `#F8FAFC`, danger `#DC2626`
- [ ] Build Remotion scenes with constants-first timings
- [ ] Animate simulator impact rows (do not static-slide)
- [ ] Wire MetricHUD to frame ranges
- [ ] Burn captions + trust disclaimer
- [ ] Export H.264 1080p ≤180s; verify file duration before upload
- [ ] Export teaser 30s square + 16:9 crops if needed
- [ ] Thumbnail frame: simulator “Weeks → Minutes” (01:40) or metric slam (02:38)

---

## 11. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Runtime creep past 180s | Hard edit at 172s; cut Beat 5 evidence hold first |
| Looks like a slide deck | Mandatory cursor + spring UI; ban full-bleed title cards except 1s climax label |
| “Just RAG” perception | Hold citation highlight ≥2.5s; say “not a chat answer” |
| Synthetic data distrust | On-screen SYNTHETIC badges; VO says “synthetic proof” once |
| Climax underplayed | 38s reserved; music swell; no competing HUD |

---

## 12. Handoff

| Next | Owner / phase |
| --- | --- |
| Remotion project scaffold from SaaS MG template | Phase 2 / Phase 4 |
| Align visual system with L3 deck tokens | L3 ↔ L4 sync |
| Paste demo link field after render | L2 submission copy |
| Prefer live simulator capture if app ready by Aug video | Post–Jul 12 upgrade path |

**Status:** Video storyboard **locked at 172s** (≤175s target, ≤180s hard cap). Climax = Change-Impact Simulator. Close = Innovation Sandbox ask.
)
