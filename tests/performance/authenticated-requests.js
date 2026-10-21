
import http from "k6/http";
import { check, sleep, fail } from "k6";

const BASE_URL =
  __ENV.BASE_URL || "http://127.0.0.1:3100";

const TEST_EMAIL = __ENV.TEST_RESIDENT_EMAIL;
const TEST_PASSWORD = __ENV.TEST_RESIDENT_PASSWORD;

export const options = {
  vus: 5,
  duration: "30s",

  thresholds: {
    "http_req_duration{endpoint:resident_requests}": [
      "p(95)<2000",
    ],
    "http_req_failed{endpoint:resident_requests}": [
      "rate<0.01",
    ],
    "checks{endpoint:resident_requests}": [
      "rate>0.99",
    ],
  },
};

export function setup() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    fail("Test Resident credentials are required");
  }

  const csrfResponse = http.get(
    `${BASE_URL}/api/auth/csrf`
  );

  if (csrfResponse.status !== 200) {
    fail(`CSRF request failed: ${csrfResponse.status}`);
  }

  const csrfToken = csrfResponse.json("csrfToken");

  if (!csrfToken) {
    fail("NextAuth CSRF token is missing");
  }

  const loginResponse = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      csrfToken,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      callbackUrl: `${BASE_URL}/onboarding/login`,
      json: "true",
    },
    {
      redirects: 0,
    }
  );

  const cookies = loginResponse.cookies;

  const cookieName =
    cookies["next-auth.session-token"]
      ? "next-auth.session-token"
      : "__Secure-next-auth.session-token";

  const sessionCookie =
    cookies[cookieName]?.[0]?.value;

  if (!sessionCookie) {
    fail(
      `Login failed with HTTP ${loginResponse.status}`
    );
  }

  return {
    cookieName,
    sessionCookie,
  };
}

export default function (auth) {
  const response = http.get(
    `${BASE_URL}/api/user/requests?page=1&limit=10&view=ALL`,
    {
      headers: {
        Cookie:
          `${auth.cookieName}=${auth.sessionCookie}`,
      },
      tags: {
        endpoint: "resident_requests",
        name: "GET Resident Requests",
      },
    }
  );

  let validResponse = false;

  if (response.status === 200) {
    try {
      const body = response.json();

      validResponse =
        body.success === true &&
        Array.isArray(body.requests) &&
        body.requests.length > 0 &&
        typeof body.pagination?.total === "number";
    } catch {
      validResponse = false;
    }
  }

  check(
    response,
    {
      "PERF-04: Returns HTTP 200": (r) =>
        r.status === 200,

      "PERF-04: Valid resident requests": () =>
        validResponse,

      "PERF-04: Response below 2000ms": (r) =>
        r.timings.duration < 2000,
    },
    {
      endpoint: "resident_requests",
    }
  );

  sleep(1);
}
