import { Page, expect } from '@playwright/test';
import { config } from '../utils/ConfigManager';
import { Logger } from '../utils/Logger';

/**
 * Common behaviour every page object inherits: navigation, a smart-wait
 * helper on top of Playwright's own auto-waiting, and a standard way to
 * capture a screenshot manually at a point of interest (in addition to the
 * automatic on-failure screenshot configured globally).
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(`${config.baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Smart wait: polls for a condition instead of a hard sleep. Used for the
   * handful of cases where a locator being visible isn't enough evidence
   * that the app is actually ready (e.g. a table that renders a loading
   * skeleton before real rows land).
   */
  async waitForCondition(condition: () => Promise<boolean>, timeoutMs = config.defaultTimeout) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await condition()) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  async captureNamedScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/manual-captures/${name}.png`, fullPage: true });
    Logger.info(`Captured screenshot: ${name}`);
  }

  async expectToastMessage(text: string | RegExp) {
    const toast = this.page.locator('.oxd-toast');
    await expect(toast).toContainText(text, { timeout: config.defaultTimeout });
  }
}
