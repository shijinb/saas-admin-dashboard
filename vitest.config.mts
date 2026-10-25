import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws when imported outside a React Server Component; unit tests import server modules directly.
      "server-only": fileURLToPath(new URL("./tests/unit/empty.ts", import.meta.url)),
    },
  },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
