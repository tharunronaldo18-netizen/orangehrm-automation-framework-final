import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

const BASE_URL = __ENV.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
const loginDuration = new Trend('login_duration', true);

/**
 * OrangeHRM's login form is CSRF-protected: the form page embeds a
 * per-session token that must be echoed back in the POST body/cookie.
 * We scrape it fresh on every VU iteration to avoid stale-token failures
 * masquerading as performance issues.
 */
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    login_duration: ['p(95)<1000'],
  },
};

function extractCsrfToken(html) {
  const match = html.match(/name="_token"\s+value="([^"]+)"/);
  return match ? match[1] : null;
}

export default function () {
  const loginPageRes = http.get(`${BASE_URL}/web/index.php/auth/login`);
  const token = extractCsrfToken(loginPageRes.body);

  check(loginPageRes, {
    'login page loaded': (r) => r.status === 200,
    'csrf token present': () => token !== null,
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/web/index.php/auth/login`,
    {
      _token: token,
      username: __ENV.ADMIN_USERNAME || 'Admin',
      password: __ENV.ADMIN_PASSWORD || 'admin123',
    },
    { redirects: 0 }
  );
  loginDuration.add(Date.now() - start);

  check(res, {
    'login redirects on success': (r) => r.status === 302,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'k6-results/login-report.html': htmlReport(data),
    stdout: JSON.stringify(data, null, 2),
  };
}
