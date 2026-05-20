import { api } from "../interceptors/authInterceptor";
import { Enrollment } from "../models/Enrollment";

const BASE = "/academic/enrollments";

class EnrollmentService {
  async getAll(): Promise<Enrollment[]> {
    try {
      const res = await api.get<Enrollment[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Enrollment | null> {
    try {
      const res = await api.get<Enrollment>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Enrollment, 'id'>): Promise<Enrollment | null> {
    try {
      const res = await api.post<Enrollment>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Enrollment>): Promise<Enrollment | null> {
    try {
      const res = await api.put<Enrollment>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async search(params: Record<string, string>): Promise<Enrollment[]> {
    try {
      const res = await api.get<Enrollment[]>(`${BASE}/search`, { params });
      return res.data;
    } catch { return []; }
  }
}

export const enrollmentService = new EnrollmentService();
