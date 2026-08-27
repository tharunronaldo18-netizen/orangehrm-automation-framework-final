import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const BASE_URL = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';

/**
 * Employee creation is a write-heavy, authenticated internal-API call, so
 * this profile intentionally uses far fewer VUs than the login test — the
 * goal is to characterise write-path latency under light concurrent load,
 * not to hammer a shared demo DB with junk records.
 */
export const options = {
  scenarios: {
    employee_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 5 },
        { duration: '40s', target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.02'],
  },
};

function extractCsrfToken(html) {
  const match = html.match(/name="_token"\s+value="([^"]+)"/);
  return match ? match[1] : null;
}

function login() {
  const loginPageRes = http.get(`${BASE_URL}/web/index.php/auth/login`);
  const token = extractCsrfToken(loginPageRes.body);
  const res = http.post(
    `${BASE_URL}/web/index.php/auth/login`,
    {
      _token: token,
      username: __ENV.ADMIN_USERNAME || 'Admin',
      password: __ENV.ADMIN_PASSWORD || 'admin123',
    },
    { redirects: 0 }
  );
  return res.cookies;
}

export default function () {
  const cookies = login();
  const cookieHeader = Object.entries(cookies)
    .map(([name, arr]) => `${name}=${arr[0].value}`)
    .join('; ');

  const uniqueSuffix = `${__VU}${__ITER}${Date.now()}`;
  const payload = JSON.stringify({
    firstName: `K6First${uniqueSuffix}`,
    lastName: `K6Last${uniqueSuffix}`,
    employeeId: uniqueSuffix.slice(-6),
  });

  const res = http.post(`${BASE_URL}/web/index.php/api/v2/pim/employees`, payload, {
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  });

  check(res, {
    'employee created (2xx)': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'k6-results/employee-creation-report.html': htmlReport(data),
    stdout: JSON.stringify(data, null, 2),
  };
}
