/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { Alert, CircularProgress, Box } from '@mui/material'
import App from '../App'
import { MarketingLayout } from '../components/layout/MarketingLayout'
import { AdminRoute } from './AdminRoute'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { StudentLayout } from '../components/layout/StudentLayout'
import { AppBrandingShell } from '../shared/branding/AppBrandingShell'
import { StudentOnboardingGuard } from './StudentOnboardingGuard'
import {
  useAdminCatalogInvalidation,
  useCourses,
  useLicenses,
  useQuestions,
  useSourceDocuments,
  useStudyNotes,
  useTopics,
  useTrialExams,
} from '../shared/hooks'

const AboutPage = lazy(() => import('../components/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const AdminBadgesPage = lazy(() => import('../components/pages/AdminBadgesPage').then((m) => ({ default: m.AdminBadgesPage })))
const AdminBlogPage = lazy(() => import('../components/pages/AdminBlogPage').then((m) => ({ default: m.AdminBlogPage })))
const AdminConsentsPage = lazy(() => import('../components/pages/AdminConsentsPage').then((m) => ({ default: m.AdminConsentsPage })))
const BlogDetailPage = lazy(() => import('../components/pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })))
const BlogPage = lazy(() => import('../components/pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const ContactPage = lazy(() => import('../components/pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const CoursesPage = lazy(() => import('../components/pages/CoursesPage').then((m) => ({ default: m.CoursesPage })))
const DashboardPage = lazy(() => import('../components/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const FaqPage = lazy(() => import('../components/pages/FaqPage').then((m) => ({ default: m.FaqPage })))
const FeaturesPage = lazy(() => import('../components/pages/FeaturesPage').then((m) => ({ default: m.FeaturesPage })))
const ForgotPasswordPage = lazy(() => import('../components/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const FreeTrialPage = lazy(() => import('../components/pages/FreeTrialPage').then((m) => ({ default: m.FreeTrialPage })))
const LandingPage = lazy(() => import('../components/pages/LandingPage').then((m) => ({ default: m.LandingPage })))
const LegalPage = lazy(() => import('../components/pages/LegalPage').then((m) => ({ default: m.LegalPage })))
const LicenseDetailPage = lazy(() => import('../components/pages/LicenseDetailPage').then((m) => ({ default: m.LicenseDetailPage })))
const LicensesPage = lazy(() => import('../components/pages/LicensesPage').then((m) => ({ default: m.LicensesPage })))
const LoginPage = lazy(() => import('../components/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const ModerationPage = lazy(() => import('../components/pages/ModerationPage').then((m) => ({ default: m.ModerationPage })))
const MyCoursesPage = lazy(() => import('../components/pages/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage })))
const PlansPage = lazy(() => import('../components/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const ProfilePage = lazy(() => import('../components/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const PublicQuestionBankPage = lazy(() => import('../components/pages/PublicQuestionBankPage').then((m) => ({ default: m.PublicQuestionBankPage })))
const PublicSeoDetailPage = lazy(() => import('../components/pages/PublicSeoDetailPage').then((m) => ({ default: m.PublicSeoDetailPage })))
const PublicStudyNotesPage = lazy(() => import('../components/pages/PublicStudyNotesPage').then((m) => ({ default: m.PublicStudyNotesPage })))
const QuestionsPage = lazy(() => import('../components/pages/QuestionsPage').then((m) => ({ default: m.QuestionsPage })))
const QuizPage = lazy(() => import('../components/pages/QuizPage').then((m) => ({ default: m.QuizPage })))
const RegisterPage = lazy(() => import('../components/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ReportsPage = lazy(() => import('../components/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const ResetPasswordPage = lazy(() => import('../components/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const SourceDocumentsPage = lazy(() => import('../components/pages/SourceDocumentsPage').then((m) => ({ default: m.SourceDocumentsPage })))
const StudentDashboardPage = lazy(() => import('../components/pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage })))
const StudyNotesPage = lazy(() => import('../components/pages/StudyNotesPage').then((m) => ({ default: m.StudyNotesPage })))
const SupportPage = lazy(() => import('../components/pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const TopicStudyPage = lazy(() => import('../components/pages/TopicStudyPage').then((m) => ({ default: m.TopicStudyPage })))
const TopicsPage = lazy(() => import('../components/pages/TopicsPage').then((m) => ({ default: m.TopicsPage })))
const TrialAttemptDetailPage = lazy(() => import('../components/pages/TrialAttemptDetailPage').then((m) => ({ default: m.TrialAttemptDetailPage })))
const TrialExamsPage = lazy(() => import('../components/pages/TrialExamsPage').then((m) => ({ default: m.TrialExamsPage })))
const TrialHistoryPage = lazy(() => import('../components/pages/TrialHistoryPage').then((m) => ({ default: m.TrialHistoryPage })))
const UserLicenseAccessesPage = lazy(() => import('../components/pages/UserLicenseAccessesPage').then((m) => ({ default: m.UserLicenseAccessesPage })))
const AchievementsPage = lazy(() => import('../features/gamification/AchievementsPage').then((m) => ({ default: m.AchievementsPage })))
const AdminAccessRequestsPage = lazy(() => import('../features/access-requests/AdminAccessRequestsPage').then((m) => ({ default: m.AdminAccessRequestsPage })))
const AdminContactMessagesPage = lazy(() => import('../features/contact/AdminContactMessagesPage').then((m) => ({ default: m.AdminContactMessagesPage })))
const AdminImportPage = lazy(() => import('../features/import/AdminImportPage').then((m) => ({ default: m.AdminImportPage })))
const CoursePracticePage = lazy(() => import('../features/course-practice/CoursePracticePage').then((m) => ({ default: m.CoursePracticePage })))
const CoursePracticeSessionPage = lazy(() => import('../features/course-practice/CoursePracticeSessionPage').then((m) => ({ default: m.CoursePracticeSessionPage })))
const GamificationPage = lazy(() => import('../features/gamification/GamificationPage').then((m) => ({ default: m.GamificationPage })))
const GoalsPage = lazy(() => import('../features/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })))
const LeaderboardPage = lazy(() => import('../features/gamification/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const MaterialViewerPage = lazy(() => import('../features/materials/MaterialViewerPage').then((m) => ({ default: m.MaterialViewerPage })))
const MyMaterialsPage = lazy(() => import('../features/content-discovery/MyMaterialsPage').then((m) => ({ default: m.MyMaterialsPage })))
const MyNotesPage = lazy(() => import('../features/content-discovery/MyNotesPage').then((m) => ({ default: m.MyNotesPage })))
const MyTopicsPage = lazy(() => import('../features/content-discovery/MyTopicsPage').then((m) => ({ default: m.MyTopicsPage })))
const MyAccessRequestsPage = lazy(() => import('../features/access-requests/MyAccessRequestsPage').then((m) => ({ default: m.MyAccessRequestsPage })))
const MyTrialsPage = lazy(() => import('../features/my-trials/MyTrialsPage').then((m) => ({ default: m.MyTrialsPage })))
const MySupportTicketsPage = lazy(() => import('../features/support/MySupportTicketsPage').then((m) => ({ default: m.MySupportTicketsPage })))
const NewSupportTicketPage = lazy(() => import('../features/support/NewSupportTicketPage').then((m) => ({ default: m.NewSupportTicketPage })))
const OnboardingPage = lazy(() =>
  import('../features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)
const PastExamsPage = lazy(() => import('../features/past-exams/PastExamsPage').then((m) => ({ default: m.PastExamsPage })))
const QuizAttemptSessionPage = lazy(() => import('../features/quiz-session/QuizAttemptSessionPage').then((m) => ({ default: m.QuizAttemptSessionPage })))
const QuizCatalogPage = lazy(() => import('../features/quiz-catalog/QuizCatalogPage').then((m) => ({ default: m.QuizCatalogPage })))
const QuizOverviewPage = lazy(() => import('../features/quiz-catalog/QuizOverviewPage').then((m) => ({ default: m.QuizOverviewPage })))
const QuizResultDetailPage = lazy(() => import('../features/quiz-results/QuizResultDetailPage').then((m) => ({ default: m.QuizResultDetailPage })))
const QuizSessionRedirectPage = lazy(() => import('../features/quiz-session/QuizSessionRedirectPage').then((m) => ({ default: m.QuizSessionRedirectPage })))
const ReviewSessionPage = lazy(() => import('../features/reviews/ReviewSessionPage').then((m) => ({ default: m.ReviewSessionPage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const SupportTicketDetailPage = lazy(() => import('../features/support/SupportTicketDetailPage').then((m) => ({ default: m.SupportTicketDetailPage })))
const TodayReviewsPage = lazy(() => import('../features/reviews/TodayReviewsPage').then((m) => ({ default: m.TodayReviewsPage })))
const TrialExamSessionPage = lazy(() => import('../features/my-trials/TrialExamSessionPage').then((m) => ({ default: m.TrialExamSessionPage })))
const WrongAnswersPage = lazy(() => import('../features/wrong-answers/WrongAnswersPage').then((m) => ({ default: m.WrongAnswersPage })))
const WrongAnswersSessionPage = lazy(() => import('../features/wrong-answers/WrongAnswersSessionPage').then((m) => ({ default: m.WrongAnswersSessionPage })))
const AdminSupportTicketsPage = lazy(() => import('../features/support/AdminSupportTicketsPage').then((m) => ({ default: m.AdminSupportTicketsPage })))

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<LazyFallback />}>{element}</Suspense>
}

function LazyFallback() {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 240 }}>
      <CircularProgress />
    </Box>
  )
}

function RouteDataFallback() {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: 240 }}>
      <CircularProgress />
    </Box>
  )
}

function RouteDataError() {
  return (
    <Alert severity="error" sx={{ m: 2 }}>
      Sayfa verileri alınamadı.
    </Alert>
  )
}

function DashboardRoute() {
  return <DashboardPage />
}

function StudentDashboardRoute() {
  return <StudentDashboardPage />
}

function MyCoursesRoute() {
  const coursesQuery = useCourses()
  const licensesQuery = useLicenses()
  const topicsQuery = useTopics()

  if (coursesQuery.isLoading || licensesQuery.isLoading || topicsQuery.isLoading) return <RouteDataFallback />
  if (coursesQuery.isError || licensesQuery.isError || topicsQuery.isError) return <RouteDataError />

  return <MyCoursesPage courses={coursesQuery.data ?? []} licenses={licensesQuery.data ?? []} topics={topicsQuery.data ?? []} />
}

function LicensesRoute() {
  const licensesQuery = useLicenses()
  const { reloadLicenses } = useAdminCatalogInvalidation()

  if (licensesQuery.isLoading) return <RouteDataFallback />
  if (licensesQuery.isError) return <RouteDataError />

  return <LicensesPage licenses={licensesQuery.data ?? []} onChanged={reloadLicenses} />
}

function CoursesRoute() {
  const coursesQuery = useCourses()
  const licensesQuery = useLicenses()
  const { reloadCourses } = useAdminCatalogInvalidation()

  if (coursesQuery.isLoading || licensesQuery.isLoading) return <RouteDataFallback />
  if (coursesQuery.isError || licensesQuery.isError) return <RouteDataError />

  return <CoursesPage courses={coursesQuery.data ?? []} licenses={licensesQuery.data ?? []} onChanged={reloadCourses} />
}

function TopicsRoute() {
  const coursesQuery = useCourses()
  const topicsQuery = useTopics()
  const { reloadTopics } = useAdminCatalogInvalidation()

  if (coursesQuery.isLoading || topicsQuery.isLoading) return <RouteDataFallback />
  if (coursesQuery.isError || topicsQuery.isError) return <RouteDataError />

  return <TopicsPage courses={coursesQuery.data ?? []} topics={topicsQuery.data ?? []} onChanged={reloadTopics} />
}

function StudyNotesRoute() {
  const notesQuery = useStudyNotes()
  const topicsQuery = useTopics()
  const { reloadStudyNotes } = useAdminCatalogInvalidation()

  if (notesQuery.isLoading || topicsQuery.isLoading) return <RouteDataFallback />
  if (notesQuery.isError || topicsQuery.isError) return <RouteDataError />

  return <StudyNotesPage notes={notesQuery.data ?? []} topics={topicsQuery.data ?? []} onChanged={reloadStudyNotes} />
}

function QuestionsRoute() {
  const questionsQuery = useQuestions()
  const topicsQuery = useTopics()
  const { reloadQuestions } = useAdminCatalogInvalidation()

  if (questionsQuery.isLoading || topicsQuery.isLoading) return <RouteDataFallback />
  if (questionsQuery.isError || topicsQuery.isError) return <RouteDataError />

  return <QuestionsPage questions={questionsQuery.data ?? []} topics={topicsQuery.data ?? []} onChanged={reloadQuestions} />
}

function SourceDocumentsRoute() {
  const coursesQuery = useCourses()
  const sourceDocumentsQuery = useSourceDocuments()
  const { reloadSourceDocuments } = useAdminCatalogInvalidation()

  if (coursesQuery.isLoading || sourceDocumentsQuery.isLoading) return <RouteDataFallback />
  if (coursesQuery.isError || sourceDocumentsQuery.isError) return <RouteDataError />

  return <SourceDocumentsPage courses={coursesQuery.data ?? []} sourceDocuments={sourceDocumentsQuery.data ?? []} onChanged={reloadSourceDocuments} />
}

function QuizRoute() {
  const topicsQuery = useTopics()

  if (topicsQuery.isLoading) return <RouteDataFallback />
  if (topicsQuery.isError) return <RouteDataError />

  return <QuizPage topics={topicsQuery.data ?? []} />
}

function QuizCatalogRoute() {
  const coursesQuery = useCourses()
  const licensesQuery = useLicenses()
  const topicsQuery = useTopics()

  if (coursesQuery.isLoading || licensesQuery.isLoading || topicsQuery.isLoading) return <RouteDataFallback />
  if (coursesQuery.isError || licensesQuery.isError || topicsQuery.isError) return <RouteDataError />

  return <QuizCatalogPage courses={coursesQuery.data ?? []} licenses={licensesQuery.data ?? []} topics={topicsQuery.data ?? []} />
}

function TrialExamsRoute() {
  const licensesQuery = useLicenses()
  const questionsQuery = useQuestions()
  const trialExamsQuery = useTrialExams()
  const { reloadTrialExams } = useAdminCatalogInvalidation()

  if (licensesQuery.isLoading || questionsQuery.isLoading || trialExamsQuery.isLoading) return <RouteDataFallback />
  if (licensesQuery.isError || questionsQuery.isError || trialExamsQuery.isError) return <RouteDataError />

  return (
    <TrialExamsPage
      licenses={licensesQuery.data ?? []}
      questions={questionsQuery.data ?? []}
      trialExams={trialExamsQuery.data ?? []}
      onChanged={reloadTrialExams}
    />
  )
}

function UserLicenseAccessesRoute() {
  const licensesQuery = useLicenses()

  if (licensesQuery.isLoading) return <RouteDataFallback />
  if (licensesQuery.isError) return <RouteDataError />

  return <UserLicenseAccessesPage licenses={licensesQuery.data ?? []} />
}

export const router = createBrowserRouter([
  {
    element: <AppBrandingShell />,
    children: [
      {
        path: '/',
        element: lazyElement(<App />),
        children: [
      {
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            element: <LandingPage />,
            handle: {
              seo: {
                title: 'Ana Sayfa',
                description: 'SPK lisans hazırlığı için ders notları, soru bankası, deneme sınavı ve öğrenci dashboard deneyimi.',
              },
            },
          },
          {
            path: 'features',
            element: <FeaturesPage />,
            handle: {
              seo: {
                title: 'Özellikler',
                description: 'SPK Akademi platformunun içerik yönetimi, öğrenci paneli, deneme sistemi ve raporlama özellikleri.',
              },
            },
          },
          {
            path: 'plans',
            element: <PlansPage />,
            handle: {
              seo: {
                title: 'Lisanslar ve Paketler',
                description: 'SPK lisans türleri, erişim modeli ve paket yapısını inceleyin.',
              },
            },
          },
          {
            path: 'licenses',
            element: <PlansPage />,
            handle: {
              seo: {
                title: 'Lisanslar',
                description: 'SPK lisans türleri, müfredat kapsamı, ders ve konu sayılarını inceleyin.',
              },
            },
          },
          {
            path: 'blog',
            element: <BlogPage />,
            handle: {
              seo: {
                title: 'Blog ve Rehberler',
                description: 'SPK lisansları, çıkmış sorular ve sınav hazırlık rehberleri.',
              },
            },
          },
          {
            path: 'blog/category/:slug',
            element: <BlogPage />,
            handle: {
              seo: {
                title: 'Blog Kategorisi',
                description: 'SPK Akademi blog kategori yazıları.',
              },
            },
          },
          {
            path: 'blog/:slug',
            element: <BlogDetailPage />,
            handle: {
              seo: {
                title: 'Blog Yazısı',
                description: 'SPK Akademi rehber blog yazısı.',
              },
            },
          },
          {
            path: 'licenses/:slug',
            element: <LicenseDetailPage />,
            handle: {
              seo: {
                title: 'Lisans Detayı',
                description: 'Lisans müfredatı, dersler, konular, sorular, denemeler ve materyaller.',
              },
            },
          },
          {
            path: 'about',
            element: <AboutPage />,
            handle: {
              seo: {
                title: 'Hakkımızda',
                description: 'SPK Akademi ürün yaklaşımı, öğrenci odaklı tasarımı ve platform vizyonu.',
              },
            },
          },
          {
            path: 'contact',
            element: <ContactPage />,
            handle: {
              seo: {
                title: 'İletişim',
                description: 'SPK Akademi ile iletişim kurun, destek alın veya demo taleplerinizi iletin.',
              },
            },
          },
          {
            path: 'faq',
            element: <FaqPage />,
            handle: {
              seo: {
                title: 'Sık Sorulan Sorular',
                description: 'Platform, erişim modeli, deneme sistemi ve içerik yapısı hakkında sık sorulan sorular.',
              },
            },
          },
          {
            path: 'support',
            element: <SupportPage />,
            handle: {
              seo: {
                title: 'Destek',
                description: 'Hesap, erişim ve çalışma deneyimi için destek alanları ve yardım içerikleri.',
              },
            },
          },
          {
            path: 'kvkk',
            element: <LegalPage pageKey="kvkk" />,
            handle: {
              seo: {
                title: 'KVKK',
                description: 'SPK Akademi kişisel verilerin korunmasına ilişkin bilgilendirme metni.',
              },
            },
          },
          {
            path: 'privacy',
            element: <LegalPage pageKey="privacy" />,
            handle: {
              seo: {
                title: 'Gizlilik Politikası',
                description: 'SPK Akademi gizlilik politikası ve veri işleme ilkeleri.',
              },
            },
          },
          {
            path: 'terms',
            element: <LegalPage pageKey="terms" />,
            handle: {
              seo: {
                title: 'Kullanım Koşulları',
                description: 'SPK Akademi kullanım koşulları ve platform hizmet şartları.',
              },
            },
          },
          {
            path: 'question-bank',
            element: <PublicQuestionBankPage />,
            handle: {
              seo: {
                title: 'Public Soru Bankası',
                description: 'Onaylı örnek sorular, mini quizler ve public açıklamalı çözümler.',
              },
            },
          },
          {
            path: 'study-notes',
            element: <PublicStudyNotesPage />,
            handle: {
              seo: {
                title: 'Ders Notları',
                description: 'SPK lisanslarına yönelik yayınlanmış ders notlarını lisans, ders ve konu bazında inceleyin.',
              },
            },
          },
          {
            path: 'free-trial',
            element: <FreeTrialPage />,
            handle: {
              seo: {
                title: 'Ücretsiz Deneme',
                description: 'Süreli ücretsiz deneme sınavı ile seviyenizi ölçün ve kayıtlı kullanıcı olarak denemeye devam edin.',
              },
            },
          },
          {
            path: 'courses/:slug',
            element: <PublicSeoDetailPage type="course" />,
            handle: {
              seo: {
                title: 'Ders Detayı',
                description: 'SPK lisans müfredatındaki ders kapsamı ve çalışma içeriği.',
              },
            },
          },
          {
            path: 'topics/:slug',
            element: <PublicSeoDetailPage type="topic" />,
            handle: {
              seo: {
                title: 'Konu Detayı',
                description: 'SPK lisans müfredatındaki konu özeti ve çalışma kapsamı.',
              },
            },
          },
          {
            path: 'login',
            element: <LoginPage />,
            handle: {
              seo: {
                title: 'Giriş Yap',
                description: 'SPK Akademi öğrenci veya admin paneline giriş yapın.',
              },
            },
          },
          {
            path: 'forgot-password',
            element: <ForgotPasswordPage />,
            handle: {
              seo: {
                title: 'Şifremi Unuttum',
                description: 'SPK Akademi hesabınız için şifre sıfırlama bağlantısı isteyin.',
              },
            },
          },
          {
            path: 'reset-password',
            element: <ResetPasswordPage />,
            handle: {
              seo: {
                title: 'Şifreyi Yenile',
                description: 'SPK Akademi hesabınız için yeni şifre belirleyin.',
              },
            },
          },
          {
            path: 'register',
            element: <RegisterPage />,
            handle: {
              seo: {
                title: 'Kayıt Ol',
                description: 'SPK Akademi üzerinde ücretsiz hesap oluşturarak öğrenci panelini kullanmaya başlayın.',
              },
            },
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <StudentOnboardingGuard />,
            children: [
              {
                path: 'onboarding',
                element: (
                  <Suspense fallback={<LazyFallback />}>
                    <OnboardingPage />
                  </Suspense>
                ),
              },
              {
                element: <StudentLayout />,
                children: [
              { path: 'dashboard', element: <StudentDashboardRoute /> },
              { path: 'questions/past-exams', element: <PastExamsPage /> },
              { path: 'materials/viewer/:materialId', element: <MaterialViewerPage /> },
              { path: 'gamification', element: <GamificationPage /> },
              { path: 'leaderboard', element: <LeaderboardPage /> },
              { path: 'dashboard/access-requests', element: <MyAccessRequestsPage /> },
              { path: 'my-courses', element: <MyCoursesRoute /> },
              { path: 'my-topics', element: <MyTopicsPage /> },
              { path: 'my-materials', element: <MyMaterialsPage /> },
              { path: 'my-notes', element: <MyNotesPage /> },
              { path: 'study/:topicId', element: <TopicStudyPage /> },
              { path: 'quiz', element: <QuizRoute /> },
              { path: 'mixed-practice', element: <QuizRoute /> },
              { path: 'quizzes', element: <QuizCatalogRoute /> },
              { path: 'licenses/:licenseId/quizzes', element: <QuizCatalogRoute /> },
              { path: 'quizzes/:quizId', element: <QuizOverviewPage /> },
              { path: 'quiz/session/:attemptId', element: <QuizSessionRedirectPage /> },
              { path: 'quiz/free/:attemptId', element: <TrialExamSessionPage /> },
              { path: 'quiz/licensed/:attemptId', element: <TrialExamSessionPage /> },
              { path: 'quiz/mock/:attemptId', element: <TrialExamSessionPage /> },
              { path: 'quiz/topic/:attemptId', element: <QuizAttemptSessionPage title="Konu pratiği" /> },
              { path: 'quiz/mixed/:attemptId', element: <QuizAttemptSessionPage title="Karma pratik" /> },
              { path: 'quiz/course-practice', element: <CoursePracticePage /> },
              { path: 'quiz/course-practice/:attemptId', element: <CoursePracticeSessionPage /> },
              { path: 'quiz/course-practice/session/:attemptId', element: <CoursePracticeSessionPage /> },
              { path: 'quiz/wrong-answers/:attemptId', element: <WrongAnswersSessionPage /> },
              { path: 'quiz/results/:attemptId', element: <QuizResultDetailPage /> },
              { path: 'quiz/wrong-answers', element: <WrongAnswersPage /> },
              { path: 'quiz/wrong-answers/session/:attemptId', element: <WrongAnswersSessionPage /> },
              { path: 'reviews/today', element: <TodayReviewsPage /> },
              { path: 'reviews/session/:sessionId', element: <ReviewSessionPage /> },
              { path: 'reports', element: <ReportsPage /> },
              { path: 'goals', element: <GoalsPage /> },
              { path: 'my-trials', element: <MyTrialsPage /> },
              { path: 'my-trials/session/:attemptId', element: <QuizSessionRedirectPage /> },
              { path: 'trials', element: <TrialHistoryPage /> },
              { path: 'trials/:attemptId', element: <TrialAttemptDetailPage /> },
              { path: 'support/my-tickets', element: <MySupportTicketsPage /> },
              { path: 'support/new', element: <NewSupportTicketPage /> },
              { path: 'support/tickets/:id', element: <SupportTicketDetailPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'profile/achievements', element: <AchievementsPage /> },
                ],
              },
            ],
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <DashboardRoute /> },
                  { path: 'licenses', element: <LicensesRoute /> },
                  { path: 'courses', element: <CoursesRoute /> },
                  { path: 'topics', element: <TopicsRoute /> },
                  { path: 'notes', element: <StudyNotesRoute /> },
                  { path: 'questions', element: <QuestionsRoute /> },
                  { path: 'sources', element: <SourceDocumentsRoute /> },
                  { path: 'trial-exams', element: <TrialExamsRoute /> },
                  { path: 'moderation', element: <ModerationPage /> },
                  { path: 'access', element: <UserLicenseAccessesRoute /> },
                  { path: 'access-requests', element: <AdminAccessRequestsPage /> },
                  { path: 'contact-messages', element: <AdminContactMessagesPage /> },
                  { path: 'support-tickets', element: <AdminSupportTicketsPage /> },
                  { path: 'blog', element: <AdminBlogPage /> },
                  { path: 'import', element: <AdminImportPage /> },
                  { path: 'consents', element: <AdminConsentsPage /> },
                  { path: 'badges', element: <AdminBadgesPage /> },
                ],
              },
            ],
          },
        ],
      },
          { path: '*', element: <Navigate replace to="/" /> },
        ],
      },
    ],
  },
])
