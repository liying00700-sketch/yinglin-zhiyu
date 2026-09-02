import type { GrowthState } from './types'

const STORAGE_KEY = 'yinglin-child-growth:v1'

export const emptyState: GrowthState = {
  version: 1,
  profile: {
    nickname: '',
    birthDate: '',
    caregiver: '',
    dailyMinutes: 30,
  },
  plan: null,
  planArchives: [],
  feedback: [],
  questionHistory: [],
  savedMethods: [],
}

export function loadState(): GrowthState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<GrowthState>
    if (parsed.version !== 1) return emptyState
    return {
      ...emptyState,
      ...parsed,
      profile: { ...emptyState.profile, ...parsed.profile },
      planArchives: Array.isArray(parsed.planArchives) ? parsed.planArchives : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      questionHistory: Array.isArray(parsed.questionHistory) ? parsed.questionHistory : [],
      savedMethods: Array.isArray(parsed.savedMethods) ? parsed.savedMethods : [],
    }
  } catch {
    return emptyState
  }
}

export function saveState(state: GrowthState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState() {
  window.localStorage.removeItem(STORAGE_KEY)
}
