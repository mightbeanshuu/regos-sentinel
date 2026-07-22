# Regulatory span segmentation rule

The Coverage Ledger denominator is defined before any build runs.

## Hero pack

The active pack contains nine human-verified spans from the 11 June 2025 CSCRF FAQ:

- one preface span that records the FAQ's guidance status;
- Q14, Q15, Q16, Q17(a), Q17(b), Q20, Q24, and Q25 as distinct question/answer spans.

Q17 is split at the lettered branches because each branch supports a different operational
rule. A question, answer, table row, or lettered branch is not split again unless separate
normative statements need different deontic types. Inline references are modelled as
`SourceReference` records and are not silently counted as processed text.

Every scoped span receives one Coverage Ledger disposition:

- `COMPILED_OBLIGATION`
- `INFORMATIONAL`
- `DUPLICATE_OR_SUPERSEDED`
- `OUT_OF_PROFILE_SCOPE`
- `AMBIGUOUS_REVIEW_REQUIRED`

The build blocks while a scoped normative span remains ambiguous or an explicit outbound
reference remains unresolved. Counts shown in the interface refer to this declared pack, not
the full FAQ, CSCRF, or wider SEBI corpus.

## Reference fixtures

The prototype resolves four references and hashes each excerpt separately:

- Q15 → CSCRF Table 19
- Q15 → PR.MA Guideline 6
- Q16 → Annexure-A
- Q17(a) → PR.MA.S3

The combined CSCRF document hash covers those four human-verified excerpts, not the full PDF.
The Stock Broker Master Circular source pack remains labelled with zero indexed spans and zero
compiled candidates until its own segmentation and human review take place.

## Uploaded documents

A document supplied through **Review your document** has no question, answer, or lettered-branch
boundaries to segment on, so the rule above is applied at its smallest safe unit:

1. The PDF is split by page. A page yielding no extractable text is recorded as unreadable and
   is never given invented content.
2. Each page is split into blocks on blank lines, then each block is split into **sentences**.
   The sentence is the smallest unit that reliably carries exactly one requirement strength, so
   a sentence carrying two — as the CSCRF Q15 answer does — surfaces intact for a person to
   read rather than being silently divided.
3. A fragment shorter than 40 characters is folded into the preceding unit rather than dropped,
   so no visible text goes uncounted. Pure numbering and rule lines are excluded.
4. Review stops at 400 passages per document; truncation is stated in the document's
   limitations rather than hidden.

Each resulting passage receives one disposition, assigned by fixed rule from its language alone
and never by a model:

- `POSSIBLE_REQUIREMENT` — requirement-shaped language, pending human confirmation
- `RECOMMENDATION` — no mandatory task is created
- `PERMISSION` — no mandatory task is created
- `BACKGROUND` — no requirement, recommendation or permission language found
- `DUPLICATE_OR_SUPERSEDED` — wording already counted at an earlier locator
- `NEEDS_REVIEW` — more than one requirement strength in one passage

A passage classified `NEEDS_REVIEW` holds the whole document out of an approvable state until a
named person records a reading. Counts shown for an uploaded document describe only the pages
and passages listed above — never the document as a whole where part of it could not be read.
