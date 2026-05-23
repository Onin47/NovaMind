// Types for our study app
export type SyncStatus = 'synced' | 'pending' | 'failed'

export interface StudySet {
  id: string
  title: string
  description: string
  subject: string
  cardCount: number
  createdAt: Date
  lastStudied?: Date
  progress: number
  cards: Flashcard[]
  color: string
  remoteId?: string
  syncStatus?: SyncStatus
  lastSyncedAt?: Date
}

export interface Flashcard {
  id: string
  front: string
  back: string
  mastery: 'new' | 'learning' | 'mastered'
  timesReviewed: number
  lastReviewed?: Date
  repetitions: number
  interval: number
  easeFactor: number
  dueDate: Date
}

export type TutorMode = 'socratic' | 'direct'

export type QuizType = 
  | 'multiple-choice'
  | 'identification'
  | 'modified-true-false'
  | 'enumeration'
  | 'essay'
  | 'fill-in-the-blank'

export interface QuizQuestion {
  id: string
  question: string
  type: QuizType
  // For multiple choice
  options?: string[]
  correctAnswer?: number
  // For identification
  correctText?: string
  acceptableAnswers?: string[]
  // For modified true/false
  statement?: string
  isTrue?: boolean
  correction?: string // What makes it false
  // For enumeration
  items?: string[]
  itemCount?: number
  // For essay
  rubric?: string
  sampleAnswer?: string
  minWords?: number
  // For fill-in-the-blank
  blankedText?: string  // The sentence with ____ placeholder
  blankAnswer?: string  // The correct word for the blank
  // Common
  explanation: string
  points: number
}

export interface StudySession {
  id: string
  setId: string
  startTime: Date
  endTime?: Date
  cardsStudied: number
  correctAnswers: number
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Sample data
export const sampleStudySets: StudySet[] = [
  {
    id: '1',
    title: 'Biology: Cell Structure',
    description: 'Learn about the fundamental building blocks of life',
    subject: 'Biology',
    cardCount: 24,
    createdAt: new Date('2024-01-15'),
    lastStudied: new Date('2024-01-20'),
    progress: 68,
    color: 'from-emerald-500/20 to-teal-500/20',
    cards: [
      { id: '1-1', front: 'What is the powerhouse of the cell?', back: 'Mitochondria - They generate most of the cell\'s supply of ATP through oxidative phosphorylation', mastery: 'mastered', timesReviewed: 5, repetitions: 3, interval: 14, easeFactor: 2.5, dueDate: new Date() },
      { id: '1-2', front: 'What is the function of ribosomes?', back: 'Ribosomes are responsible for protein synthesis by translating mRNA into proteins', mastery: 'learning', timesReviewed: 3, repetitions: 2, interval: 6, easeFactor: 2.5, dueDate: new Date() },
      { id: '1-3', front: 'What is the cell membrane made of?', back: 'Phospholipid bilayer with embedded proteins, cholesterol, and carbohydrates', mastery: 'new', timesReviewed: 0, repetitions: 0, interval: 0, easeFactor: 2.5, dueDate: new Date() },
      { id: '1-4', front: 'What is endoplasmic reticulum?', back: 'A network of membranes involved in protein and lipid synthesis. Rough ER has ribosomes, Smooth ER does not.', mastery: 'learning', timesReviewed: 2, repetitions: 1, interval: 1, easeFactor: 2.5, dueDate: new Date() },
    ]
  },
  {
    id: '2',
    title: 'Spanish Vocabulary',
    description: 'Essential Spanish words and phrases for beginners',
    subject: 'Languages',
    cardCount: 50,
    createdAt: new Date('2024-01-10'),
    lastStudied: new Date('2024-01-19'),
    progress: 45,
    color: 'from-orange-500/20 to-amber-500/20',
    cards: [
      { id: '2-1', front: 'Hello', back: 'Hola', mastery: 'mastered', timesReviewed: 10, repetitions: 5, interval: 30, easeFactor: 2.5, dueDate: new Date() },
      { id: '2-2', front: 'Goodbye', back: 'Adiós', mastery: 'mastered', timesReviewed: 8, repetitions: 4, interval: 21, easeFactor: 2.5, dueDate: new Date() },
      { id: '2-3', front: 'Thank you', back: 'Gracias', mastery: 'learning', timesReviewed: 4, repetitions: 2, interval: 6, easeFactor: 2.5, dueDate: new Date() },
      { id: '2-4', front: 'Please', back: 'Por favor', mastery: 'new', timesReviewed: 1, repetitions: 0, interval: 0, easeFactor: 2.5, dueDate: new Date() },
    ]
  },
  {
    id: '3',
    title: 'World History: Ancient Rome',
    description: 'Key events and figures from the Roman Empire',
    subject: 'History',
    cardCount: 32,
    createdAt: new Date('2024-01-05'),
    progress: 82,
    color: 'from-violet-500/20 to-indigo-500/20',
    cards: [
      { id: '3-1', front: 'When was Rome founded?', back: '753 BC, according to legend by Romulus and Remus', mastery: 'mastered', timesReviewed: 6, repetitions: 3, interval: 14, easeFactor: 2.5, dueDate: new Date() },
      { id: '3-2', front: 'Who was Julius Caesar?', back: 'Roman general and statesman who played a critical role in transforming the Roman Republic into the Roman Empire', mastery: 'mastered', timesReviewed: 7, repetitions: 4, interval: 21, easeFactor: 2.5, dueDate: new Date() },
      { id: '3-3', front: 'What was the Pax Romana?', back: 'A period of approximately 200 years of relative peace and stability in the Roman Empire (27 BC - 180 AD)', mastery: 'learning', timesReviewed: 3, repetitions: 2, interval: 6, easeFactor: 2.5, dueDate: new Date() },
    ]
  },
  {
    id: '4',
    title: 'Calculus Fundamentals',
    description: 'Derivatives, integrals, and limits',
    subject: 'Mathematics',
    cardCount: 40,
    createdAt: new Date('2024-01-12'),
    progress: 35,
    color: 'from-blue-500/20 to-cyan-500/20',
    cards: [
      { id: '4-1', front: 'What is a derivative?', back: 'The derivative measures the rate of change of a function with respect to its variable', mastery: 'learning', timesReviewed: 4, repetitions: 2, interval: 6, easeFactor: 2.5, dueDate: new Date() },
      { id: '4-2', front: 'What is the power rule?', back: 'd/dx[x^n] = n*x^(n-1)', mastery: 'new', timesReviewed: 1, repetitions: 0, interval: 0, easeFactor: 2.5, dueDate: new Date() },
      { id: '4-3', front: 'What is an integral?', back: 'The integral is the reverse of a derivative - it finds the area under a curve', mastery: 'new', timesReviewed: 0, repetitions: 0, interval: 0, easeFactor: 2.5, dueDate: new Date() },
    ]
  },
]

export const sampleQuizQuestions: QuizQuestion[] = [
  // Multiple Choice
  {
    id: 'mc1',
    question: 'What organelle is known as the powerhouse of the cell?',
    type: 'multiple-choice',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'],
    correctAnswer: 1,
    explanation: 'Mitochondria generate most of the cell\'s ATP through cellular respiration.',
    points: 2
  },
  {
    id: 'mc2',
    question: 'Which structure contains the cell\'s genetic material?',
    type: 'multiple-choice',
    options: ['Cytoplasm', 'Nucleus', 'Cell Wall', 'Vacuole'],
    correctAnswer: 1,
    explanation: 'The nucleus houses DNA and controls cell activities.',
    points: 2
  },
  {
    id: 'mc3',
    question: 'What is the primary function of the cell membrane?',
    type: 'multiple-choice',
    options: ['Energy production', 'Protein synthesis', 'Regulating what enters and exits', 'DNA replication'],
    correctAnswer: 2,
    explanation: 'The cell membrane acts as a selective barrier, controlling the movement of substances.',
    points: 2
  },
  // Identification
  {
    id: 'id1',
    question: 'This organelle is responsible for protein synthesis and can be found on the rough endoplasmic reticulum.',
    type: 'identification',
    correctText: 'Ribosome',
    acceptableAnswers: ['ribosome', 'ribosomes', 'the ribosome'],
    explanation: 'Ribosomes translate mRNA into proteins through a process called translation.',
    points: 3
  },
  {
    id: 'id2',
    question: 'Name the cellular structure that packages and modifies proteins for secretion.',
    type: 'identification',
    correctText: 'Golgi Apparatus',
    acceptableAnswers: ['golgi apparatus', 'golgi body', 'golgi complex', 'the golgi apparatus', 'golgi'],
    explanation: 'The Golgi apparatus modifies, sorts, and packages proteins and lipids for transport.',
    points: 3
  },
  {
    id: 'id3',
    question: 'What is the jelly-like substance that fills the cell and surrounds organelles?',
    type: 'identification',
    correctText: 'Cytoplasm',
    acceptableAnswers: ['cytoplasm', 'the cytoplasm', 'cytosol'],
    explanation: 'Cytoplasm is a gel-like material that provides structure and support for organelles.',
    points: 3
  },
  // Modified True or False
  {
    id: 'mtf1',
    question: 'Evaluate the statement and provide correction if false:',
    statement: 'The cell wall is found in all living cells and provides structural support.',
    type: 'modified-true-false',
    isTrue: false,
    correction: 'plant cells, fungi, and bacteria (not animal cells)',
    explanation: 'Cell walls are only found in plant cells, fungi, and bacteria. Animal cells have only a cell membrane.',
    points: 3
  },
  {
    id: 'mtf2',
    question: 'Evaluate the statement and provide correction if false:',
    statement: 'Mitochondria have their own DNA and can replicate independently.',
    type: 'modified-true-false',
    isTrue: true,
    explanation: 'This is true! Mitochondria contain their own DNA (mtDNA) and can replicate independently of cell division.',
    points: 3
  },
  {
    id: 'mtf3',
    question: 'Evaluate the statement and provide correction if false:',
    statement: 'Chloroplasts are found in animal cells and are responsible for photosynthesis.',
    type: 'modified-true-false',
    isTrue: false,
    correction: 'plant cells (not animal cells)',
    explanation: 'Chloroplasts are only found in plant cells and some algae, not in animal cells.',
    points: 3
  },
  // Enumeration
  {
    id: 'enum1',
    question: 'List the 4 main types of organic molecules found in cells (macromolecules):',
    type: 'enumeration',
    items: ['Carbohydrates', 'Lipids', 'Proteins', 'Nucleic Acids'],
    itemCount: 4,
    explanation: 'The four macromolecules are essential for cellular structure and function.',
    points: 4
  },
  {
    id: 'enum2',
    question: 'Name 3 organelles that are membrane-bound:',
    type: 'enumeration',
    items: ['Nucleus', 'Mitochondria', 'Endoplasmic Reticulum', 'Golgi Apparatus', 'Lysosome', 'Vacuole', 'Chloroplast'],
    itemCount: 3,
    explanation: 'Membrane-bound organelles are surrounded by a lipid bilayer membrane.',
    points: 3
  },
  // Essay
  {
    id: 'essay1',
    question: 'Explain the relationship between the structure and function of mitochondria. How does its structure enable efficient ATP production?',
    type: 'essay',
    rubric: 'Include: double membrane structure, cristae (inner membrane folds), matrix, electron transport chain location, and how these features maximize surface area for ATP synthesis.',
    sampleAnswer: 'Mitochondria have a unique double-membrane structure that is essential for ATP production. The outer membrane is smooth and permeable, while the inner membrane is highly folded into structures called cristae. These folds dramatically increase the surface area available for the electron transport chain proteins, which are embedded in the inner membrane. The matrix (inner compartment) contains enzymes for the citric acid cycle. This compartmentalization allows for the establishment of a proton gradient between the intermembrane space and the matrix, which drives ATP synthase to produce ATP through chemiosmosis.',
    minWords: 50,
    explanation: 'A complete answer addresses the double membrane, cristae, and how structure supports function.',
    points: 10
  },
  {
    id: 'essay2',
    question: 'Compare and contrast the processes of diffusion and active transport across the cell membrane.',
    type: 'essay',
    rubric: 'Include: energy requirements, direction of movement, examples of each, proteins involved.',
    sampleAnswer: 'Diffusion and active transport are two mechanisms by which substances cross the cell membrane. Diffusion is a passive process that requires no energy, where molecules move from high to low concentration following their concentration gradient. Active transport, in contrast, requires ATP energy to move molecules against their concentration gradient (from low to high concentration). Diffusion includes simple diffusion of small nonpolar molecules and facilitated diffusion using channel proteins. Active transport uses carrier proteins like the sodium-potassium pump. Both processes are essential for maintaining cellular homeostasis.',
    minWords: 40,
    explanation: 'Compare the energy needs, direction, and mechanisms of both transport types.',
    points: 8
  }
]

function isValidDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function parseDate(value: unknown, fallback?: Date): Date | undefined {
  if (value instanceof Date) return value
  if (isValidDateString(value)) return new Date(value)
  return fallback
}

function normalizeFlashcardPayload(value: unknown): Flashcard {
  const card = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const mastery =
    card.mastery === 'new' ||
    card.mastery === 'learning' ||
    card.mastery === 'mastered'
      ? card.mastery
      : 'new'

  return {
    id: typeof card.id === 'string' ? card.id : generateId(),
    front: typeof card.front === 'string' ? card.front : '',
    back: typeof card.back === 'string' ? card.back : '',
    mastery,
    timesReviewed: typeof card.timesReviewed === 'number' ? card.timesReviewed : 0,
    lastReviewed: parseDate(card.lastReviewed),
    repetitions: typeof card.repetitions === 'number' ? card.repetitions : 0,
    interval: typeof card.interval === 'number' ? card.interval : 0,
    easeFactor: typeof card.easeFactor === 'number' ? card.easeFactor : 2.5,
    dueDate: parseDate(card.dueDate, new Date()) ?? new Date(),
  }
}

function normalizeStudySetPayload(value: unknown): StudySet {
  const set = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const cards = Array.isArray(set.cards) ? set.cards.map(normalizeFlashcardPayload) : []

  const syncStatus =
    set.syncStatus === 'synced' ||
    set.syncStatus === 'pending' ||
    set.syncStatus === 'failed'
      ? set.syncStatus
      : undefined

  return {
    id: typeof set.id === 'string' ? set.id : generateId(),
    title: typeof set.title === 'string' ? set.title : 'Untitled Study Set',
    description: typeof set.description === 'string' ? set.description : '',
    subject: typeof set.subject === 'string' ? set.subject : 'General',
    createdAt: parseDate(set.createdAt, new Date()) ?? new Date(),
    lastStudied: parseDate(set.lastStudied),
    cardCount: typeof set.cardCount === 'number' ? set.cardCount : cards.length,
    progress: typeof set.progress === 'number' ? set.progress : 0,
    color: typeof set.color === 'string' ? set.color : 'from-primary/20 to-chart-2/20',
    cards,
    remoteId: typeof set.remoteId === 'string' ? set.remoteId : undefined,
    syncStatus,
    lastSyncedAt: parseDate(set.lastSyncedAt),
  }
}

export function serializeStudySets(studySets: StudySet[]): string {
  return JSON.stringify(
    studySets.map((set) => ({
      ...set,
      createdAt: set.createdAt.toISOString(),
      lastStudied: set.lastStudied?.toISOString(),
      cards: set.cards.map((card) => ({
        ...card,
        lastReviewed: card.lastReviewed?.toISOString(),
        dueDate: card.dueDate.toISOString(),
      })),
    })),
    null,
    2
  )
}

export function deserializeStudySets(raw: string): StudySet[] {
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('Expected an array of study sets')
  }

  return parsed.map(normalizeStudySetPayload)
}

export function normalizeStudySets(sets: unknown): StudySet[] {
  if (!Array.isArray(sets)) return []
  return sets.map(normalizeStudySetPayload)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
