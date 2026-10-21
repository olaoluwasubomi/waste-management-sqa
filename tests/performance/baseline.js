
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",

  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3100";

export default function () {
  const response = http.get(`${BASE_URL}/onboarding/login`, {
    tags: { name: "GET Login Page" },
  });

  check(response, {
    "PERF-01: Login page returns HTTP 200": (r) => r.status === 200,
    "PERF-01: Response time below 2000ms": (r) =>
      r.timings.duration < 2000,
  });

  sleep(1);
}
