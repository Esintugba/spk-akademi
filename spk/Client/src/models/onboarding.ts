export interface DemoAccess {
  id: string
  name: string
  expiresAt: string
  daysRemaining: number
  isExpired: boolean
}

export interface DemoLimits {
  maxQuestionsPerDay: number
  maxTrialAttempts: number
  readonlyAnalytics: boolean
  lockPremiumFeatures: boolean
  questionsUsedToday: number
  trialAttemptsUsed: number
}

export interface UserOnboardingState {
  hasSeenWelcome: boolean
  completedAt?: string | null
  currentStep: number
  isCompleted: boolean
}

export interface OnboardingStatus {
  hasActiveAccess: boolean
  hasDemoAccess: boolean
  hasFullAccess: boolean
  demoPlan?: DemoAccess | null
  showOnboarding: boolean
  onboardingCompleted: boolean
  supportEmail: string
  welcomeMessage: string
  demoLimits: DemoLimits
  onboardingState?: UserOnboardingState | null
}
