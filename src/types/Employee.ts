export interface Employee {
  firstName: string;
  middleName?: string;
  lastName: string;
  employeeId: string;
  loginUsername?: string;
  loginPassword?: string;
}

export interface EmployeeUpdate {
  driverLicenseNumber?: string;
  nationality?: string;
  maritalStatus?: string;
}

export interface ApiEmployeeRecord {
  empNumber: number;
  firstName: string;
  lastName: string;
  employeeId: string;
}
