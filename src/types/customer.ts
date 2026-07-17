export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  lockoutEnd?: string | null;
}
