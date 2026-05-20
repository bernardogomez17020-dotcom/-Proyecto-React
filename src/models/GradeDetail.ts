import { Scale } from './Scale';
import { Student } from './Student';

export interface GradeDetail {
  id?: string;
  scale_id?: string;
  student_id?: string;
  score?: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  scale?: Scale;
  student?: Student;
}
