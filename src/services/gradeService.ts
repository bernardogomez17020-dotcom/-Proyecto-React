import { api } from "../interceptors/authInterceptor";
import { Grade } from "../models/Grade";

const BASE = "/evaluation/grades";

export interface GradeStudentPayload {
  enrollment_id: string;
  evaluation_id?: string;
  rubric_id?: string;
  details: { scale_id: string; comment?: string }[];
  status?: 'DRAFT' | 'SENT';
  observations?: string;
}

class GradeService {
  async getAll(): Promise<Grade[]> {
    try {
      const res = await api.get<Grade[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Grade | null> {
    try {
      const res = await api.get<Grade>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Grade, 'id'>): Promise<Grade | null> {
    try {
      const res = await api.post<Grade>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Grade>): Promise<Grade | null> {
    try {
      const res = await api.put<Grade>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async gradeStudent(payload: GradeStudentPayload): Promise<Grade | null> {
    try {
      const res = await api.post<Grade>(BASE, payload);
      return res.data;
    } catch { return null; }
  }

  async registerFinalScores(groupId: string): Promise<{ enrollment_id: string; student_id: string; official_final_score: number; evaluations_count: number }[] | null> {
    try {
      const res = await api.post(`/evaluation/groups/${groupId}/register-final-scores`);
      return res.data;
    } catch { return null; }
  }
}

export const gradeService = new GradeService();
