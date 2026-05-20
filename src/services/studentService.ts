import { api } from "../interceptors/authInterceptor";
import { Student } from "../models/Student";

const BASE = "/academic/students";

class StudentService {
  async getAll(): Promise<Student[]> {
    try {
      const res = await api.get<Student[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Student | null> {
    try {
      const res = await api.get<Student>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Student, 'id'>): Promise<Student | null> {
    try {
      const res = await api.post<Student>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Student>): Promise<Student | null> {
    try {
      const res = await api.put<Student>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async getByUserId(userId: string): Promise<Student | null> {
    try {
      const res = await api.get<Student[]>(`${BASE}/search`, { params: { user_id: userId } });
      return Array.isArray(res.data) ? (res.data[0] ?? null) : null;
    } catch { return null; }
  }
}

export const studentService = new StudentService();
