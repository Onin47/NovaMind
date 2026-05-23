'use client'

import { useState, useMemo } from 'react'
import { 
  ChevronLeft, 
  Check, 
  X, 
  Trophy, 
  Zap, 
  ArrowRight, 
  RotateCcw,
  ListChecks,
  FileText,
  ToggleLeft,
  List,
  PenLine,
  Shuffle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Underline
} from 'lucide-react'
import { GlassCard, GlassButton, GlassBadge, GlassProgress, GlassInput } from '@/components/glass-ui'
import { type QuizQuestion, type QuizType, type StudySet } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

interface QuizViewProps {
  questions: QuizQuestion[]
  studySets: StudySet[]
  onBack: () => void
}

interface QuizResult {
  questionId: string
  correct: boolean
  partialScore?: number
  userAnswer: string | string[] | boolean | number
  pointsEarned: number
  maxPoints: number
}

type QuizMode = 'deck' | 'select' | 'quiz' | 'results'

function hashSeed(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function stableShuffle<T>(items: T[], seed: string): T[] {
  const seedValue = hashSeed(seed)
  return [...items]
    .map((item, index) => ({ item, order: hashSeed(`${seedValue}:${index}:${JSON.stringify(item)}`) }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item)
}

const quizTypeInfo: Record<QuizType, { label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }> = {
  'multiple-choice': { 
    label: 'Multiple Choice', 
    icon: ListChecks, 
    description: 'Select the correct answer from options',
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  'identification': { 
    label: 'Identification', 
    icon: FileText, 
    description: 'Type the correct answer',
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  'modified-true-false': { 
    label: 'Modified True/False', 
    icon: ToggleLeft, 
    description: 'Determine if true, and correct if false',
    color: 'from-orange-500/20 to-amber-500/20'
  },
  'enumeration': { 
    label: 'Enumeration', 
    icon: List, 
    description: 'List all required items',
    color: 'from-violet-500/20 to-indigo-500/20'
  },
  'essay': { 
    label: 'Essay', 
    icon: PenLine, 
    description: 'Write a detailed response',
    color: 'from-rose-500/20 to-pink-500/20'
  },
  'fill-in-the-blank': {
    label: 'Fill in the Blank',
    icon: Underline,
    description: 'Complete the missing word in a sentence',
    color: 'from-sky-500/20 to-blue-500/20'
  },
}

// Generate questions from a flashcard deck
function generateQuestionsFromDeck(deck: StudySet, types: QuizType[]): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  deck.cards.forEach((card, idx) => {
    types.forEach(type => {
      const base = { id: `${deck.id}-${card.id}-${type}`, explanation: `Answer: ${card.back}`, points: type === 'essay' ? 10 : type === 'enumeration' ? 4 : 3 }
      if (type === 'multiple-choice') {
        const wrongAnswers = stableShuffle(
          deck.cards.filter((_, i) => i !== idx).map(c => c.back),
          `${deck.id}:${card.id}:${type}:wrong`
        ).slice(0, 3)
        const opts = stableShuffle(
          [...wrongAnswers, card.back],
          `${deck.id}:${card.id}:${type}:options`
        )
        questions.push({ ...base, type, question: card.front, options: opts, correctAnswer: opts.indexOf(card.back), points: 2 })
      } else if (type === 'identification') {
        questions.push({ ...base, type, question: card.front, correctText: card.back, acceptableAnswers: [card.back.toLowerCase(), card.back.toLowerCase().trim()], points: 3 })
      } else if (type === 'fill-in-the-blank') {
        const words = card.back.split(/\s+/)
        const keyWordIdx = Math.floor(words.length / 2)
        const blankAnswer = words[keyWordIdx]
        const blanked = words.map((w, i) => i === keyWordIdx ? '____' : w).join(' ')
        questions.push({ ...base, type, question: card.front, blankedText: blanked, blankAnswer, points: 2 })
      } else if (type === 'modified-true-false') {
        questions.push({ ...base, type, question: 'Evaluate the statement:', statement: card.back, isTrue: true, points: 3 })
      } else if (type === 'enumeration') {
        const items = card.back.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
        if (items.length >= 2) questions.push({ ...base, type, question: card.front, items, itemCount: Math.min(items.length, 3), points: 4 })
      } else if (type === 'essay') {
        questions.push({ ...base, type, question: `Explain: ${card.front}`, rubric: `Your answer should mention: ${card.back}`, sampleAnswer: card.back, minWords: 20, points: 10 })
      }
    })
  })
  return stableShuffle(questions, `${deck.id}:${types.join(',')}`)
}

export function QuizView({ questions, studySets, onBack }: QuizViewProps) {
  const [mode, setMode] = useState<QuizMode>('deck')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])

  // Current question state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [blankAnswer, setBlankAnswer] = useState('')
  const [tfAnswer, setTfAnswer] = useState<'true' | 'false' | null>(null)
  const [tfCorrection, setTfCorrection] = useState('')
  const [enumAnswers, setEnumAnswers] = useState<string[]>([])
  const [essayAnswer, setEssayAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)

  const selectedDeck = selectedDeckId ? studySets.find(s => s.id === selectedDeckId) : null

  // Use deck-generated questions OR sample questions
  const activeQuestions = useMemo(() => {
    if (selectedDeckId === '__sample__') {
      if (selectedTypes.length === 0) return []
      return stableShuffle(
        questions.filter(q => selectedTypes.includes(q.type)),
        `sample:${selectedTypes.join(',')}`
      )
    }
    if (selectedDeck && selectedTypes.length > 0) {
      return generateQuestionsFromDeck(selectedDeck, selectedTypes)
    }
    return []
  }, [selectedDeckId, selectedDeck, selectedTypes, questions])

  const currentQuestion = activeQuestions[currentIndex]
  const progress = activeQuestions.length > 0 ? ((currentIndex + 1) / activeQuestions.length) * 100 : 0

  const handleTypeToggle = (type: QuizType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSelectAll = () => {
    const allTypes: QuizType[] = ['multiple-choice', 'identification', 'modified-true-false', 'enumeration', 'essay', 'fill-in-the-blank']
    setSelectedTypes(allTypes)
  }

  const handleStartQuiz = () => {
    if (selectedTypes.length === 0 || !selectedDeckId) return
    setMode('quiz')
    setCurrentIndex(0)
    setResults([])
    resetQuestionState()
  }

  const resetQuestionState = () => {
    setSelectedAnswer(null)
    setTextAnswer('')
    setBlankAnswer('')
    setTfAnswer(null)
    setTfCorrection('')
    setEnumAnswers([])
    setEssayAnswer('')
    setShowResult(false)
  }

  const checkAnswer = (): QuizResult => {
    const q = currentQuestion
    let correct = false
    let partialScore = 0
    let userAnswer: string | string[] | boolean | number = ''
    let pointsEarned = 0

    switch (q.type) {
      case 'multiple-choice':
        correct = selectedAnswer === q.correctAnswer
        userAnswer = selectedAnswer ?? -1
        pointsEarned = correct ? q.points : 0
        break

      case 'fill-in-the-blank':
        correct = blankAnswer.toLowerCase().trim() === (q.blankAnswer || '').toLowerCase().trim()
        userAnswer = blankAnswer
        pointsEarned = correct ? q.points : 0
        break

      case 'identification':
        const normalizedAnswer = textAnswer.toLowerCase().trim()
        correct = q.acceptableAnswers?.some(ans => ans.toLowerCase() === normalizedAnswer) || false
        userAnswer = textAnswer
        pointsEarned = correct ? q.points : 0
        break

      case 'modified-true-false':
        if (q.isTrue) {
          correct = tfAnswer === 'true'
          pointsEarned = correct ? q.points : 0
        } else {
          const answeredFalse = tfAnswer === 'false'
          const correctionCorrect = tfCorrection.toLowerCase().includes(q.correction?.toLowerCase() || '')
          if (answeredFalse && correctionCorrect) {
            correct = true
            pointsEarned = q.points
          } else if (answeredFalse) {
            partialScore = Math.floor(q.points / 2)
            pointsEarned = partialScore
          }
        }
        userAnswer = tfAnswer === 'true'
        break

      case 'enumeration':
        const matchedItems = enumAnswers.filter(ans => 
          q.items?.some(item => item.toLowerCase() === ans.toLowerCase().trim())
        )
        const uniqueMatched = [...new Set(matchedItems.map(m => m.toLowerCase().trim()))]
        partialScore = Math.min(uniqueMatched.length, q.itemCount || 0)
        correct = partialScore === q.itemCount
        pointsEarned = Math.round((partialScore / (q.itemCount || 1)) * q.points)
        userAnswer = enumAnswers
        break

      case 'essay':
        // Essay is always "correct" but graded manually or by word count
        const wordCount = essayAnswer.trim().split(/\s+/).filter(w => w.length > 0).length
        const meetsMinWords = wordCount >= (q.minWords || 0)
        correct = meetsMinWords
        pointsEarned = meetsMinWords ? Math.floor(q.points * 0.7) : Math.floor(q.points * 0.3)
        userAnswer = essayAnswer
        partialScore = wordCount
        break
    }

    return {
      questionId: q.id,
      correct,
      partialScore,
      userAnswer,
      pointsEarned,
      maxPoints: q.points
    }
  }

  const handleCheckAnswer = () => {
    const result = checkAnswer()
    setResults(prev => [...prev, result])
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentIndex === activeQuestions.length - 1) {
      setMode('results')
    } else {
      setCurrentIndex(prev => prev + 1)
      resetQuestionState()
    }
  }

  const handleRestart = () => {
    setMode('deck')
    setSelectedDeckId(null)
    setSelectedTypes([])
    setCurrentIndex(0)
    setResults([])
    resetQuestionState()
  }

  const totalPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0)
  const maxPoints = results.reduce((sum, r) => sum + r.maxPoints, 0)
  const scorePercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0
  const correctCount = results.filter(r => r.correct).length

  // STEP 1: Deck Selection Screen
  if (mode === 'deck') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Practice Quiz</h1>
            <p className="text-sm text-muted-foreground">Step 1 of 2 — Choose a deck to quiz from</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sample built-in questions */}
          <button
            onClick={() => { setSelectedDeckId('__sample__'); setMode('select') }}
            className={cn('p-5 rounded-2xl text-left border transition-all bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/30 hover:border-primary/60 ios-haptic-scale')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-white mb-1">Built-in Questions</h3>
            <p className="text-xs text-muted-foreground">Biology sample questions across all types</p>
            <GlassBadge className="mt-3 text-xs">{questions.length} questions</GlassBadge>
          </button>

          {/* User's study decks */}
          {studySets.map(deck => (
            <button
              key={deck.id}
              onClick={() => { setSelectedDeckId(deck.id); setMode('select') }}
              className={cn('p-5 rounded-2xl text-left border transition-all bg-gradient-to-br border-white/10 hover:border-primary/40 hover:bg-white/5 ios-haptic-scale', deck.color)}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1 truncate">{deck.title}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{deck.description}</p>
              <GlassBadge className="text-xs">{deck.cards.length} cards</GlassBadge>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // STEP 2: Quiz Type Selection Screen
  if (mode === 'select') {
    const availableTypes = selectedDeckId === '__sample__'
      ? [...new Set(questions.map(q => q.type))]
      : (Object.keys(quizTypeInfo) as QuizType[])

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="icon" onClick={() => setMode('deck')}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Practice Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Step 2 of 2 — Choose quiz types for &quot;{selectedDeckId === '__sample__' ? 'Built-in Questions' : (selectedDeck?.title ?? '')}&quot;
            </p>
          </div>
        </div>

        <GlassCard className="p-4 sm:p-6" variant="elevated">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Select Quiz Types</h2>
              <p className="text-sm text-muted-foreground">
                Pick one or more quiz formats to practice
              </p>
            </div>
            <div className="flex gap-2">
              <GlassButton size="sm" onClick={handleSelectAll} className="gap-2">
                <Shuffle className="w-4 h-4" />
                Select All
              </GlassButton>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {(Object.keys(quizTypeInfo) as QuizType[]).map((type) => {
              const info = quizTypeInfo[type]
              const Icon = info.icon
              const isSelected = selectedTypes.includes(type)
              const isAvailable = selectedDeckId === '__sample__' ? availableTypes.includes(type) : true
              const count = selectedDeckId === '__sample__'
                ? questions.filter(q => q.type === type).length
                : (selectedDeck?.cards.length ?? 0)

              return (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={cn(
                    'p-4 rounded-xl text-left transition-all border relative overflow-hidden ios-haptic-scale',
                    !isSelected && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                    isSelected && 'bg-gradient-to-br border-primary/50',
                    isSelected && info.color,
                    !isAvailable && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isSelected ? 'bg-primary/20' : 'bg-white/10'
                    )}>
                      <Icon className={cn('w-5 h-5', isSelected && 'text-primary')} />
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{info.label}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                  <GlassBadge variant={isAvailable ? 'default' : 'outline'} className="text-xs">
                    {count} question{count !== 1 ? 's' : ''}
                  </GlassBadge>
                </button>
              )
            })}
          </div>
        </GlassCard>

        {selectedTypes.length > 0 && (
          <GlassCard className="p-4 sm:p-6" variant="elevated">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Ready to Start</h3>
                <p className="text-sm text-muted-foreground">
                  {activeQuestions.length} question{activeQuestions.length !== 1 ? 's' : ''} selected across {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <GlassButton variant="primary" size="lg" onClick={handleStartQuiz} className="gap-2 w-full sm:w-auto">
                Start Quiz
                <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </div>
    )
  }

  // Results Screen
  if (mode === 'results') {
    return (
      <div className="min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <GlassCard className="p-6 sm:p-8 max-w-lg w-full text-center" variant="elevated">
          <div className={cn(
            'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-6',
            scorePercentage >= 80 
              ? 'bg-emerald-500/20' 
              : scorePercentage >= 60 
              ? 'bg-amber-500/20' 
              : 'bg-red-500/20'
          )}>
            <Trophy className={cn(
              'w-10 h-10 sm:w-12 sm:h-12',
              scorePercentage >= 80 
                ? 'text-emerald-400' 
                : scorePercentage >= 60 
                ? 'text-amber-400' 
                : 'text-red-400'
            )} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {scorePercentage >= 80 ? 'Excellent!' : scorePercentage >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8">
            You earned {totalPoints} out of {maxPoints} points
          </p>

          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${scorePercentage * 2.51} 251`}
                strokeLinecap="round"
                className={cn(
                  scorePercentage >= 80 
                    ? 'text-emerald-400' 
                    : scorePercentage >= 60 
                    ? 'text-amber-400' 
                    : 'text-red-400'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold">{scorePercentage}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <GlassCard className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">{correctCount}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </GlassCard>
            <GlassCard className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-red-400">{activeQuestions.length - correctCount}</p>
              <p className="text-xs text-muted-foreground">Incorrect</p>
            </GlassCard>
            <GlassCard className="p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </GlassCard>
          </div>

          {/* Breakdown by type */}
          <div className="text-left mb-6 sm:mb-8">
            <h3 className="font-semibold mb-3 text-sm">Score Breakdown</h3>
            <div className="space-y-2">
              {selectedTypes.map(type => {
                const typeResults = results.filter(r => 
                  activeQuestions.find(q => q.id === r.questionId)?.type === type
                )
                const typePoints = typeResults.reduce((sum, r) => sum + r.pointsEarned, 0)
                const typeMaxPoints = typeResults.reduce((sum, r) => sum + r.maxPoints, 0)
                const info = quizTypeInfo[type]
                const Icon = info.icon
                
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span>{info.label}</span>
                    </div>
                    <span className="font-medium">{typePoints}/{typeMaxPoints}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <GlassButton className="flex-1" onClick={handleRestart}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </GlassButton>
            <GlassButton variant="primary" className="flex-1" onClick={onBack}>
              Done
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    )
  }

  // Quiz Screen
  if (!currentQuestion) return null

  const typeInfo = quizTypeInfo[currentQuestion.type]
  const TypeIcon = typeInfo.icon

  const isAnswered = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice': return selectedAnswer !== null
      case 'identification': return textAnswer.trim().length > 0
      case 'fill-in-the-blank': return blankAnswer.trim().length > 0
      case 'modified-true-false': return tfAnswer !== null && (tfAnswer === 'true' || tfCorrection.trim().length > 0)
      case 'enumeration': return enumAnswers.filter(a => a.trim()).length > 0
      case 'essay': return essayAnswer.trim().length > 0
      default: return false
    }
  }

  const currentResult = results.find(r => r.questionId === currentQuestion.id)
  const isCorrect = currentResult?.correct

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Practice Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {activeQuestions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <GlassBadge variant="success" className="text-xs sm:text-sm">
            <Zap className="w-3 h-3 mr-1" />
            {totalPoints} pts
          </GlassBadge>
        </div>
      </div>

      {/* Progress */}
      <GlassProgress value={progress} />

      {/* Question Card */}
      <GlassCard className="p-4 sm:p-6 md:p-8" variant="elevated">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <GlassBadge className={cn('bg-gradient-to-r', typeInfo.color)}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeInfo.label}
            </GlassBadge>
            <GlassBadge variant="outline">{currentQuestion.points} pts</GlassBadge>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-pretty">
            {currentQuestion.question}
          </h2>
          {currentQuestion.type === 'modified-true-false' && (
            <p className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 italic">
              &quot;{currentQuestion.statement}&quot;
            </p>
          )}
        </div>

        {/* Answer Input based on type */}
        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrectAnswer = currentQuestion.correctAnswer === index
              
              return (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    'w-full p-3 sm:p-4 rounded-xl text-left transition-all flex items-center gap-3 sm:gap-4',
                    'border backdrop-blur-xl',
                    !showResult && !isSelected && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20',
                    !showResult && isSelected && 'bg-primary/20 border-primary/50',
                    showResult && isCorrectAnswer && 'bg-emerald-500/20 border-emerald-500/50',
                    showResult && isSelected && !isCorrectAnswer && 'bg-red-500/20 border-red-500/50',
                    showResult && !isSelected && !isCorrectAnswer && 'opacity-50'
                  )}
                >
                  <span className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-medium shrink-0',
                    !showResult && !isSelected && 'bg-white/10',
                    !showResult && isSelected && 'bg-primary text-primary-foreground',
                    showResult && isCorrectAnswer && 'bg-emerald-500 text-white',
                    showResult && isSelected && !isCorrectAnswer && 'bg-red-500 text-white',
                    showResult && !isSelected && !isCorrectAnswer && 'bg-white/10'
                  )}>
                    {showResult && isCorrectAnswer ? (
                      <Check className="w-4 h-4" />
                    ) : showResult && isSelected && !isCorrectAnswer ? (
                      <X className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </span>
                  <span className="font-medium text-sm sm:text-base">{option}</span>
                </button>
              )
            })}
          </div>
        )}

        {currentQuestion.type === 'identification' && (
          <div className="space-y-4">
            <GlassInput
              placeholder="Type your answer here..."
              value={textAnswer}
              onChange={(e) => !showResult && setTextAnswer(e.target.value)}
              disabled={showResult}
              className={cn(
                'text-base sm:text-lg',
                showResult && isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showResult && !isCorrect && 'border-red-500/50 bg-red-500/10'
              )}
            />
            {showResult && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Correct answer:</span>
                <span className="font-medium text-emerald-400">{currentQuestion.correctText}</span>
              </div>
            )}
          </div>
        )}

        {currentQuestion.type === 'fill-in-the-blank' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-lg sm:text-xl leading-relaxed text-center font-medium">
              {currentQuestion.blankedText}
            </div>
            <GlassInput
              placeholder="Type the missing word..."
              value={blankAnswer}
              onChange={(e) => !showResult && setBlankAnswer(e.target.value)}
              disabled={showResult}
              className={cn(
                'text-base sm:text-lg text-center',
                showResult && isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showResult && !isCorrect && 'border-red-500/50 bg-red-500/10'
              )}
            />
            {showResult && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">Correct answer:</span>
                <span className="font-medium text-emerald-400">{currentQuestion.blankAnswer}</span>
              </div>
            )}
          </div>
        )}

        {currentQuestion.type === 'modified-true-false' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => !showResult && setTfAnswer('true')}
                disabled={showResult}
                className={cn(
                  'p-3 sm:p-4 rounded-xl transition-all border flex items-center justify-center gap-2',
                  !showResult && tfAnswer !== 'true' && 'bg-white/5 border-white/10 hover:bg-white/10',
                  !showResult && tfAnswer === 'true' && 'bg-emerald-500/20 border-emerald-500/50',
                  showResult && currentQuestion.isTrue && 'bg-emerald-500/20 border-emerald-500/50',
                  showResult && !currentQuestion.isTrue && tfAnswer === 'true' && 'bg-red-500/20 border-red-500/50'
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">True</span>
              </button>
              <button
                onClick={() => !showResult && setTfAnswer('false')}
                disabled={showResult}
                className={cn(
                  'p-3 sm:p-4 rounded-xl transition-all border flex items-center justify-center gap-2',
                  !showResult && tfAnswer !== 'false' && 'bg-white/5 border-white/10 hover:bg-white/10',
                  !showResult && tfAnswer === 'false' && 'bg-orange-500/20 border-orange-500/50',
                  showResult && !currentQuestion.isTrue && 'bg-emerald-500/20 border-emerald-500/50'
                )}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-medium">False</span>
              </button>
            </div>
            
            {tfAnswer === 'false' && !showResult && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  What makes this statement false? Provide the correction:
                </label>
                <GlassInput
                  placeholder="Enter the correction..."
                  value={tfCorrection}
                  onChange={(e) => setTfCorrection(e.target.value)}
                />
              </div>
            )}

            {showResult && !currentQuestion.isTrue && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-1">Correction needed:</p>
                <p className="font-medium text-emerald-400">{currentQuestion.correction}</p>
              </div>
            )}
          </div>
        )}

        {currentQuestion.type === 'enumeration' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter {currentQuestion.itemCount} item{(currentQuestion.itemCount ?? 0) > 1 ? 's' : ''}:
            </p>
            {Array.from({ length: currentQuestion.itemCount || 1 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-sm shrink-0">
                  {index + 1}
                </span>
                <GlassInput
                  placeholder={`Item ${index + 1}`}
                  value={enumAnswers[index] || ''}
                  onChange={(e) => {
                    if (showResult) return
                    const newAnswers = [...enumAnswers]
                    newAnswers[index] = e.target.value
                    setEnumAnswers(newAnswers)
                  }}
                  disabled={showResult}
                  className={cn(
                    showResult && currentQuestion.items?.some(item => 
                      item.toLowerCase() === (enumAnswers[index] || '').toLowerCase().trim()
                    ) && 'border-emerald-500/50 bg-emerald-500/10',
                    showResult && !currentQuestion.items?.some(item => 
                      item.toLowerCase() === (enumAnswers[index] || '').toLowerCase().trim()
                    ) && 'border-red-500/50 bg-red-500/10'
                  )}
                />
              </div>
            ))}
            {showResult && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-2">Acceptable answers:</p>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.items?.slice(0, currentQuestion.itemCount).map((item, i) => (
                    <GlassBadge key={i} variant="success">{item}</GlassBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentQuestion.type === 'essay' && (
          <div className="space-y-4">
            {currentQuestion.rubric && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Rubric</p>
                    <p className="text-sm text-muted-foreground">{currentQuestion.rubric}</p>
                  </div>
                </div>
              </div>
            )}
            <Textarea
              placeholder="Write your essay response here..."
              value={essayAnswer}
              onChange={(e) => !showResult && setEssayAnswer(e.target.value)}
              disabled={showResult}
              className={cn(
                'min-h-[150px] sm:min-h-[200px] bg-white/5 border-white/10 resize-none',
                showResult && 'border-amber-500/50 bg-amber-500/10'
              )}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Word count: {essayAnswer.trim().split(/\s+/).filter(w => w.length > 0).length}
                {currentQuestion.minWords && ` / ${currentQuestion.minWords} minimum`}
              </span>
              {showResult && (
                <GlassBadge variant="warning">Graded on completion</GlassBadge>
              )}
            </div>
            {showResult && currentQuestion.sampleAnswer && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-medium mb-2">Sample Answer:</p>
                <p className="text-sm text-muted-foreground">{currentQuestion.sampleAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {showResult && (
          <GlassCard 
            className="mt-6 p-4" 
            gradient={isCorrect ? 'from-emerald-500/10 to-transparent' : 'from-amber-500/10 to-transparent'}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                isCorrect ? 'bg-emerald-500/20' : 'bg-amber-500/20'
              )}>
                {isCorrect ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <X className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <p className={cn(
                  'font-medium mb-1',
                  isCorrect ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {isCorrect ? 'Correct!' : currentQuestion.type === 'essay' ? 'Submitted' : 'Not quite right'} 
                  <span className="text-muted-foreground font-normal ml-2">
                    +{currentResult?.pointsEarned} pts
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </GlassCard>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!showResult ? (
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleCheckAnswer}
            disabled={!isAnswered()}
            className="gap-2 w-full sm:w-auto"
          >
            Check Answer
            <Check className="w-4 h-4" />
          </GlassButton>
        ) : (
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleNext}
            className="gap-2 w-full sm:w-auto"
          >
            {currentIndex === activeQuestions.length - 1 ? 'See Results' : 'Next Question'}
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        )}
      </div>
    </div>
  )
}
