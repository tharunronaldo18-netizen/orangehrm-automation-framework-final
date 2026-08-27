import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  private readonly userDropdown = this.page.locator('.oxd-userdropdown-tab');
  private readonly logoutLink = this.page.getByRole('menuitem', { name: 'Logout' });
  private readonly sidebarItem = (name: string) =>
    this.page.locator('.oxd-main-menu-item').filter({ hasText: name });

  constructor(page: Page) {
    super(page);
  }

  async navigateTo(module: 'Admin' | 'PIM' | 'Leave' | 'Time' | 'Recruitment' | 'My Info' | 'Performance') {
    await this.sidebarItem(module).click();
  }

  async logout() {
    await this.userDropdown.click();
    await this.logoutLink.click();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.getByText('Dashboard').first().isVisible();
  }
}
