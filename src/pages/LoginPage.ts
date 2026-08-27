import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.getByPlaceholder('Username');
  private readonly passwordInput = this.page.getByPlaceholder('Password');
  private readonly loginButton = this.page.getByRole('button', { name: 'Login' });
  private readonly invalidCredsMessage = this.page.getByText('Invalid credentials');

  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto('/web/index.php/auth/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectInvalidCredentials() {
    await this.invalidCredsMessage.waitFor({ state: 'visible' });
  }

  async expectLoggedIn() {
    await this.page.waitForURL(/dashboard\/index/, { timeout: 15000 });
  }
}
