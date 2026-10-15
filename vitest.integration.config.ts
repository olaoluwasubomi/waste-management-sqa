import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    clearMocks: true,
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});