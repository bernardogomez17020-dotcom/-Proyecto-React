import { api } from "../interceptors/authInterceptor";
import { StudyPlan } from "../models/StudyPlan";
import { Subject } from "../models/Subject";

const BASE = "/academic/study-plans";

class StudyPlanService {
  async getAll(): Promise<StudyPlan[]> {
    try {
      const res = await api.get<StudyPlan[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<StudyPlan | null> {
    try {
      const res = await api.get<StudyPlan>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<StudyPlan, 'id'>): Promise<StudyPlan | null> {
    try {
      const res = await api.post<StudyPlan>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<StudyPlan>): Promise<StudyPlan | null> {
    try {
      const res = await api.put<StudyPlan>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async getSubjects(planId: string): Promise<Subject[]> {
    try {
      const res = await api.get<Subject[]>(`${BASE}/${planId}/subjects`);
      return res.data;
    } catch { return []; }
  }

  async addSubject(planId: string, subjectId: string): Promise<StudyPlan | null> {
    try {
      const res = await api.post<StudyPlan>(`${BASE}/${planId}/subjects/${subjectId}`);
      return res.data;
    } catch { return null; }
  }

  async removeSubject(planId: string, subjectId: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${planId}/subjects/${subjectId}`);
      return true;
    } catch { return false; }
  }
}

export const studyPlanService = new StudyPlanService();
