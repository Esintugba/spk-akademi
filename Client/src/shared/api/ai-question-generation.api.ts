import type {
  AiQuestionDraft,
  AiQuestionGenerationJob,
  CreateAiQuestionGenerationJob,
  UpdateAiQuestionDraft,
} from '../../models'
import { request } from './client'

export const aiQuestionGenerationApi = {
  createJob: (payload: CreateAiQuestionGenerationJob) =>
    request.post<AiQuestionGenerationJob>('/api/admin/ai-question-generation/jobs', payload),
  getJob: (jobId: string) =>
    request.get<AiQuestionGenerationJob>(`/api/admin/ai-question-generation/jobs/${jobId}`),
  getJobs: (take = 20) =>
    request.get<AiQuestionGenerationJob[]>('/api/admin/ai-question-generation/jobs', { params: { take } }),
  getDrafts: (jobId: string) =>
    request.get<AiQuestionDraft[]>(`/api/admin/ai-question-generation/jobs/${jobId}/drafts`),
  updateDraft: (draftId: string, payload: UpdateAiQuestionDraft) =>
    request.put<AiQuestionDraft>(`/api/admin/ai-question-generation/drafts/${draftId}`, payload),
  publishDrafts: (jobId: string, draftIds: string[]) =>
    request.post<{ publishedCount: number }>(
      `/api/admin/ai-question-generation/jobs/${jobId}/publish`,
      { draftIds },
    ),
}
