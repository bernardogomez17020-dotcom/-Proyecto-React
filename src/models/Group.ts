import { Teacher } from './Teacher';
import { Subject } from './Subject';
import { Semester } from './Semester';

export interface Group {
  id?: string;
  teacher_id?: string;
  subject_id?: string;
  semester_id?: string;
  name?: string;
  group_code?: string;
  capacity?: number;
  created_at?: string;
  updated_at?: string;
  teacher?: Teacher;
  subject?: Subject;
  semester?: Semester;
}
