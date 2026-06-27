import { z } from 'zod'
import { ExamSession, ExamType, QuestionDifficulty } from '../../models'

export const pastExamsSchema = z.object({
  examTypes: z.array(z.nativeEnum(ExamType)),
  years: z.array(z.number().int().min(1990)),
  session: z.nativeEnum(ExamSession).nullable(),
  topicIds: z.array(z.string()),
  difficulty: z.nativeEnum(QuestionDifficulty).nullable(),
  search: z.string(),
  questionCount: z.number().min(5).max(100),
  mixedYears: z.boolean(),
  onlyPastExamQuestions: z.boolean(),
})

export type PastExamsFormValues = z.infer<typeof pastExamsSchema>

export const defaultPastExamsValues: PastExamsFormValues = {
  examTypes: [],
  years: [],
  session: null,
  topicIds: [],
  difficulty: null,
  search: '',
  questionCount: 50,
  mixedYears: true,
  onlyPastExamQuestions: true,
}

