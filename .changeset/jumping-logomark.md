---
"@posthog/brand": minor
---

`Logo.Logomark` can now jump — the hedgehog springs up with the same staggered animation as the PostHog app (its 3 spikes and head take off one after the other). It's static by default; opt in with `jumpOnClick` (successive clicks escalate the height along the app's curve) and/or `autoJumpMs` for automatic jumps. Tune it with `jumpHeight` / `airtimeMs`; `prefers-reduced-motion` is respected. `Logo.Logomark` now renders as 4 animatable parts and forwards its `ref` to the `<svg>` like the rest of `Logo`.
