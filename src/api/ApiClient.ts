import { APIRequestContext, request as playwrightRequest, BrowserContext } from '@playwright/test';
import { config } from '../utils/ConfigManager';

/**
 * DESIGN NOTE:
 * OrangeHRM's community edition does not expose a documented, token-based
 * public REST API. The Vue-based frontend talks to internal endpoints under
 * /web/index.php/api/v2/* using the same session cookie as the browser.
 *
 * Rather than fake an API layer against endpoints that don't really exist
 * for this app, this client re-uses the authenticated browser session's
 * cookies to hit those internal endpoints directly — a realistic and common
 * pattern for "API-level verification" against apps without a real public
 * API: you verify server-side persisted state without going back through
 * the UI, using whatever auth mechanism the app actually has.
 */
export class ApiClient {
  private constructor(private readonly context: APIRequestContext) {}

  static async fromBrowserContext(browserContext: BrowserContext): Promise<ApiClient> {
    const cookies = await browserContext.cookies();
    const context = await playwrightRequest.newContext({
      baseURL: config.baseUrl,
      extraHTTPHeaders: {
        Cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
      },
    });
    return new ApiClient(context);
  }

  get raw(): APIRequestContext {
    return this.context;
  }

  async dispose() {
    await this.context.dispose();
  }
}
