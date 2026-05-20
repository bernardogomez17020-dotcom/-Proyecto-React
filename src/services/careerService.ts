import { api } from "../interceptors/authInterceptor";
import { Career } from "../models/Career";

const BASE = "/academic/careers";

class CareerService {
  async getAll(): Promise<Career[]> {
    try {
      const res = await api.get<Career[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Career | null> {
    try {
      const res = await api.get<Career>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Career, 'id'>): Promise<Career | null> {
    try {
      const res = await api.post<Career>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Career>): Promise<Career | null> {
    try {
      const res = await api.put<Career>(`${BASE}/${id}`, data);
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

export const careerService = new CareerService();
