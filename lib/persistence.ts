import { get as idbGet, set as idbSet } from 'idb-keyval'
import type { StudySet, TutorMode, AIMessage } from '@/lib/store'
import { normalizeStudySets } from '@/lib/store'

const DB_KEY_STUDY_SETS = 'novamind_study_sets'
const DB_KEY_AI_MESSAGES = 'novamind_ai_messages'
const DB_KEY_TUTOR_MODE = 'novamind_tutor_mode'

export async function loadStudySets(): Promise<StudySet[]> {
  const storedSets = await idbGet<StudySet[]>(DB_KEY_STUDY_SETS)
  return storedSets ? normalizeStudySets(storedSets) : []
}

export async function saveStudySets(studySets: StudySet[]) {
  return idbSet(DB_KEY_STUDY_SETS, studySets)
}

export async function loadAiMessages(): Promise<AIMessage[]> {
  const storedMessages = await idbGet<AIMessage[]>(DB_KEY_AI_MESSAGES)
  return storedMessages ?? []
}

export async function saveAiMessages(messages: AIMessage[]) {
  return idbSet(DB_KEY_AI_MESSAGES, messages)
}

export async function loadTutorMode(): Promise<TutorMode | undefined> {
  return idbGet<TutorMode>(DB_KEY_TUTOR_MODE)
}

export async function saveTutorMode(mode: TutorMode) {
  return idbSet(DB_KEY_TUTOR_MODE, mode)
}

export function prepareStudySetForSync(set: StudySet) {
  return {
    ...set,
    createdAt: set.createdAt.toISOString(),
    lastStudied: set.lastStudied?.toISOString(),
    lastSyncedAt: set.lastSyncedAt?.toISOString(),
    cards: set.cards.map((card) => ({
      ...card,
      lastReviewed: card.lastReviewed?.toISOString(),
      dueDate: card.dueDate.toISOString(),
    })),
  }
}

export function markStudySetPendingSync(set: StudySet): StudySet {
  return {
    ...set,
    syncStatus: 'pending',
  }
}

export function markStudySetSynced(set: StudySet, remoteId?: string): StudySet {
  return {
    ...set,
    remoteId: remoteId ?? set.remoteId,
    syncStatus: 'synced',
    lastSyncedAt: new Date(),
  }
}
