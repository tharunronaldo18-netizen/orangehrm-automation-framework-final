import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { DashboardPage } from '../../src/pages/DashboardPage';
import { EmployeeListPage } from '../../src/pages/EmployeeListPage';
import { AddEmployeePage } from '../../src/pages/AddEmployeePage';
import { PersonalDetailsPage } from '../../src/pages/PersonalDetailsPage';
import { ApiClient } from '../../src/api/ApiClient';
import { EmployeeApi } from '../../src/api/EmployeeApi';
import { config } from '../../src/utils/ConfigManager';

/**
 * Custom fixture that wires up every page object + an authenticated API
 * client for a test, and logs in once per test via the UI (kept as UI login
 * deliberately, since Part 1 explicitly scopes "Authentication" as something
 * to exercise end-to-end — not just bypassed with a stored storageState).
 */
type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  employeeListPage: EmployeeListPage;
  addEmployeePage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
  employeeApi: EmployeeApi;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
  addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
  personalDetailsPage: async ({ page }, use) => use(new PersonalDetailsPage(page)),

  authenticatedPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.open();
    await login.login(config.adminUsername, config.adminPassword);
    await login.expectLoggedIn();
    await use(page);
  },

  employeeApi: async ({ context, authenticatedPage }, use) => {
    const client = await ApiClient.fromBrowserContext(context);
    await use(new EmployeeApi(client));
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
