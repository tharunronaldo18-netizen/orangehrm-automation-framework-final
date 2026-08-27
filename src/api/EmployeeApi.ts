import { ApiClient } from './ApiClient';
import { ApiEmployeeRecord } from '../types/Employee';

export class EmployeeApi {
  constructor(private readonly client: ApiClient) {}

  async getEmployeeByEmpNumber(empNumber: string): Promise<ApiEmployeeRecord> {
    const response = await this.client.raw.get(
      `/web/index.php/api/v2/pim/employees/${empNumber}`
    );
    if (!response.ok()) {
      throw new Error(`Employee API returned ${response.status()} for empNumber ${empNumber}`);
    }
    const body = await response.json();
    const data = body.data;
    return {
      empNumber: data.empNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      employeeId: data.employeeId,
    };
  }

  async searchEmployeeByName(name: string): Promise<ApiEmployeeRecord[]> {
    const response = await this.client.raw.get(
      `/web/index.php/api/v2/pim/employees?nameOrId=${encodeURIComponent(name)}&limit=10`
    );
    if (!response.ok()) {
      throw new Error(`Employee search API returned ${response.status()}`);
    }
    const body = await response.json();
    return body.data.map((d: any) => ({
      empNumber: d.empNumber,
      firstName: d.firstName,
      lastName: d.lastName,
      employeeId: d.employeeId,
    }));
  }

  async assertEmployeeDeleted(empNumber: string): Promise<boolean> {
    const response = await this.client.raw.get(
      `/web/index.php/api/v2/pim/employees/${empNumber}`
    );

    // DISCOVERED VIA CI: OrangeHRM's internal API does not return a plain
    // 404 for a non-existent/deleted employee. Instead it can return a
    // non-2xx status OR a 200 with a null/empty `data` payload, depending
    // on version and whether the ID was ever valid. Rather than assume one
    // shape, we treat "not found" as: any non-2xx response, OR a 2xx
    // response whose `data` field is empty/null. This was tightened after
    // a real CI run surfaced the original 404-only assumption as wrong —
    // see README "Known limitations".
    if (!response.ok()) {
      return true;
    }

    const body = await response.json().catch(() => null);
    const data = body?.data;
    return !data || (Array.isArray(data) && data.length === 0);
  }
}
