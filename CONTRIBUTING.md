# Contributing to RegOS Sentinel

This is a private competition-development repository. Contributions are accepted from authorized collaborators only unless the maintainers explicitly state otherwise.

## Before changing code

1. Read `README.md`, `docs/PRODUCT_SCOPE.md`, and `docs/VALIDATION.md`.
2. Confirm whether the change belongs to the current P0 prototype, P1 roadmap, or vision.
3. Do not introduce claims, integrations, benchmarks, customers, or regulatory interpretations that cannot be demonstrated and sourced.
4. Do not commit secrets, source-document copies with unclear redistribution rights, raw research caches, or generated renders.

## Development

```bash
cd regos-motion
npm ci
npm run dev
```

Use a short topic branch:

```bash
git switch -c feat/coverage-ledger-motion
```

## Code expectations

- Keep animation deterministic through `useCurrentFrame()`, `spring()`, and `interpolate()`.
- Preserve the composition dimensions, frame rate, duration, and beat boundaries unless the change is explicitly approved.
- Use native React/SVG for readable UI and diagrams.
- Keep teal reserved for verified states and amber for review or stale states.
- Label synthetic data and simulated connectors in-frame.
- Add abstractions only when they remove meaningful duplication.
- Keep older compositions functional unless the task explicitly retires them.

## Required checks

```bash
cd regos-motion
npm run typecheck
npm run build
```

For visual changes, render representative frames from the affected beat and inspect them at 1920x1080.

## Pull requests

Pull requests must state:

- what changed;
- which composition and frames are affected;
- whether any product claim changed;
- whether new assets were added and who owns them;
- the commands used to verify the change;
- remaining visual or technical risk.

By contributing, you confirm that you have the right to submit the material. No open-source license is granted by contribution to this repository.
