'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Lightbulb, Shuffle, Keyboard } from 'lucide-react'
import { GlassCard, GlassButton, GlassBadge, GlassProgress, GlassCircularProgress } from '@/components/glass-ui'
import { type StudySet, type Flashcard } from '@/lib/store'
import { StudyAudio } from '@/lib/audio'
import { cn } from '@/lib/utils'

interface FlashcardStudyViewProps {
  studySet: StudySet
  onBack: () => void
  onUpdateMastery: (cardId: string, correct: boolean) => void
}

function getDueCardIds(cards: Flashcard[]): string[] {
  const now = Date.now()
  return cards.filter((c) => c.dueDate.getTime() <= now).map((c) => c.id)
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function FlashcardStudyView({ studySet, onBack, onUpdateMastery }: FlashcardStudyViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [cardsStudied, setCardsStudied] = useState<Set<string>>(new Set())
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionCardIds, setSessionCardIds] = useState<string[]>(() => getDueCardIds(studySet.cards))
  const [showShortcutsHUD, setShowShortcutsHUD] = useState(true)

  const sessionCards = sessionCardIds
    .map((id) => studySet.cards.find((c) => c.id === id))
    .filter(Boolean) as Flashcard[]

  const currentCard = sessionCards[currentIndex]

  // Play flip sound when card state changes
  const handleFlipCard = useCallback(() => {
    setIsFlipped((prev) => !prev)
    StudyAudio.playFlip()
  }, [])

  const handleNext = useCallback(() => {
    setIsFlipped(false)
    setShowHint(false)
    setCurrentIndex((prev) => Math.min(prev + 1, sessionCards.length - 1))
  }, [sessionCards.length])

  const handlePrev = useCallback(() => {
    setIsFlipped(false)
    setShowHint(false)
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Answer scoring logic with audio synthesis feedback
  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!currentCard) return
      onUpdateMastery(currentCard.id, correct)
      setCardsStudied((prev) => new Set([...prev, currentCard.id]))
      
      if (correct) {
        setCorrectCount((prev) => prev + 1)
        StudyAudio.playCorrect()
      } else {
        StudyAudio.playIncorrect()
      }

      // Play victory success sweep if this was the last card graded
      const isFinished = currentIndex === sessionCards.length - 1
      if (isFinished) {
        setTimeout(() => {
          StudyAudio.playSuccess()
        }, 350)
      }

      handleNext()
    },
    [currentCard, currentIndex, onUpdateMastery, sessionCards.length, handleNext],
  )

  const handleShuffle = () => {
    setSessionCardIds((prev) => shuffleArray(prev))
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowHint(false)
    StudyAudio.playTransition()
  }

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if student is active in an input fields (search / AI chat)
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      const key = e.key.toLowerCase()

      if (e.key === ' ') {
        e.preventDefault()
        handleFlipCard()
      } else if (e.key === '1') {
        if (isFlipped) {
          handleAnswer(false)
        }
      } else if (e.key === '2') {
        if (isFlipped) {
          handleAnswer(true)
        }
      } else if (key === 'h') {
        if (!isFlipped) {
          setShowHint((prev) => !prev)
          StudyAudio.playHover()
        }
      } else if (e.key === 'ArrowRight') {
        if (!isFlipped && currentIndex < sessionCards.length - 1) {
          handleNext()
          StudyAudio.playFlip()
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isFlipped && currentIndex > 0) {
          handlePrev()
          StudyAudio.playFlip()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isFlipped, currentIndex, sessionCards.length, handleAnswer, handleFlipCard, handleNext, handlePrev])

  if (sessionCards.length === 0) {
    return (
      <div className="min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <GlassCard className="p-8 max-w-md w-full text-center" variant="elevated">
          <h2 className="text-2xl font-bold mb-2">No cards due yet</h2>
          <p className="text-muted-foreground mb-6">
            Your spaced repetition schedule doesn&apos;t have any reviews due right now.
          </p>
          <div className="flex gap-3">
            <GlassButton className="flex-1" onClick={onBack}>
              Back
            </GlassButton>
            <GlassButton
              variant="primary"
              className="flex-1"
              onClick={() => {
                setSessionCardIds(studySet.cards.map((c) => c.id))
                StudyAudio.playTransition()
              }}
            >
              Study All
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    )
  }

  const progress = (currentIndex / sessionCards.length) * 100
  const accuracy = cardsStudied.size > 0 ? Math.round((correctCount / cardsStudied.size) * 100) : 0
  const isComplete = currentIndex === sessionCards.length - 1 && cardsStudied.has(currentCard.id)
  
  const masteryColors = {
    new: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    learning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    mastered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  }

  if (isComplete) {
    return (
      <div className="min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <GlassCard className="p-8 max-w-md w-full text-center flex flex-col items-center border border-purple-500/20" variant="elevated" gradient="from-purple-500/10 to-transparent animate-float">
          
          {/* Radial Accuracy Ring */}
          <div className="relative mb-6">
            <GlassCircularProgress value={accuracy} size={110} strokeWidth={8}>
              <span className="text-2xl font-extrabold text-white">{accuracy}%</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Accuracy</span>
            </GlassCircularProgress>
          </div>

          <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Superb review work in **{studySet.title}** Subject.
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <GlassCard className="p-4" variant="solid">
              <p className="text-3xl font-extrabold text-emerald-400">{correctCount}</p>
              <p className="text-xs text-muted-foreground font-semibold">Mastery Points</p>
            </GlassCard>
            <GlassCard className="p-4" variant="solid">
              <p className="text-3xl font-extrabold text-primary">{cardsStudied.size}</p>
              <p className="text-xs text-muted-foreground font-semibold">Cards Practiced</p>
            </GlassCard>
          </div>

          <div className="flex gap-3 w-full">
            <GlassButton className="flex-1 text-xs" onClick={() => {
              setCurrentIndex(0)
              setCardsStudied(new Set())
              setCorrectCount(0)
              setIsFlipped(false)
              StudyAudio.playTransition()
            }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Study Again
            </GlassButton>
            <GlassButton variant="primary" className="flex-1 text-xs" onClick={onBack}>
              Done Review
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <div>
            <h1 className="text-lg sm:text-xl font-bold line-clamp-1">{studySet.title}</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Card {currentIndex + 1} of {sessionCards.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <GlassButton variant="ghost" size="sm" onClick={() => setShowShortcutsHUD(!showShortcutsHUD)} className="gap-1.5 text-xs text-muted-foreground">
            <Keyboard className="w-4 h-4" />
            {showShortcutsHUD ? "Hide Keys" : "Shortcuts"}
          </GlassButton>
          <GlassButton variant="ghost" size="icon" onClick={handleShuffle}>
            <Shuffle className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>

      {/* Progress */}
      <GlassProgress value={progress} />

      {/* Flashcard 3D perspective wrapper */}
      <div className="flex justify-center py-4 sm:py-6 px-1">
        <div
          className="relative w-full max-w-xl aspect-[4/3] sm:aspect-[3/2] cursor-pointer perspective-1000 group"
          onClick={handleFlipCard}
        >
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-500 preserve-3d',
              isFlipped && 'rotate-y-180'
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
            }}
          >
            {/* Front of card */}
            <GlassCard
              className="absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center border border-white/15 shadow-2xl backface-hidden"
              variant="elevated"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <GlassBadge className={masteryColors[currentCard.mastery]}>
                {currentCard.mastery.toUpperCase()}
              </GlassBadge>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-center mt-6 text-white text-pretty max-w-md">
                {currentCard.front}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground absolute bottom-6 uppercase tracking-wider font-semibold select-none">
                Space or click to flip card
              </p>
            </GlassCard>

            {/* Back of card */}
            <GlassCard
              className="absolute inset-0 p-6 sm:p-8 flex flex-col items-center justify-center border border-purple-500/25 shadow-2xl"
              variant="elevated"
              gradient="from-purple-600/15 via-transparent to-transparent"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <GlassBadge variant="success" className="mb-2">ANSWER</GlassBadge>
              <p className="text-lg sm:text-xl md:text-2xl font-semibold text-center text-white text-pretty max-w-md">
                {currentCard.back}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground absolute bottom-6 uppercase tracking-wider font-semibold select-none">
                Rate your recollection difficulty below
              </p>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        {isFlipped ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 animate-fade-in">
            <GlassButton
              variant="ghost"
              size="lg"
              className="gap-2 text-red-400 hover:bg-red-500/10 border-red-500/20 w-full sm:w-auto justify-center"
              onClick={() => handleAnswer(false)}
            >
              <X className="w-5 h-5" />
              Still Learning <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded ml-1 font-mono">[1]</span>
            </GlassButton>
            <GlassButton
              variant="primary"
              size="lg"
              className="gap-2 w-full sm:w-auto justify-center shadow-lg"
              onClick={() => handleAnswer(true)}
            >
              <Check className="w-5 h-5" />
              Got It! <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1 font-mono">[2]</span>
            </GlassButton>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <GlassButton
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </GlassButton>
            
            <GlassButton
              variant="ghost"
              className="gap-2 text-amber-300 border-amber-500/20"
              onClick={() => {
                setShowHint(!showHint)
                StudyAudio.playHover()
              }}
            >
              <Lightbulb className="w-4 h-4 text-amber-300" />
              Hint <span className="text-[9px] bg-amber-500/25 px-1 py-0.5 rounded ml-0.5 font-mono">[H]</span>
            </GlassButton>

            <GlassButton
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === sessionCards.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </GlassButton>
          </div>
        )}

        {showHint && !isFlipped && (
          <GlassCard className="p-3 max-w-md text-center border-amber-500/20 animate-float" gradient="from-amber-500/10 to-transparent">
            <p className="text-xs sm:text-sm text-amber-300 font-medium">
              💡 Spaced Recall Clue: {currentCard.back.split(' ').slice(0, 3).join(' ')}...
            </p>
          </GlassCard>
        )}
      </div>

      {/* Shortcuts floating HUD */}
      {showShortcutsHUD && (
        <GlassCard className="p-3 text-center border border-white/5 shadow-lg max-w-lg mx-auto bg-black/30 backdrop-blur-md" spotlight={false}>
          <div className="flex items-center justify-center gap-4 flex-wrap text-[10px] sm:text-xs text-muted-foreground font-semibold">
            <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-white">Space</span> Flip Card</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-white">1</span> Still Learning</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-white">2</span> Got It!</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-white">H</span> Toggle Hint</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[9px] text-white">&larr; / &rarr;</span> Navigate</span>
          </div>
        </GlassCard>
      )}

      {/* Card Navigation Dots */}
      <div className="flex justify-center gap-1.5 flex-wrap max-w-md mx-auto select-none pt-2">
        {sessionCards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => {
              setCurrentIndex(index)
              setIsFlipped(false)
              setShowHint(false)
              StudyAudio.playFlip()
            }}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200 cursor-pointer',
              index === currentIndex
                ? 'bg-primary scale-150 shadow-md shadow-primary/30'
                : cardsStudied.has(card.id)
                ? 'bg-emerald-400/50'
                : 'bg-white/20 hover:bg-white/40'
            )}
          />
        ))}
      </div>
    </div>
  )
}
