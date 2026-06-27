import { z } from 'zod'
import { QuestionDifficulty } from '../../models/enums'

export const coursePracticeSchema = z.object({
  courseId: z.string().min(1, 'Ders seçmelisin'),
  questionCount: z.number().min(5).max(100),
  difficultyEasy: z.boolean(),
  difficultyMedium: z.boolean(),
  difficultyHard: z.boolean(),
  topicIds: z.array(z.string()),
  includeWrongAnswered: z.boolean(),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
})

export type CoursePracticeFormValues = z.infer<typeof coursePracticeSchema>

export function toDifficultyLevels(values: CoursePracticeFormValues): QuestionDifficulty[] {
  const levels: QuestionDifficulty[] = []
  if (values.difficultyEasy) {
    levels.push(QuestionDifficulty.Easy)
  }
  if (values.difficultyMedium) {
    levels.push(QuestionDifficulty.Medium)
  }
  if (values.difficultyHard) {
    levels.push(QuestionDifficulty.Hard)
  }
  return levels
}
