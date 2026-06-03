export class User {

  id: number;
  email: string;
  full_name: string;
  department: string;
  is_admin: boolean;

  constructor(data: any) {

    this.id = data.id;
    this.email = data.email;
    this.full_name = data.full_name;
    this.department = data.department;
    this.is_admin = data.is_admin;

  }

}
