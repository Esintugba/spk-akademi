import type { UpdateUserSettings, UserSecuritySettings, UserSettings } from '../../models'
import { request } from './client'

export const settingsApi = {
  get: () => request.get<UserSettings>('/api/settings'),
  update: (payload: UpdateUserSettings) => request.put<UserSettings>('/api/settings', payload),
  updatePreferences: (payload: UpdateUserSettings) => request.put<UserSettings>('/api/settings/preferences', payload),
  getSecurity: () => request.get<UserSecuritySettings>('/api/settings/security'),
}
