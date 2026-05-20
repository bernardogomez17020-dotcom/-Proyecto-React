import { api } from "../interceptors/authInterceptor";
import { Rubric } from "../models/Rubric";

const BASE = "/evaluation/rubrics";

class RubricService {
  async getAll(): Promise<Rubric[]> {
    try {
      const res = await api.get<Rubric[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Rubric | null> {
    try {
      const res = await api.get<Rubric>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Rubric, 'id'>): Promise<Rubric | null> {
    try {
      const res = await api.post<Rubric>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Rubric>): Promise<Rubric | null> {
    try {
      const res = await api.put<Rubric>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async publish(id: string): Promise<boolean> {
    try {
      await api.patch(`${BASE}/${id}/publish`);
      return true;
    } catch { return false; }
  }

  async archive(id: string): Promise<boolean> {
    try {
      await api.put(`${BASE}/${id}`, { is_archived: true });
      return true;
    } catch { return false; }
  }
}

export const rubricService = new RubricService();
