export enum QuestionDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
}

export enum QuestionType {
  Definition = 1,
  Concept = 2,
  Legislation = 3,
  Formula = 4,
  Comparison = 5,
  Interpretation = 6,
}

export enum QuizMode {
  TopicPractice = 1,
  CoursePractice = 2,
  MixedPractice = 3,
  TrialExam = 4,
  WrongAnswers = 5,
  FreeTrial = 6,
  LicensedQuiz = 7,
  ReviewSession = 8,
  MockExam = 9,
  PastExams = 10,
}

export enum ExamType {
  SPKLevel1 = 1,
  SPKLevel2 = 2,
  SPKLevel3 = 3,
  DerivativeLicense = 4,
  CreditRating = 5,
  CorporateGovernance = 6,
  HousingValuation = 7,
  CapitalMarketsActivities = 8,
}

export enum ExamSession {
  Spring = 1,
  Summer = 2,
  Fall = 3,
  Winter = 4,
}

export enum ReviewStatus {
  Draft = 0,
  PendingReview = 1,
  Approved = 2,
  NeedsRevision = 3,
  Rejected = 4,
}

export enum ContentAccessLevel {
  Free = 1,
  Trial = 2,
  Premium = 3,
}

export enum StudyStatus {
  NotStarted = 1,
  InProgress = 2,
  Studied = 3,
  NeedsReview = 4,
  Mastered = 5,
}
