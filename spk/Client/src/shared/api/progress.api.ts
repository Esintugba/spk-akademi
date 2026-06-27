import type { CourseProgress, LicenseProgress, ProgressOverview, ProgressStatistics } from '../../models'
import { request } from './client'

export const progressApi = {
  getOverview: () => request.get<ProgressOverview>('/api/progress/overview'),
  getLicenseProgresses: () => request.get<LicenseProgress[]>('/api/progress/licenses'),
  getCourseProgresses: () => request.get<CourseProgress[]>('/api/progress/courses'),
  getCourseProgress: (courseId: string) => request.get<CourseProgress>(`/api/progress/course/${courseId}`),
  getStatistics: () => request.get<ProgressStatistics>('/api/progress/statistics'),
}
