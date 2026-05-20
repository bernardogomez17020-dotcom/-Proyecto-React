export interface User {
  id?: string;
  email?: string;
  password?: string;
  code?: string;
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
