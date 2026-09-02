export const SUBJECTS = ['语文', '数学', '英语', '艺术', '运动', '思维', '科学'] as const

export type Subject = typeof SUBJECTS[number]
export type View = 'home' | 'qa' | 'overview' | 'plan' | 'care' | 'review' | 'profile'

export type ChildProfile = {
  nickname: string
  birthDate: string
  caregiver: string
  dailyMinutes: number
}

export type Activity = {
  id: string
  subject: Subject
  title: string
  format: '共同阅读' | '生活探索' | '精细运动' | '大运动' | '游戏' | '艺术创作'
  minutes: number
  goal: string
  value: string
  props: string[]
  steps: string[]
  fallback: string
}

export type PlanDay = {
  dayIndex: number
  weekday: string
  date: string
  items: Activity[]
}

export type WeeklyPlan = {
  version: 1
  revision: number
  weekStart: string
  selectedSubjects: Subject[]
  completedItemIds: string[]
  days: PlanDay[]
  generatedFrom: string
}

export type CareFeedback = {
  id: string
  activityDate: string
  createdAt: string
  dayIndex: number
  caregiver: string
  completedItemIds: string[]
  subjects: Subject[]
  response: 'engaged' | 'neutral' | 'resistant'
  difficulty: 'easy' | 'right' | 'hard'
  note: string
}

export type ParentingAnswer = {
  judgment: string
  title: string
  empathy: string
  signals: string[]
  action: string
  script: string
  observe: string
  escalation: string
  sourceNote?: string
}

export type ParentingSource = {
  title: string
  kind: string
}

export type QuestionFeedback = 'trying' | 'helpful' | 'no_change' | 'worse'

export type ParentingQuestion = {
  id: string
  question: string
  askedAt: string
  answer: ParentingAnswer
  sources: ParentingSource[]
  feedback?: QuestionFeedback
}

export type SavedMethod = {
  id: string
  question: string
  action: string
  savedAt: string
}

export type GrowthState = {
  version: 1
  profile: ChildProfile
  plan: WeeklyPlan | null
  planArchives: WeeklyPlan[]
  feedback: CareFeedback[]
  questionHistory: ParentingQuestion[]
  savedMethods: SavedMethod[]
}

export type Evidence = {
  id: string
  date: string
  subject: Subject
  title: string
  minutes: number
  caregiver: string
  response?: CareFeedback['response']
  difficulty?: CareFeedback['difficulty']
  note?: string
}
