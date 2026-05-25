'use client'

import { useState, useCallback, useEffect } from 'react'
import { sampleQuizQuestions, sampleStudySets, type StudySet, type Flashcard, type AIMessage, type QuizQuestion, type TutorMode, generateId, serializeStudySets, deserializeStudySets } from '@/lib/store'
import { loadStudySets, saveStudySets, loadAiMessages, saveAiMessages, loadTutorMode, saveTutorMode } from '@/lib/persistence'
import { isOnline } from '@/lib/utils'

const DAY_MS = 1000 * 60 * 60 * 24

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function ensureDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return undefined
}

function normalizeFlashcard(card: unknown): Flashcard {
  const normalizedCard = asRecord(card)
  const mastery =
    normalizedCard.mastery === 'new' ||
    normalizedCard.mastery === 'learning' ||
    normalizedCard.mastery === 'mastered'
      ? normalizedCard.mastery
      : 'new'
  const timesReviewed = typeof normalizedCard.timesReviewed === 'number' ? normalizedCard.timesReviewed : 0
  const repetitions = typeof normalizedCard.repetitions === 'number' ? normalizedCard.repetitions : 0
  const interval = typeof normalizedCard.interval === 'number' ? normalizedCard.interval : 0
  const easeFactor = typeof normalizedCard.easeFactor === 'number' ? normalizedCard.easeFactor : 2.5
  const dueDate = ensureDate(normalizedCard.dueDate) ?? new Date()

  return {
    ...normalizedCard,
    id: typeof normalizedCard.id === 'string' ? normalizedCard.id : generateId(),
    front: typeof normalizedCard.front === 'string' ? normalizedCard.front : '',
    back: typeof normalizedCard.back === 'string' ? normalizedCard.back : '',
    mastery,
    timesReviewed,
    lastReviewed: ensureDate(normalizedCard.lastReviewed),
    repetitions,
    interval,
    easeFactor,
    dueDate,
  }
}

function normalizeStudySet(set: unknown): StudySet {
  const normalizedSet = asRecord(set)
  const cards = Array.isArray(normalizedSet.cards) ? normalizedSet.cards.map(normalizeFlashcard) : []

  return {
    ...normalizedSet,
    id: typeof normalizedSet.id === 'string' ? normalizedSet.id : generateId(),
    title: typeof normalizedSet.title === 'string' ? normalizedSet.title : 'Untitled Study Set',
    description: typeof normalizedSet.description === 'string' ? normalizedSet.description : '',
    subject: typeof normalizedSet.subject === 'string' ? normalizedSet.subject : 'General',
    createdAt: ensureDate(normalizedSet.createdAt) ?? new Date(),
    lastStudied: ensureDate(normalizedSet.lastStudied),
    cards,
    cardCount: typeof normalizedSet.cardCount === 'number' ? normalizedSet.cardCount : cards.length,
    progress: typeof normalizedSet.progress === 'number' ? normalizedSet.progress : 0,
    color: typeof normalizedSet.color === 'string' ? normalizedSet.color : 'from-primary/20 to-chart-2/20',
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function sm2({
  quality,
  repetitions,
  interval,
  easeFactor,
}: {
  quality: number
  repetitions: number
  interval: number
  easeFactor: number
}) {
  const q = Math.max(0, Math.min(5, quality))
  const ef = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  )

  if (q < 3) {
    return { repetitions: 0, interval: 1, easeFactor: ef }
  }

  const nextReps = repetitions + 1
  if (nextReps === 1) return { repetitions: nextReps, interval: 1, easeFactor: ef }
  if (nextReps === 2) return { repetitions: nextReps, interval: 6, easeFactor: ef }
  return { repetitions: nextReps, interval: Math.max(1, Math.round(interval * ef)), easeFactor: ef }
}

export function useStudyApp() {
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [quizQuestions] = useState<QuizQuestion[]>(sampleQuizQuestions)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Nova, your AI study companion. I can help you create flashcards, explain concepts, quiz you on topics, or generate study materials. What would you like to learn today?",
      timestamp: new Date()
    }
  ])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [aiTutorMode, setAiTutorMode] = useState<TutorMode>('socratic')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedSets = await loadStudySets()
        const storedMessages = await loadAiMessages()
        const storedMode = await loadTutorMode()

        // If the only sets in IndexedDB are the bundled sample sets (from prior dev builds),
        // treat this as a fresh install and clear them so new users start with an empty library.
        const isOnlySampleSeed =
          storedSets.length > 0 &&
          storedSets.length === sampleStudySets.length &&
          storedSets.every((s) => sampleStudySets.some((ss) => ss.id === s.id && ss.title === s.title))

        if (isOnlySampleSeed) {
          // Clear persisted sample sets and keep in-memory state empty for a clean first-run
          try {
            await saveStudySets([])
          } catch (err) {
            console.error('Failed to clear seeded sample study sets:', err)
          }
        } else if (storedSets.length > 0) {
          setStudySets(storedSets)
        }
        if (storedMessages.length > 0) {
          setAiMessages(storedMessages)
        }
        if (storedMode) {
          setAiTutorMode(storedMode)
        }
      } catch (error) {
        console.error('Failed to load data from IndexedDB:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadData()
  }, [])

  // Save to IndexedDB whenever data changes, but only after initial load
  useEffect(() => {
    if (!isLoaded) return
    saveStudySets(studySets).catch(err => console.error('Failed to save study sets:', err))
  }, [studySets, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    saveAiMessages(aiMessages).catch(err => console.error('Failed to save messages:', err))
  }, [aiMessages, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    saveTutorMode(aiTutorMode).catch(err => console.error('Failed to save tutor mode:', err))
  }, [aiTutorMode, isLoaded])

  const addStudySet = useCallback((set: Omit<StudySet, 'id' | 'createdAt' | 'progress'>) => {
    const newSet: StudySet = normalizeStudySet({
      ...set,
      id: generateId(),
      createdAt: new Date(),
      progress: 0,
    })
    setStudySets(prev => [newSet, ...prev])
    return newSet
  }, [])

  const updateStudySet = useCallback((id: string, updates: Partial<StudySet>) => {
    setStudySets(prev => prev.map(set => 
      set.id === id ? { ...set, ...updates } : set
    ))
  }, [])

  const deleteStudySet = useCallback((id: string) => {
    setStudySets(prev => prev.filter(set => set.id !== id))
  }, [])

  const addFlashcard = useCallback((setId: string, card: Omit<Flashcard, 'id' | 'mastery' | 'timesReviewed' | 'repetitions' | 'interval' | 'easeFactor' | 'dueDate'>) => {
    const newCard: Flashcard = {
      ...card,
      id: generateId(),
      mastery: 'new',
      timesReviewed: 0,
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date(),
    }
    setStudySets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, cards: [...set.cards, newCard], cardCount: set.cardCount + 1 }
        : set
    ))
    return newCard
  }, [])

  const updateCardMastery = useCallback((setId: string, cardId: string, correct: boolean) => {
    setStudySets(prev => prev.map(set => {
      if (set.id !== setId) return set
      
      const updatedCards = set.cards.map(card => {
        if (card.id !== cardId) return card
        
        const newTimesReviewed = card.timesReviewed + 1
        const now = new Date()
        const { repetitions, interval, easeFactor } = sm2({
          quality: correct ? 4 : 2,
          repetitions: card.repetitions,
          interval: card.interval || 1,
          easeFactor: card.easeFactor,
        })

        let newMastery: Flashcard['mastery'] = 'learning'
        if (!correct && card.mastery === 'new') newMastery = 'new'
        if (correct && repetitions >= 3) newMastery = 'mastered'
        
        return {
          ...card,
          mastery: newMastery,
          timesReviewed: newTimesReviewed,
          lastReviewed: now,
          repetitions,
          interval,
          easeFactor,
          dueDate: addDays(now, interval)
        }
      })

      const masteredCount = updatedCards.filter(c => c.mastery === 'mastered').length
      const progress = Math.round((masteredCount / updatedCards.length) * 100)

      return {
        ...set,
        cards: updatedCards,
        progress,
        lastStudied: new Date()
      }
    }))
  }, [])

  const exportStudySets = useCallback(() => {
    return serializeStudySets(studySets)
  }, [studySets])

  const importStudySets = useCallback((json: string, options?: { replace?: boolean }) => {
    const importedSets = deserializeStudySets(json)

    setStudySets((previousSets) => {
      if (options?.replace) {
        return importedSets
      }

      const existingIds = new Set(previousSets.map((set) => set.id))
      const mergedSets = [...previousSets]

      for (const set of importedSets) {
        if (!existingIds.has(set.id)) {
          mergedSets.push(set)
        }
      }

      return mergedSets
    })

    return importedSets
  }, [])

  const sendAiMessage = useCallback(async (content: string) => {
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    // Capture current messages history state and append new user message to send to the backend
    const updatedMessages = [...aiMessages, userMessage]
    setAiMessages(updatedMessages)
    setIsAiTyping(true)

    const clientApiKey = typeof window !== 'undefined' ? localStorage.getItem('novamind_gemini_key') || '' : ''

    if (!isOnline()) {
      const offlineResponse: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: "Nova cannot access AI services while offline. Please connect to the internet to use the tutor.",
        timestamp: new Date(),
      }
      setAiMessages(prev => [...prev, offlineResponse])
      setIsAiTyping(false)
      return
    }

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          mode: aiTutorMode,
          apiKey: clientApiKey,
        })
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          typeof data?.content === 'string'
            ? data.content
            : typeof data?.error === 'string'
              ? data.error
              : `Sorry — the tutor service returned an error (status ${response.status}).`
        const errorResponse: AIMessage = {
          id: generateId(),
          role: 'assistant',
          content: message,
          timestamp: new Date()
        }
        setAiMessages(prev => [...prev, errorResponse])
        return
      }
      
      const aiResponse: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: data?.content ?? "I'm sorry, I couldn't process that. Could you try again?",
        timestamp: new Date()
      }

      setAiMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error(error)
      const errorResponse: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: "Sorry, I had trouble connecting to the network. Please make sure your server is running or try again later!",
        timestamp: new Date()
      }
      setAiMessages(prev => [...prev, errorResponse])
    } finally {
      setIsAiTyping(false)
    }
  }, [aiMessages, aiTutorMode])

  return {
    studySets,
    quizQuestions,
    aiMessages,
    isAiTyping,
    aiTutorMode,
    setAiTutorMode,
    addStudySet,
    updateStudySet,
    deleteStudySet,
    addFlashcard,
    updateCardMastery,
    sendAiMessage,
    exportStudySets,
    importStudySets,
  }
}
