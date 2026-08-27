import { test, expect } from '../fixtures/test-base';
import { DataFactory } from '../../src/utils/DataFactory';

/**
 * @api-only specs hit the internal API directly for fast, UI-independent
 * verification. These are cheap to run frequently (no browser rendering
 * cost beyond the one login needed to obtain a session) and are the first
 * thing to check when an E2E test fails — they isolate whether the problem
 * is in the backend/data layer or in the UI layer.
 */
test.describe('Employee API @api-only @regression', () => {
  test('search returns previously created employee by name @smoke', async ({
    dashboardPage,
    employeeListPage,
    addEmployeePage,
    employeeApi,
  }) => {
    const employee = DataFactory.buildEmployee();

    await dashboardPage.navigateTo('PIM');
    await employeeListPage.clickAdd();
    await addEmployeePage.fillBasicDetails(employee);
    await addEmployeePage.setEmployeeId(employee.employeeId);
    await addEmployeePage.save();

    const results = await employeeApi.searchEmployeeByName(employee.firstName);
    const match = results.find((r) => r.employeeId === employee.employeeId);

    expect(match).toBeDefined();
    expect(match?.lastName).toBe(employee.lastName);
  });

  test('fetching a non-existent employee returns 404', async ({ employeeApi }) => {
    const deleted = await employeeApi.assertEmployeeDeleted('99999999');
    expect(deleted).toBe(true);
  });
});
