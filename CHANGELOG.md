# @posthog/brand

## 0.8.0

### Minor Changes

- 9de7459: Sync brand assets from Figma (6 added).

  **hoggies**

  - Added 6: Heart, Noir Hog 3, Noir Hog 4, Noir Hog 5, Reading, Research
  - Updated 72: 70's Dance Hog, Art Thief, Back To The Future, Ball Hog, Business Evolution, Card Hog, Caveman, Cereal, Chart Hog, Coffee Run, Croissant, Cursor Hog, Dadd AI Left, Data Thief, Director, Doll House, Drake Nah, Drake Yah, Einstein, Einstein Group, Evel, Experiment, Final Evolution, Gardeners, Greek, Haha Bizzniss, Hand Clasp, Hogpatch, I'm The Driver, Ipad, Jack Dawson, Judge, Lemon Wrangler 1, Lemon Wrangler 3, Lemonade, Lifeguard, Magnifying Glass, Money, Mr Potato Head 1, Noir Hog 1, Noir Hog 2, Party Hog, Pearl Necklace, Phone Call, Piñata Hog, Pope, Quick Call, Reading Is Magic, Remote Work, Reporter, Robo Hog, Rocket, Roller Coaster, Rose, Scientist, Scorpion, Soccer Coach, Speaker, Stamp Denied, Steve Jobs, Surfer, Survey, Swimmer 1, Swimmer 2, The Bride, Traffic Controller, Traffic Police, Transformer, Will Smith, Wizard 4, Wizard Hog, X-ray

## 0.7.0

### Minor Changes

- 2e27b53: feat: variant compound components for numbered hoggies + sync fixes

  Numbered hedgehog families now ship as a single compound component that takes a `variant`
  prop, instead of separate numbered exports. For example `HedgehogGladiator1` /
  `HedgehogGladiator2` become one `<HedgehogGladiator variant="1" | "2" />` (the first
  variant is the default, rendered with no prop). This covers `construction`, `gladiator`,
  `lemon-wrangler`, `mr-potato-head`, and — once synced — `noir-hog`, `swimmer`, and
  `wizard`. Each variant still has its own `svg` / `png` string+URL export and its own
  `AssetMeta` (sharing the base slug, keyed by `variant`), so search and the raw asset
  subpaths are unchanged. Grouping is declared explicitly in `scripts/lib/variants.ts`.

  Also: the Figma sync now reads `INSTANCE` nodes (not only `COMPONENT` / `COMPONENT_SET`),
  so hoggies that were republished as instances of a shared library component are picked up
  again; and a new guard fails the sync loudly if it would remove a published component
  export (a renamed or deleted hog), rather than shipping a silent breaking change.

  > While the package is pre-1.0 (`0.x`), these API changes are released as minor bumps.

## 0.6.0

### Minor Changes

- fdabe67: `Logo.Logomark` can now jump imperatively. Its `ref` is a new `LogomarkHandle` — call `ref.current.jump()` to trigger the jump from anywhere (a button, a timer, an event), no `jumpOnClick` / `autoJumpMs` required. Pass a magnitude (`jump(4)`) to jump higher, the same escalation successive clicks use; it returns `false` when the jump is suppressed (already airborne, no Web Animations API, or reduced motion).

  **Breaking:** the `Logo.Logomark` `ref` no longer points at the `<svg>` element directly — the node now lives on `ref.current.svg`. (`Logo` and `Logo.Wordmark` refs are unchanged.)

  ```tsx
  // before
  const ref = useRef<SVGSVGElement>(null)
  <Logo.Logomark ref={ref} />
  ref.current?.getBoundingClientRect()

  // after
  const ref = useRef<LogomarkHandle>(null)
  <Logo.Logomark ref={ref} />
  ref.current?.svg?.getBoundingClientRect()
  ref.current?.jump() // ...and now it can jump
  ```

## 0.5.0

### Minor Changes

- 20e8deb: feat: ship the RoundHog brand font

  Add PostHog's brand typeface, RoundHog, as bundled `woff2` faces under two new
  subpaths — `@posthog/brand/fonts` (face metadata + per-face URLs) and
  `@posthog/brand/fonts/css` (a ready-to-inject `@font-face` string). Eight faces
  ship (Regular / Medium / SemiBold / Bold × upright + italic); the woff2 files are
  emitted inside the package and their URLs are resolved via `import.meta.url`, so
  there's no CDN and no loader config. Raw files are also reachable at
  `@posthog/brand/fonts/*`.

## 0.4.0

### Minor Changes

- 3dbf5fa: `Logo.Logomark` gains a `holiday` prop to dress the hedgehog up for a season — `"christmas"` (a Santa hat, the same one the PostHog app wears in December) or `"halloween"` (a witch hat). The accessory rides the head, so it keeps its festive colors in every variant (including `mono`) and jumps along when the mark jumps. Nothing is date-driven — the consumer decides when it's the season.
- 58f3058: `Logo.Logomark` can now jump — the hedgehog springs up with the same staggered animation as the PostHog app (its 3 spikes and head take off one after the other). It's static by default; opt in with `jumpOnClick` (successive clicks escalate the height along the app's curve) and/or `autoJumpMs` for automatic jumps. Tune it with `jumpHeight` / `airtimeMs`; `prefers-reduced-motion` is respected. `Logo.Logomark` now renders as 4 animatable parts and forwards its `ref` to the `<svg>` like the rest of `Logo`.

## 0.3.0

### Minor Changes

- 54f1f05: Add searchable tags to assets. Each illustration's Figma component description (a
  comma-separated list, optionally behind a `Tags:` label) is now parsed during `sync` and
  carried on `AssetMeta.tags`. `findAssets` folds tags into its free-text search and gains a
  `tags` filter (match assets carrying all of the given tags, case-insensitive). Tag-only
  description edits are picked up on the next sync even when the rendered image is unchanged.
- 54f1f05: Make tag parsing tolerant of inconsistent Figma description separators. Tag lists are now
  split on slashes and periods in addition to commas and newlines, so descriptions like
  `hog/ solo` or `meme. black clothes` become separate tags instead of one. Splitting is
  intentionally greedy (a stray `Dr. Manhattan` yields `Dr`/`Manhattan`) since over-splitting
  only adds harmless extra tags, while under-splitting hides assets from search; hyphens and
  spaces are left intact (`hi-vis`, `lab coat`).

## 0.2.0

### Minor Changes

- 0e760b7: Sync brand assets from Figma (7 added).

  **hoggies**

  - Added 7: Doc Brown, Jack Dawson, Lemonade, Lifeguard, Scott Pilgrim, Survey, The Bride

## 0.1.0

### Minor Changes

- 75f3057: Sync brand assets from Figma (233 added).

  **hoggies**

  - Added 114: 70's Dance Hog, 9-9-6, Angel, Ape, Art Thief, Back To The Future, Ball Hog, Basketball Coach, Beaker, Boombox Hog, Business Evolution, Cake, Campfire Cowboy, Card Hog, Caveman, Cereal, Chart Hog, Chef, Code Bubble, Coding Group, Coffee Cup, Coffee Run, Construction 1, Construction 2, Cowboy Lasso, Croissant, Cursor Hog, Dadd AI Left, Dadd AI Right, Data Thief, Director, Dj, Doctor 2, Doctor Hog, Doll House, Dr. Manhattan, Drake Nah, Drake Yah, Driving Hogzilla, Dynamite, Einstein, Einstein Group, Evel, Experiment, Final Evolution, Float, Football Coach, Gardeners, Gladiator 1, Gladiator 2, Greek, Haha Bizzniss, Hand Clasp, Hipster Hog, Hogpatch, Hoot, Hourglass, I'm The Driver, Ipad, Judge, Lemon Wrangler 1, Lemon Wrangler 2, Lemon Wrangler 3, Magnifying Glass, Magnifying Glass 2, Megaphone, Money, Mountie, Mr Potato Head 1, Mr Potato Head 2, Noir Hog, Office Worker, Oprah, Panic, Party Hog, Pearl Necklace, Phone Call, Piñata Hog, Pope, Puzzle, Quick Call, Reading Is Magic, Remote Work, Reporter, Robo Hog, Rocket, Roller Coaster, Rose, Sailor Hog, Scientist, Scorpion, Shocked, Sitting, Soapbox, Soccer Coach, Speaker, Speaker Hog, Stamp Approved, Stamp Denied, Steve Jobs, Stop, Terminator, Town Crier, Traffic Controller, Traffic Police, Transformer, Trenchcoat, Waiter, Server, Will Smith, Wizard Blank, Wizard Hog, Wizard Hog, Workflows, X-ray

  **crests**

  - Added 119: Agents, Agents Mini, AI Gateway, AI Gateway Mini, AI Research, AI Research Mini, Analytics Platform, Analytics Platform Mini, Array, Array Mini, Batch Exports, Batch Exports Mini, Billing, Billing Mini, Blank Crest, Blank Crest Mini, Blitzscale, Blitzscale Mini, Book And Cursor, Book And Cursor Mini, Brand, Brand Mini, Buisness Sales, Buisness Sales Mini, Clickhouse, Clickhouse Mini, Client Libraries, Client Libraries Mini, Conversations, Customer Analytics, Customer Analytics Mini, Customer Success, Customer Success EU, Customer Success EU Mini, Customer Success Mini, Customer Success NA, Customer Success NA Mini, Data Modelling, Data Modelling Mini, Data Tools, Data Tools Mini, Data Warehouse, Data Warehouse Mini, Demand Gen, Demand Gen Mini, Dev Experience, Dev Experience Mini, Docs And Wizard, Docs And Wizard Mini, Error Tracking, Error Tracking Mini, Experiments, Experiments Mini, Feature Flags, Feature Flags Mini, Flags Platform, Flags Platform Mini, Forward Deployed Engineer, Forward Deployed Engineer Mini, Graphics, Graphics Mini, Growth Mini, Growth Plant, Infrastructure, Infrastructure Mini, Ingestion, Ingestion Mini, IRL Events, IRL Events Mini, Llm, Llm Mini, Logs, Marketing, Marketing Mini, Mobile, Mobile Mini, Onboarding, Onboarding Mini, Pencil, Pencil Mini, People And Ops, People And Ops Mini, Platform Features, Platform Features Mini, Platform UX, Platform UX Mini, Posthog Ai, Posthog Ai Mini, Posthog Code, Posthog Code Mini, Product Analytics, Product Analytics Mini, Product Lead Sales East, Product Lead Sales East Mini, Product Led Sales, Product Led Sales Mini, Query Performance, Query Performance, Query Performance Mini, Query Performance Mini, Security, Security Mini, Session Reply, Session Reply Mini, Signals, Support, Support Mini, Surveys, Surveys Mini, Talent, Talent Mini, Warehouse Sources, Warehouse Sources Mini, Warlock, Web Analytics, Web Analytics Mini, Workflows, Workflows Mini, Youtube

## 0.0.1

## Patch Changes

- Initial release
