import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EmployeeListPage extends BasePage {
  private readonly employeeNameInput = this.page.getByPlaceholder('Type for hints...').first();
  private readonly searchButton = this.page.getByRole('button', { name: 'Search' });
  private readonly addButton = this.page.getByRole('button', { name: 'Add' });
  private readonly firstResultRow = this.page.locator('.oxd-table-card').first();
  private readonly deleteIcon = this.page.locator('.oxd-table-card .bi-trash, .oxd-icon.bi-trash').first();
  private readonly confirmDeleteButton = this.page.getByRole('button', { name: 'Yes, Delete' });
  private readonly recordsFoundText = this.page.getByText(/Records Found/);

  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto('/web/index.php/pim/viewEmployeeList');
  }

  async searchByName(name: string) {
    await this.employeeNameInput.fill(name);
    await this.page.getByText(name).first().click().catch(() => {
      // Autocomplete suggestion may not always render for freshly created
      // records under load; falling back to plain search is fine here.
    });
    await this.searchButton.click();
    await this.recordsFoundText.waitFor({ state: 'visible' });
  }

  async clickAdd() {
    await this.addButton.click();
  }

  async openFirstResult() {
    await this.firstResultRow.click();
  }

  async deleteFirstResult() {
    await this.deleteIcon.click();
    await this.confirmDeleteButton.click();
    await this.expectToastMessage('Successfully Deleted');
  }
}
