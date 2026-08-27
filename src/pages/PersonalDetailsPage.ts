import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EmployeeUpdate } from '../types/Employee';

export class PersonalDetailsPage extends BasePage {
  private readonly driverLicenseInput = this.page
    .locator('.oxd-input-group')
    .filter({ hasText: /Driver's License Number/ })
    .locator('input');
  private readonly nationalityDropdown = this.page.locator('.oxd-input-group').filter({ hasText: 'Nationality' }).locator('.oxd-select-text');
  private readonly maritalStatusDropdown = this.page.locator('.oxd-input-group').filter({ hasText: 'Marital Status' }).locator('.oxd-select-text');
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });

  constructor(page: Page) {
    super(page);
  }

  async openFor(empNumber: string) {
    await this.goto(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`);
  }

  async updateDetails(update: EmployeeUpdate) {
    if (update.driverLicenseNumber) {
      await this.driverLicenseInput.fill(update.driverLicenseNumber);
    }
    if (update.nationality) {
      await this.nationalityDropdown.click();
      await this.page.getByRole('option', { name: update.nationality }).click();
    }
    if (update.maritalStatus) {
      await this.maritalStatusDropdown.click();
      await this.page.getByRole('option', { name: update.maritalStatus }).click();
    }
    await this.saveButton.click();
    await this.expectToastMessage('Successfully Updated');
  }

  async getFullNameHeading(): Promise<string> {
    return (await this.page.locator('.orangehrm-edit-employee-name h6, .employee-name').first().textContent())?.trim() ?? '';
  }
}
