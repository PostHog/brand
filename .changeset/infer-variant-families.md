---
"@posthog/brand": minor
---

> ⚠️ **Breaking change**, but not major; we're still before v1.0.0.

Numbered hoggie families are now detected automatically, so every `-1`/`-2`/… set ships as one compound component with a `variant` prop instead of separate numbered exports.

Previously the families were a hand-maintained list, which the last Figma rename left stale — so `Doctor 1`/`Doctor 2`, `Noir 1`–`Noir 5` and friends were published as `HedgehogDoctor1`, `HedgehogDoctor2`, `HedgehogNoir1`… Grouping is now inferred from the slugs themselves and can't fall out of date.

```tsx
import { HedgehogDoctor } from "@posthog/brand/hoggies"

<HedgehogDoctor size={120} /> // defaults to variant "1"
<HedgehogDoctor variant="2" size={120} />
```

Newly grouped: **Dadd AI**, **Doctor**, **Gardener**, **Magnifying Glass**, **Noir** (1–5), **Speaker**, and **Wizard 5** (joining the existing `HedgehogWizard`, now 1–5). `HedgehogConstruction`, `HedgehogGladiator`, `HedgehogLemonWrangler`, `HedgehogMrPotatoHead` and `HedgehogSwimmer` are unchanged.

Each member keeps its own `…Svg` / `…Png` / metadata exports under the `<base>-<n>` slug (`hedgehogDoctor1Png`, `@posthog/brand/hoggies/svg/doctor-2`) — only the standalone React components are replaced by the compound one.

---

Below you can find the actual changes, even though they're not really 100% true given the changes above.

**hoggies**

- Added 27: 70's Dance, Ball, Boombox, Card, Chart, Cursor, Dadd-ai 1, Dadd-ai 2, Desk Wizard, Doctor 1, Gardener 1, Gardener 2, Hipster, Magnifying Glass 1, Noir 1, Noir 2, Noir 3, Noir 4, Noir 5, Party, Piñata, Robot, Sailor, Speaker 1, Speaker 2, Waiter, Wizard 5
- Removed 28: 70's Dance Hog, Ball Hog, Boombox Hog, Card Hog, Chart Hog, Cursor Hog, Dadd AI Left, Dadd AI Right, Doctor Hog, Gardeners, Heart, Hipster Hog, Magnifying Glass, Noir Hog 1, Noir Hog 2, Noir Hog 3, Noir Hog 4, Noir Hog 5, Party Hog, Piñata Hog, Robo Hog, Sailor Hog, Speaker, Speaker Hog, Waiter, Server, Wizard Blank, Wizard Hog, Wizard Hog
- Updated 114: 996, Angel, Ape, Art Thief, Back To The Future, Banana, Basketball Coach, Beaker, Business Evolution, Cake, Campfire Cowboy, Caribana, Caveman, Cereal, Chef, Coconut, Code Bubble, Coding Group, Coffee Cup, Coffee Run, Construction 1, Construction 2, Cowboy Lasso, Croissant, Data Thief, Director, Dj, Doc Brown, Doctor 2, Doll House, Dr. Manhattan, Drake Nah, Drake Yah, Driving Hogzilla, Dynamite, Einstein, Einstein Group, Evel, Experiment, Final Evolution, Float, Football Coach, Gladiator 1, Gladiator 2, Gravedigger, Greek, Haha Bizzniss, Hand Clasp, Hogpatch, Hoot, Hourglass, I'm The Driver, Ipad, Jack Dawson, Judge, Katy Perry, Lemon Wrangler 1, Lemon Wrangler 2, Lemon Wrangler 3, Lemonade, Lifeguard, Magnifying Glass 2, Megaphone, Money, Mountie, Mr Potato Head 1, Mr Potato Head 2, Office Worker, Oprah, Organized, Panic, Pearl Necklace, Phone Call, Pope, Puzzle, Quick Call, Reading, Reading Is Magic, Remote Work, Reporter, Research, Rocket, Roller Coaster, Rose, Scientist, Scorpion, Scott Pilgrim, Shocked, Sitting, Soapbox, Soccer Coach, Stamp Approved, Stamp Denied, Steve Jobs, Stop, Sunburn, Surfer, Survey, Swimmer 1, Swimmer 2, Terminator, The Bride, Town Crier, Traffic Controller, Traffic Police, Transformer, Trenchcoat, Will Smith, Wizard 1, Wizard 2, Wizard 3, Wizard 4, Workflows, X-ray

**crests**

- Removed 2: Query Performance, Query Performance Mini
- Updated 11: Graphics Mini, Infrastructure Mini, Logs, Query Performance, Query Performance Mini, Session Reply, Session Reply Mini, Surveys, Surveys Mini, Warehouse Sources, Workflows
