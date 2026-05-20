import { Subject } from './Subject';
import { Rubric } from './Rubric';
import { Group } from './Group';

export interface Evaluation {
  id?: string;
  subject_id?: string;
  rubric_id?: string;
  group_id?: string;
  name?: string;
  description?: string;
  weight?: number;
  created_at?: string;
  updated_at?: string;
  subject?: Subject;
  rubric?: Rubric;
  group?: Group;
}
