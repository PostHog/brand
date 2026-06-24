import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Components are rendered with react-dom/server (no DOM needed); only the
    // few tests that touch the browser opt into jsdom via a per-file pragma.
  },
})
