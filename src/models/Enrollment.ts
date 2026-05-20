import { Student } from './Student';
import { Group } from './Group';

export interface Enrollment {
  id?: string;
  student_id?: string;
  group_id?: string;
  enrollment_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  student?: Student;
  group?: Group;
}
