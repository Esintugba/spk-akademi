import { QuestionDifficulty, type QuizCatalogItem, type StudentQuizProgress } from '../../models/quizCatalog'

export function difficultyLabel(value: QuestionDifficulty) {
  switch (value) {
    case QuestionDifficulty.Easy:
      return 'Kolay'
    case QuestionDifficulty.Hard:
      return 'Zor'
    default:
      return 'Orta'
  }
}

export function durationLabel(seconds: number) {
  return `${Math.max(1, Math.round(seconds / 60))} dk`
}

export function progressLabel(progress: StudentQuizProgress) {
  if (progress.completed) {
    return 'Tamamlandı'
  }

  if (progress.inProgress) {
    return 'Devam Ediyor'
  }

  return 'Başlamadı'
}

export function quizCtaLabel(quiz: QuizCatalogItem) {
  if (quiz.userProgress.completed) {
    return 'Sonuçları Gör'
  }

  if (quiz.userProgress.inProgress) {
    return 'Devam Et'
  }

  return 'Denemeyi Başlat'
}
