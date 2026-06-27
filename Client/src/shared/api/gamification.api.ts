import type {
  Badge,
  DailyGoal,
  GamificationProfile,
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
  UpsertBadge,
  UserBadge,
  XpHistoryResponse,
} from '../../models'
import { announceLevelUp } from '../../features/gamification/announceGamification'
import { request } from './client'

export const gamificationApi = {
  getProfile: async () => {
    const profile = await request.get<GamificationProfile>('/api/gamification/profile')
    announceLevelUp(profile)
    return profile
  },
  claimDailyLogin: async () => {
    const profile = await request.post<GamificationProfile>('/api/gamification/daily-login')
    announceLevelUp(profile)
    return profile
  },
  getBadges: () => request.get<UserBadge[]>('/api/gamification/badges'),
  getDailyGoals: () => request.get<DailyGoal[]>('/api/gamification/daily-goals'),
  getLeaderboard: (params?: { period?: LeaderboardPeriod; metric?: LeaderboardMetric; top?: number }) =>
    request.get<LeaderboardEntry[]>('/api/gamification/leaderboard', { params }),
  getXpHistory: (params?: { page?: number; pageSize?: number }) =>
    request.get<XpHistoryResponse>('/api/gamification/xp-history', { params }),
}

export const adminBadgesApi = {
  getAll: () => request.get<Badge[]>('/api/admin/badges'),
  create: (payload: UpsertBadge) => request.post<Badge>('/api/admin/badges', payload),
  update: (id: string, payload: UpsertBadge) => request.put<Badge>(`/api/admin/badges/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/admin/badges/${id}`),
}
