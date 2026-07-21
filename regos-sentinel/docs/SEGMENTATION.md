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
