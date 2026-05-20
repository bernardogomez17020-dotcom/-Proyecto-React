import { api } from "../interceptors/authInterceptor";
import { Teacher } from "../models/Teacher";

const BASE = "/academic/teachers";

class TeacherService {
  async getAll(): Promise<Teacher[]> {
    try {
      const res = await api.get<Teacher[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Teacher | null> {
    try {
      const res = await api.get<Teacher>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Teacher, 'id'>): Promise<Teacher | null> {
    try {
      const res = await api.post<Teacher>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Teacher>): Promise<Teacher | null> {
    try {
      const res = await api.put<Teacher>(`${BASE}/${id}`, data);
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

export const teacherService = new TeacherService();
