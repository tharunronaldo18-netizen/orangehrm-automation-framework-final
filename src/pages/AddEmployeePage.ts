import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Employee } from '../types/Employee';

export class AddEmployeePage extends BasePage {
  private readonly firstNameInput = this.page.getByPlaceholder('First Name');
  private readonly middleNameInput = this.page.getByPlaceholder('Middle Name');
  private readonly lastNameInput = this.page.getByPlaceholder('Last Name');
  private readonly employeeIdInput = this.page.locator('.oxd-input-group').filter({ hasText: 'Employee Id' }).locator('input');
  private readonly createLoginDetailsToggle = this.page
    .locator('.oxd-form-row')
    .filter({ hasText: 'Create Login Details' })
    .locator('.oxd-switch-input');
  private readonly usernameInput = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.locator('label', { hasText: /^Username$/ }) })
    .locator('input');
  private readonly passwordInput = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.locator('label', { hasText: /^Password$/ }) })
    .locator('input');
  private readonly confirmPasswordInput = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.locator('label', { hasText: /^Confirm Password$/ }) })
    .locator('input');
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });

  constructor(page: Page) {
    super(page);
  }

  async fillBasicDetails(employee: Employee) {
    await this.firstNameInput.fill(employee.firstName);
    if (employee.middleName) await this.middleNameInput.fill(employee.middleName);
    await this.lastNameInput.fill(employee.lastName);
  }

  async setEmployeeId(employeeId: string) {
    await this.employeeIdInput.fill('');
    await this.employeeIdInput.fill(employeeId);
  }

  async createLoginCredentials(employee: Employee) {
    if (!employee.loginUsername || !employee.loginPassword) return;
    await this.createLoginDetailsToggle.click();
    // The username/password fields only render after the toggle's reveal
    // animation completes — wait for them explicitly rather than assuming
    // the click was instantly followed by a re-rendered form.
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(employee.loginUsername);
    await this.passwordInput.fill(employee.loginPassword);
    await this.confirmPasswordInput.fill(employee.loginPassword);
  }

  async save() {
    await this.saveButton.click();
    // Successful save redirects to the Personal Details page for the new employee.
    await this.page.waitForURL(/viewPersonalDetails\/empNumber\/\d+/, { timeout: 15000 });
  }

  async getCreatedEmployeeNumber(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/empNumber\/(\d+)/);
    if (!match) throw new Error(`Could not extract empNumber from URL: ${url}`);
    return match[1];
  }
}
