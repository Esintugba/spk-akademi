export { accessRequestApi } from './access-requests.api'
export { authApi } from './auth.api'
export { resolveApiAssetUrl } from './assets'
export { adminBlogApi, blogApi } from './blog.api'
export { consentsApi } from './consents.api'
export { contactApi } from './contact.api'
export { coursesApi } from './courses.api'
export { dashboardApi } from './dashboard.api'
export { adminBadgesApi, gamificationApi } from './gamification.api'
export { goalsApi } from './goals.api'
export { importApi } from './import.api'
export { licensesApi, plansApi } from './licenses.api'
export { materialsApi } from './materials.api'
export { moderationApi } from './moderation.api'
export { onboardingApi } from './onboarding.api'
export { progressApi } from './progress.api'
export { publicContentApi } from './public-content.api'
export { questionsApi } from './questions.api'
export { quizzesApi, type QuizResultDetailParams, type WrongAnswerQueueParams } from './quizzes.api'
export { reviewApi } from './reviews.api'
export { sourceDocumentsApi } from './source-documents.api'
export { settingsApi } from './settings.api'
export { studentApi } from './student.api'
export { studyPlanApi } from './study-plan.api'
export { supportTicketsApi } from './support-tickets.api'
export { studyNotesApi } from './study-notes.api'
export { topicsApi } from './topics.api'
export { topicPreferencesApi } from './topic-preferences.api'
export { trialExamsApi } from './trial-exams.api'
export { userLicenseAccessesApi } from './user-license-accesses.api'
export { ApiRequestError, request } from './client'

import { accessRequestApi } from './access-requests.api'
import { authApi } from './auth.api'
import { adminBlogApi, blogApi } from './blog.api'
import { consentsApi } from './consents.api'
import { coursesApi } from './courses.api'
import { dashboardApi } from './dashboard.api'
import { adminBadgesApi, gamificationApi } from './gamification.api'
import { goalsApi } from './goals.api'
import { licensesApi, plansApi } from './licenses.api'
import { materialsApi } from './materials.api'
import { moderationApi } from './moderation.api'
import { progressApi } from './progress.api'
import { publicContentApi } from './public-content.api'
import { questionsApi } from './questions.api'
import { quizzesApi } from './quizzes.api'
import { sourceDocumentsApi } from './source-documents.api'
import { settingsApi } from './settings.api'
import { studentApi } from './student.api'
import { studyPlanApi } from './study-plan.api'
import { supportTicketsApi } from './support-tickets.api'
import { studyNotesApi } from './study-notes.api'
import { topicsApi } from './topics.api'
import { trialExamsApi } from './trial-exams.api'
import { userLicenseAccessesApi } from './user-license-accesses.api'

export const api = {
  register: authApi.register,
  login: authApi.login,
  forgotPassword: authApi.forgotPassword,
  resetPassword: authApi.resetPassword,
  getMyProfile: authApi.getMyProfile,
  updateMyProfile: authApi.updateMyProfile,
  changePassword: authApi.changePassword,
  logoutAllSessions: authApi.logoutAllSessions,

  getAdminDashboard: dashboardApi.getAdminDashboard,

  saveCookieConsent: consentsApi.saveCookie,
  saveKvkkConsent: consentsApi.saveKvkk,
  getConsentSummary: consentsApi.getAdminSummary,

  getLicenses: licensesApi.getAll,
  getLicenseCatalog: licensesApi.getCatalog,
  getLicenseCatalogBySlug: licensesApi.getCatalogBySlug,
  getLicense: licensesApi.getById,
  createLicense: licensesApi.create,
  updateLicense: licensesApi.update,
  deleteLicense: licensesApi.delete,
  getPlans: plansApi.getAll,
  getPlan: plansApi.getById,

  getCourses: coursesApi.getAll,
  getCourse: coursesApi.getById,
  createCourse: coursesApi.create,
  updateCourse: coursesApi.update,
  deleteCourse: coursesApi.delete,

  getTopics: topicsApi.getAll,
  getTopic: topicsApi.getById,
  createTopic: topicsApi.create,
  updateTopic: topicsApi.update,
  deleteTopic: topicsApi.delete,

  getStudyNotes: studyNotesApi.getAll,
  getPublicStudyNotes: studyNotesApi.getPublic,
  getStudyNote: studyNotesApi.getById,
  createStudyNote: studyNotesApi.create,
  updateStudyNote: studyNotesApi.update,
  deleteStudyNote: studyNotesApi.delete,

  getQuestions: questionsApi.getAll,
  getQuestionsByReviewStatus: questionsApi.getByReviewStatus,
  getQuestion: questionsApi.getById,
  createQuestion: questionsApi.create,
  updateQuestion: questionsApi.update,
  deleteQuestion: questionsApi.delete,
  getPastExamQuestions: questionsApi.getPastExamQuestions,
  getPastExamAnalytics: questionsApi.getPastExamAnalytics,

  getSourceDocuments: sourceDocumentsApi.getAll,
  uploadSourceDocument: sourceDocumentsApi.upload,
  replaceSourceDocumentFile: sourceDocumentsApi.replaceFile,
  extractSourceDocumentText: sourceDocumentsApi.extractText,
  getSourceDocumentText: sourceDocumentsApi.getText,
  downloadSourceDocument: sourceDocumentsApi.download,
  deleteSourceDocument: sourceDocumentsApi.delete,

  getTrialExams: trialExamsApi.getAll,
  getFreeTrialExams: trialExamsApi.getFree,
  getTrialExam: trialExamsApi.getById,
  createTrialExam: trialExamsApi.create,
  updateTrialExam: trialExamsApi.update,
  deleteTrialExam: trialExamsApi.delete,

  getModerationItems: moderationApi.getItems,
  getModerationHistory: moderationApi.getHistory,
  moderateContent: moderationApi.review,
  bulkModerateContent: moderationApi.bulkReview,

  getPublicQuestionBank: publicContentApi.getQuestionBank,
  startPublicMiniQuiz: publicContentApi.startMiniQuiz,
  submitPublicMiniQuiz: publicContentApi.submitMiniQuiz,
  getPublicExampleTrials: publicContentApi.getExampleTrials,
  getPublicSeo: publicContentApi.getSeo,

  getBlogPosts: blogApi.getPosts,
  searchBlogPosts: blogApi.searchPosts,
  getBlogPost: blogApi.getPost,
  getBlogCategories: blogApi.getCategories,
  getBlogTags: blogApi.getTags,
  getAdminBlogPosts: adminBlogApi.getPosts,
  getAdminBlogPost: adminBlogApi.getPost,
  createBlogPost: adminBlogApi.create,
  updateBlogPost: adminBlogApi.update,
  deleteBlogPost: adminBlogApi.delete,

  getMyLicenseAccesses: userLicenseAccessesApi.getMine,
  getUsers: userLicenseAccessesApi.getUsers,
  getUserLicenseAccesses: userLicenseAccessesApi.getAll,
  createUserLicenseAccess: userLicenseAccessesApi.create,
  updateUserLicenseAccess: userLicenseAccessesApi.update,
  deleteUserLicenseAccess: userLicenseAccessesApi.delete,

  getProgressOverview: progressApi.getOverview,
  getLicenseProgresses: progressApi.getLicenseProgresses,
  getCourseProgress: progressApi.getCourseProgress,
  getProgressStatistics: progressApi.getStatistics,

  getStudentProgram: studentApi.getProgram,
  getTopicStudyPage: studentApi.getTopicStudyPage,
  markTopicCompleted: studentApi.markTopicCompleted,
  getStudentAnalytics: studentApi.getAnalytics,
  getStudentTrialHistory: studentApi.getTrialHistory,
  getStudentTrialHistoryDetail: studentApi.getTrialHistoryDetail,
  getStudentActiveTrial: studentApi.getActiveTrial,
  getTodayStudyPlan: studyPlanApi.getToday,
  getWeeklyStudyPlan: studyPlanApi.getWeek,
  regenerateStudyPlan: studyPlanApi.regenerate,
  completeStudyPlanTask: studyPlanApi.completeTask,
  getStudyPlanRecommendations: studyPlanApi.getRecommendations,

  supportTickets: supportTicketsApi,
  settings: settingsApi,

  getGamificationProfile: gamificationApi.getProfile,
  claimDailyLogin: gamificationApi.claimDailyLogin,
  getGamificationBadges: gamificationApi.getBadges,
  getGamificationDailyGoals: gamificationApi.getDailyGoals,
  getGamificationLeaderboard: gamificationApi.getLeaderboard,
  getGamificationXpHistory: gamificationApi.getXpHistory,
  getAdminBadges: adminBadgesApi.getAll,
  createAdminBadge: adminBadgesApi.create,
  updateAdminBadge: adminBadgesApi.update,
  deleteAdminBadge: adminBadgesApi.delete,

  getGoals: goalsApi.getAll,
  createGoal: goalsApi.create,
  updateGoal: goalsApi.update,
  deleteGoal: goalsApi.delete,

  startQuiz: quizzesApi.start,
  getQuizAttempt: quizzesApi.getAttempt,
  startFreeTrialExam: quizzesApi.startFreeTrialExam,
  startLicensedTrial: (quizId: string) => quizzesApi.startLicensedTrial({ quizId }),
  getMyTrials: quizzesApi.getMyTrials,
  getStudentQuizzes: quizzesApi.getStudentQuizzes,
  getLicenseQuizzes: quizzesApi.getLicenseQuizzes,
  getQuizOverview: quizzesApi.getOverview,
  getFeaturedQuizzes: quizzesApi.getFeatured,
  getRecommendedQuizzes: quizzesApi.getRecommended,
  submitQuiz: quizzesApi.submit,
  getQuizResultDetail: quizzesApi.getResultDetail,
  startPastExamQuiz: quizzesApi.startPastExam,

  getMaterialViewerInfo: materialsApi.getViewerInfo,
  streamMaterialPdfUrl: materialsApi.streamPdfUrl,
  saveMaterialProgress: materialsApi.saveProgress,
  getMaterialBookmarks: materialsApi.getBookmarks,
  createMaterialBookmark: materialsApi.createBookmark,
  deleteMaterialBookmark: materialsApi.deleteBookmark,
  getMaterialNotes: materialsApi.getNotes,
  createMaterialNote: materialsApi.createNote,
  updateMaterialNote: materialsApi.updateNote,
  deleteMaterialNote: materialsApi.deleteNote,
  getReadingHistory: materialsApi.getReadingHistory,
  getReadingAnalytics: materialsApi.getReadingAnalytics,

  accessRequest: accessRequestApi,
}

export const coursePracticeApi = {
  getCourses: quizzesApi.getCoursePracticeCourses,
  startPractice: quizzesApi.startCoursePractice,
}

export const quizCatalogApi = {
  getStudentQuizzes: quizzesApi.getStudentQuizzes,
  getLicenseQuizzes: quizzesApi.getLicenseQuizzes,
  getOverview: quizzesApi.getOverview,
  getFeatured: quizzesApi.getFeatured,
  getRecommended: quizzesApi.getRecommended,
}

export const quizResultApi = quizzesApi

export const quizSessionApi = {
  getSession: quizzesApi.getSession,
  getActiveSessions: quizzesApi.getActiveSessions,
}

export const trialQuizApi = {
  getMyTrials: quizzesApi.getMyTrials,
  startLicensedTrial: quizzesApi.startLicensedTrial,
}

export const wrongAnswerApi = {
  getStats: quizzesApi.getWrongAnswerStats,
  getQueue: quizzesApi.getWrongAnswerQueue,
  startQuiz: quizzesApi.startWrongAnswersQuiz,
  removeFromQueue: quizzesApi.removeWrongAnswerFromQueue,
}
