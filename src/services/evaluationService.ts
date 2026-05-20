import { api } from "../interceptors/authInterceptor";
import { Evaluation } from "../models/Evaluation";

const BASE = "/evaluation/evaluations";

class EvaluationService {
  async getAll(): Promise<Evaluation[]> {
    try {
      const res = await api.get<Evaluation[]>(BASE);
      return res.data;
    } catch { return []; }
  }

  async getById(id: string): Promise<Evaluation | null> {
    try {
      const res = await api.get<Evaluation>(`${BASE}/${id}`);
      return res.data;
    } catch { return null; }
  }

  async create(data: Omit<Evaluation, 'id'>): Promise<Evaluation | null> {
    try {
      const res = await api.post<Evaluation>(BASE, data);
      return res.data;
    } catch { return null; }
  }

  async update(id: string, data: Partial<Evaluation>): Promise<Evaluation | null> {
    try {
      const res = await api.put<Evaluation>(`${BASE}/${id}`, data);
      return res.data;
    } catch { return null; }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`${BASE}/${id}`);
      return true;
    } catch { return false; }
  }

  async associateRubric(evaluationId: string, rubricId: string): Promise<boolean> {
    try {
      await api.patch(`${BASE}/${evaluationId}/associate-rubric/${rubricId}`);
      return true;
    } catch { return false; }
  }
}

export const evaluationService = new EvaluationService();
