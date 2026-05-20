import { api } from "../interceptors/authInterceptor";
import { Semester } from "../models/Semester";

const BASE = "/academic/semesters";

class SemesterService {
  async getAll(): Promise<Semester[]> {
    try {
      const res = await api.get<Semester[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Semester | null> {
    try {
      const res = await api.get<Semester>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Semester, 'id'>): Promise<Semester | null> {
    try {
      const res = await api.post<Semester>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Semester>): Promise<Semester | null> {
    try {
      const res = await api.put<Semester>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async activate(id: string): Promise<boolean> {
    try {
      await api.put(`${BASE}/${id}`, { is_active: true });
      return true;
    } catch { return false; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }
}

export const semesterService = new SemesterService();
