import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://178.105.35.119:3001";
const PASSWORD = "Test1234!";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const email = `user_${__VU}_${__ITER}@test.com`;

  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({ email, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(registerRes, {
    "register status 201": (r) => r.status === 201,
    "register has id": (r) => {
      try {
        const body = r.json();
        return typeof body.id === "string" && body.id.length > 0;
      } catch {
        return false;
      }
    },
  });

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } },
  );
  let accessToken = "";
  check(loginRes, {
    "login status 200": (r) => r.status === 200,
    "login has accessToken": (r) => {
      try {
        const body = r.json();
        if (typeof body.accessToken !== "string" || body.accessToken.length === 0) {
          return false;
        }
        accessToken = body.accessToken;
        return true;
      } catch {
        return false;
      }
    },
  });

  if (!accessToken) {
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const createPayload = JSON.stringify({
    company: "Stress Corp",
    position: "Engineer",
    location: "Remote",
    status: "APPLIED",
  });
  const createRes = http.post(`${BASE_URL}/api/applications`, createPayload, {
    headers: authHeaders,
  });
  check(createRes, {
    "create application status 201": (r) => r.status === 201,
    "create application has id": (r) => {
      try {
        const body = r.json();
        return typeof body.id === "string" && body.id.length > 0;
      } catch {
        return false;
      }
    },
  });

  const listRes = http.get(`${BASE_URL}/api/applications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  check(listRes, {
    "list applications status 200": (r) => r.status === 200,
    "list applications has items": (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.items);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
