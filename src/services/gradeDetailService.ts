import { api } from "../interceptors/authInterceptor";
import { GradeDetail } from "../models/GradeDetail";

const BASE = "/evaluation/grade-details";

class GradeDetailService {
  async getAll(): Promise<GradeDetail[]> {
    try {
      const res = await api.get<GradeDetail[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<GradeDetail | null> {
    try {
      const res = await api.get<GradeDetail>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<GradeDetail, 'id'>): Promise<GradeDetail | null> {
    try {
      const res = await api.post<GradeDetail>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<GradeDetail>): Promise<GradeDetail | null> {
    try {
      const res = await api.put<GradeDetail>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }
}

export const gradeDetailService = new GradeDetailService();
