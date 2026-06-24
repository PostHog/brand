// The PostHog brand palette — hand-maintained, NOT synced from Figma.
//
// Colors are fixed brand tokens, so they live here as source rather than being
// re-extracted from the brand-book on every sync. `scripts/codegen.ts` reads this
// module to emit `src/generated/colors/{tokens,css}.ts`; edit a value here (and
// commit a changeset) to change the published palette.

import type { BrandColors } from "../src/types.ts"

export const colors: BrandColors = {
  blue: {
    name: "blue",
    core: "#1490E8",
    lighter: "#A1D3F7",
    darker: "#106FB2",
    gradient: ["#1490E8", "#106FB2"],
  },
  cobalt: {
    name: "cobalt",
    core: "#0457FF",
    lighter: "#99BBFF",
    darker: "#0045D1",
    gradient: ["#0457FF", "#0045D1"],
  },
  coral: {
    name: "coral",
    core: "#FF474D",
    lighter: "#FFB8BA",
    darker: "#F00008",
    gradient: ["#FF474D", "#F00008"],
  },
  "corn-blue": {
    name: "corn blue",
    core: "#2BB3DF",
    lighter: "#ABE1F2",
    darker: "#1A89AD",
    gradient: ["#2BB3DF", "#1A89AD"],
  },
  green: {
    name: "green",
    core: "#47C861",
    lighter: "#B8EAC2",
    darker: "#35B14E",
    gradient: ["#47C861", "#35B14E"],
  },
  lemon: {
    name: "lemon",
    core: "#FFCE1C",
    lighter: "#FFEBA3",
    darker: "#F0BC00",
    gradient: ["#FFCE1C", "#F0BC00"],
  },
  lime: {
    name: "lime",
    core: "#A0CA21",
    lighter: "#D8EE96",
    darker: "#8BAF1D",
    gradient: ["#A0CA21", "#8BAF1D"],
  },
  purple: {
    name: "purple",
    core: "#A737D2",
    lighter: "#DCB0ED",
    darker: "#8927AF",
    gradient: ["#A737D2", "#8927AF"],
  },
  tangerine: {
    name: "tangerine",
    core: "#FF5C1C",
    lighter: "#FFBDA3",
    darker: "#FF4800",
    gradient: ["#FF5C1C", "#FF4800"],
  },
  teal: {
    name: "teal",
    core: "#43DAB3",
    lighter: "#B2F0E0",
    darker: "#25BC95",
    gradient: ["#43DAB3", "#25BC95"],
  },
  violet: {
    name: "violet",
    core: "#6D4FFF",
    lighter: "#C4B8FF",
    darker: "#512EFF",
    gradient: ["#6D4FFF", "#512EFF"],
  },
  yellow: {
    name: "yellow",
    core: "#FFA81C",
    lighter: "#FFDCA3",
    darker: "#E58E00",
    gradient: ["#FFA81C", "#E58E00"],
  },
}

export default colors
