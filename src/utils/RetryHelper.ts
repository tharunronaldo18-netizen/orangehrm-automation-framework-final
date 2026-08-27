import { Logger } from './Logger';

/**
 * Generic retry-with-backoff wrapper for actions that are known to be
 * occasionally flaky for reasons outside the test's control (e.g. a
 * dashboard widget that lazy-loads, or a toast that needs a beat to render).
 *
 * This is intentionally NOT a substitute for Playwright's built-in
 * auto-waiting/locator retries — it's for higher-level "business actions"
 * that wrap multiple steps (e.g. "save and confirm toast appeared").
 */
export async function retry<T>(
  action: () => Promise<T>,
  options: { retries?: number; delayMs?: number; label?: string } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1000, label = 'action' } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      Logger.warn(`Retry ${attempt}/${retries} failed for "${label}"`, {
        error: (err as Error).message,
      });
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
