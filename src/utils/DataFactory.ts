import { Employee } from '../types/Employee';

/**
 * Generates unique, isolated test data per run so tests never collide with
 * leftover data from a previous run (a common source of "flaky" failures
 * that are actually just poor data isolation, not real flakiness).
 */
export class DataFactory {
  static uniqueSuffix(): string {
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  static buildEmployee(overrides: Partial<Employee> = {}): Employee {
    const suffix = this.uniqueSuffix();
    return {
      firstName: `QA_First_${suffix}`,
      lastName: `QA_Last_${suffix}`,
      employeeId: suffix.slice(-6),
      loginUsername: `qauser_${suffix}`,
      loginPassword: 'QaAutomation@123',
      ...overrides,
    };
  }
}
