import { QuizMode } from '../../models/enums'
import { QuizAttemptStatus } from '../../models/quizSession'

export function quizModeLabel(mode: QuizMode) {
  switch (mode) {
    case QuizMode.FreeTrial:
      return 'Ücretsiz deneme'
    case QuizMode.LicensedQuiz:
    case QuizMode.TrialExam:
      return 'Lisanslı deneme'
    case QuizMode.CoursePractice:
      return 'Ders pratiği'
    case QuizMode.WrongAnswers:
      return 'Yanlışlarım'
    case QuizMode.ReviewSession:
      return 'Tekrar oturumu'
    case QuizMode.TopicPractice:
      return 'Konu pratiği'
    case QuizMode.MixedPractice:
      return 'Karma pratik'
    case QuizMode.MockExam:
      return 'Mock sınav'
    default:
      return 'Quiz'
  }
}

export function quizStatusLabel(status: QuizAttemptStatus) {
  switch (status) {
    case QuizAttemptStatus.InProgress:
    case QuizAttemptStatus.Started:
      return 'Devam ediyor'
    case QuizAttemptStatus.Completed:
      return 'Tamamlandı'
    case QuizAttemptStatus.Expired:
      return 'Süresi doldu'
    default:
      return 'Bekliyor'
  }
}

export function formatRemaining(seconds: number | null | undefined) {
  if (seconds == null) {
    return '—'
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
