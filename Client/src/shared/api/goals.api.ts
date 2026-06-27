import type { CreateUserGoalRequest, UpdateUserGoalRequest, UserGoal } from '../../models'
import { request } from './client'

export const goalsApi = {
  getAll: () => request.get<UserGoal[]>('/api/goals'),
  getById: (goalId: string) => request.get<UserGoal>(`/api/goals/${goalId}`),
  create: (payload: CreateUserGoalRequest) => request.post<UserGoal>('/api/goals', payload),
  update: (goalId: string, payload: UpdateUserGoalRequest) => request.put<UserGoal>(`/api/goals/${goalId}`, payload),
  delete: (goalId: string) => request.delete<void>(`/api/goals/${goalId}`),
}
