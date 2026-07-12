# Assets and Provenance

## Policy

The final film is code-first. Readable UI, regulatory text, diagrams, cursors, audit states, and product logic must remain native React/SVG. External media may enrich the cinematic layer but must not carry critical information.

Before publishing this repository publicly, verify that every retained asset can be redistributed under its original terms.

## Pitch asset registry

Assets are stored in `regos-motion/public/assets/pitch/`. Runtime selection is controlled by `regos-motion/src/remotion/pitch/assets.ts`.

| File | Intended role | Current use | Distribution note |
| --- | --- | --- | --- |
| `icon_app.png` | Isolated application icon | Enabled | Generated/local asset; verify public redistribution rights |
| `art_monolith.png` | Compliance monolith | Enabled | Generated/local asset; verify public redistribution rights |
| `art_docgraph.png` | Document-to-graph art | Disabled | White background prevents intended compositing |
| `plate_bloom.mp4` | Dark logo plate | Disabled | Code-native background preferred |
| `plate_signal.mp4` | Signal-field plate | Disabled | Code-native background preferred |
| `plate_light.mp4` | Light contrast plate | Disabled | Code-native background preferred |
| `jitter_logo_splash.json` | Optional logo timing | Absent/disabled | Native Remotion implementation preferred |

## Legacy assets

Files directly under `regos-motion/public/assets/` support older compositions. Their presence does not imply that they should be used in the final pitch.

## Adding an asset

1. Record its creator, source, generation tool, and license or permission.
2. Use a descriptive lowercase filename.
3. Optimize media before committing it.
4. Keep individual files below GitHub's ordinary file limits; use Git LFS for genuinely necessary large media.
5. Add or update the asset registry.
6. Provide a code-native fallback when the asset is optional.
7. Test alpha, color profile, frame rate, and looping behavior.

Do not commit source recordings, unlicensed music, private documents, or raw client data.
