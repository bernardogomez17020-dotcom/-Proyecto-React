import { Enrollment } from './Enrollment';
import { Rubric } from './Rubric';
import { GradeDetail } from './GradeDetail';

export interface Grade {
  id?: string;
  enrollment_id?: string;
  evaluation_id?: string;
  rubric_id?: string;
  final_score?: number;
  status?: string;
  observations?: string;
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
  enrollment?: Enrollment;
  rubric?: Rubric;
  details?: GradeDetail[];
}
