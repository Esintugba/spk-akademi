import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import type { CreateUserGoalRequest, UpdateUserGoalRequest } from '../../../models'
import { goalsApi } from '../../../shared/api'

export const goalQueryKeys = {
  all: ['goals'] as const,
}

export function useGoals() {
  return useQuery({
    queryKey: goalQueryKeys.all,
    queryFn: goalsApi.getAll,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserGoalRequest) => goalsApi.create(payload),
    onSuccess: () => {
      toast.success('Hedef oluşturuldu.')
      void queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ goalId, payload }: { goalId: string; payload: UpdateUserGoalRequest }) =>
      goalsApi.update(goalId, payload),
    onSuccess: () => {
      toast.success('Hedef güncellendi.')
      void queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (goalId: string) => goalsApi.delete(goalId),
    onSuccess: () => {
      toast.success('Hedef silindi.')
      void queryClient.invalidateQueries({ queryKey: goalQueryKeys.all })
    },
  })
}
