
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { assertTestDatabase } from "./tests/integration/test-database";

loadEnv({ path: ".env.e2e", override: true });
assertTestDatabase();

const baseURL = "http://127.0.0.1:3100";


export default defineConfig({
  testDir: "./tests/e2e",

  timeout: 90_000,

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command:
      "npx dotenv -e .env.e2e -- npx next dev --hostname 127.0.0.1 --port 3100",

    url: `${baseURL}/onboarding/login`,

    reuseExistingServer: true,

    timeout: 120_000,
  },
});
