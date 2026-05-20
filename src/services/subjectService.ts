import { api } from "../interceptors/authInterceptor";
import { Subject } from "../models/Subject";

const BASE = "/academic/subjects";

class SubjectService {
  async getAll(): Promise<Subject[]> {
    try {
      const res = await api.get<Subject[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Subject | null> {
    try {
      const res = await api.get<Subject>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Subject, 'id'>): Promise<Subject | null> {
    try {
      const res = await api.post<Subject>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Subject>): Promise<Subject | null> {
    try {
      const res = await api.put<Subject>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async archive(id: string): Promise<boolean> {
    try {
      await api.put(`${BASE}/${id}`, { is_active: false });
      return true;
    } catch { return false; }
  }
}

export const subjectService = new SubjectService();
