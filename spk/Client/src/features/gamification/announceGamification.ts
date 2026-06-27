import type { GamificationProfile, UnlockedBadge } from '../../models'
import { useGamificationStore } from '../../stores/gamificationStore'

const lastKnownLevels = new Map<string, number>()
const announcedLevels = new Set<string>()

export function announceUnlockedBadges(unlockedBadges?: UnlockedBadge[] | null) {
  if (!unlockedBadges?.length) {
    return
  }

  const { enqueueNotice } = useGamificationStore.getState()
  unlockedBadges.forEach((badge) => {
    enqueueNotice({
      id: `badge-${badge.badgeId}-${badge.unlockedAt}`,
      type: 'badge',
      title: badge.name,
      description: badge.description,
    })
  })
}

export function announceLevelUp(profile: GamificationProfile, previousLevel?: number | null) {
  const resolvedPreviousLevel = previousLevel ?? lastKnownLevels.get(profile.userId)
  lastKnownLevels.set(profile.userId, profile.level)

  if (!resolvedPreviousLevel || profile.level <= resolvedPreviousLevel) {
    return
  }

  const noticeKey = `${profile.userId}:${profile.level}`
  if (announcedLevels.has(noticeKey)) {
    return
  }

  announcedLevels.add(noticeKey)
  useGamificationStore.getState().enqueueNotice({
    id: `level-${profile.userId}-${profile.level}`,
    type: 'level',
    title: `Seviye ${profile.level} oldun`,
    description: `${profile.totalXp} toplam XP ile yeni seviyeye geçtin.`,
  })
}
