import { api } from "../interceptors/authInterceptor";
import { Scale } from "../models/Scale";

const BASE = "/evaluation/scales";

class ScaleService {
  async getAll(): Promise<Scale[]> {
    try {
      const res = await api.get<Scale[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Scale | null> {
    try {
      const res = await api.get<Scale>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Scale, 'id'>): Promise<Scale | null> {
    try {
      const res = await api.post<Scale>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Scale>): Promise<Scale | null> {
    try {
      const res = await api.put<Scale>(`${BASE}/${id}`, data);
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

export const scaleService = new ScaleService();
