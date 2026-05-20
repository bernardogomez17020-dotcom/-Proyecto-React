import { api } from "../interceptors/authInterceptor";
import { User } from "../models/User";

const BASE = "/users";

class UserService {
  async getAll(): Promise<User[]> {
    try {
      const res = await api.get<User[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<User | null> {
    try {
      const res = await api.get<User>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(user: Omit<User, 'id'>): Promise<User | null> {
    try {
      const res = await api.post<User>(BASE, user);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, user: Partial<User>): Promise<User | null> {
    try {
      const res = await api.put<User>(`${BASE}/${id}`, user);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async deactivate(id: string): Promise<boolean> {
    try {
      await api.patch(`${BASE}/${id}/deactivate`);
      return true;
    } catch { return false; }
  }

  async search(params: Record<string, string>): Promise<User[]> {
    try {
      const res = await api.get<User[]>(`${BASE}/search`, { params });
      return res.data;
    } catch { return []; }
  }
}

export const userService = new UserService();
