import { api } from "../interceptors/authInterceptor";
import { Registration } from "../models/Registration";

const BASE = "/academic/registrations";

class RegistrationService {
  async getAll(): Promise<Registration[]> {
    try {
      const res = await api.get<Registration[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Registration | null> {
    try {
      const res = await api.get<Registration>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Registration, 'id'>): Promise<Registration | null> {
    try {
      const res = await api.post<Registration>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Registration>): Promise<Registration | null> {
    try {
      const res = await api.put<Registration>(`${BASE}/${id}`, data);
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

export const registrationService = new RegistrationService();
