import { api } from "../interceptors/authInterceptor";
import { Group } from "../models/Group";

const BASE = "/academic/groups";

class GroupService {
  async getAll(): Promise<Group[]> {
    try {
      const res = await api.get<Group[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Group | null> {
    try {
      const res = await api.get<Group>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Group, 'id'>): Promise<Group | null> {
    try {
      const res = await api.post<Group>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Group>): Promise<Group | null> {
    try {
      const res = await api.put<Group>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async assignTeacher(groupId: string, teacherId: string): Promise<boolean> {
    try {
      await api.patch(`${BASE}/${groupId}/assign-teacher/${teacherId}`);
      return true;
    } catch { return false; }
  }
}

export const groupService = new GroupService();
