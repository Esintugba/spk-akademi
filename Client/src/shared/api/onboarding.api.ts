import type { OnboardingStatus } from '../../models/onboarding'
import { request } from './client'

export const onboardingApi = {
  getStatus: () => request.get<OnboardingStatus>('/api/onboarding/status'),
  complete: (currentStep?: number) =>
    request.post<OnboardingStatus>('/api/onboarding/complete', { currentStep }),
}
