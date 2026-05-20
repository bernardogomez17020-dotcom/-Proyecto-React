import { api } from "../interceptors/authInterceptor";
import { Criterion } from "../models/Criterion";

const BASE = "/evaluation/criteria";

class CriterionService {
  async getAll(): Promise<Criterion[]> {
    try {
      const res = await api.get<Criterion[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Criterion | null> {
    try {
      const res = await api.get<Criterion>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Criterion, 'id'>): Promise<Criterion | null> {
    try {
      const res = await api.post<Criterion>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Criterion>): Promise<Criterion | null> {
    try {
      const res = await api.put<Criterion>(`${BASE}/${id}`, data);
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

export const criterionService = new CriterionService();
