'use client'

import { Clock, Flame, BookOpen, Target, ChevronRight, Sparkles, Zap, Trophy } from 'lucide-react'
import { GlassCard, GlassBadge, GlassButton, GlassCircularProgress } from '@/components/glass-ui'
import { type StudySet } from '@/lib/store'
import { StudyAudio } from '@/lib/audio'

interface DashboardViewProps {
  studySets: StudySet[]
  onViewSet: (setId: string) => void
  onStartQuiz: () => void
  onOpenAI: () => void
  onViewLibrary?: () => void
}

export function DashboardView({ studySets, onViewSet, onStartQuiz, onOpenAI }: DashboardViewProps) {
  const totalCards = studySets.reduce((acc, set) => acc + set.cardCount, 0)
  const avgProgress = studySets.length > 0 
    ? Math.round(studySets.reduce((acc, set) => acc + set.progress, 0) / studySets.length)
    : 0
  const dueToday = studySets.reduce(
    (acc, set) => acc + set.cards.filter((c) => c.dueDate.getTime() <= Date.now()).length,
    0
  )

  const recentSets = [...studySets]
    .sort((a, b) => (b.lastStudied?.getTime() || 0) - (a.lastStudied?.getTime() || 0))
    .slice(0, 3)

  const handleSetClick = (setId: string) => {
    onViewSet(setId)
    StudyAudio.playTransition()
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden">
        <GlassCard className="p-5 sm:p-6 md:p-8 relative border border-white/10" variant="elevated" gradient="from-primary/20 via-transparent to-transparent">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GlassBadge variant="info">
                  <Flame className="w-3.5 h-3.5 mr-1 text-blue-300 animate-pulse" />
                  7 Day Active Recall Streak
                </GlassBadge>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 text-balance text-white bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
                Welcome back, Scholar!
              </h1>
              <p className="text-muted-foreground max-w-md text-pretty text-xs sm:text-sm leading-relaxed font-medium">
                You are maintaining fantastic learning habits. Keep the momentum going with your active spaced recall goals today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0">
              <GlassButton variant="primary" className="gap-2 justify-center text-xs" onClick={() => { onOpenAI(); StudyAudio.playTransition(); }}>
                <Sparkles className="w-4 h-4 text-white" />
                Socratic AI Chat
              </GlassButton>
              <GlassButton className="gap-2 justify-center text-xs" onClick={() => { onStartQuiz(); StudyAudio.playTransition(); }}>
                <Zap className="w-4 h-4 text-primary" />
                Practice Review Quiz
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard className="p-4 sm:p-5 border border-white/5" hover spotlight>
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+12 this week</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{studySets.length}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Active Study Decks</p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/5" hover spotlight>
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.1)]">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-full">{avgProgress}% avg mastery</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">{totalCards}</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Flashcard Points</p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/5" hover spotlight>
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.1)]">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full">Focused Sessions</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">4.2h</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Total Study Hours</p>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 border border-white/5" hover spotlight>
          <div className="flex items-start justify-between mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-[0_4px_12px_rgba(168,85,247,0.1)]">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded-full">Top: 14 days</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">7</p>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">Current Habit Streak</p>
        </GlassCard>
      </div>

      {/* Continue Studying (Bento-style Radial Cards) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Recent Spaced Decks
          </h2>
          <GlassButton variant="ghost" size="sm" className="gap-1 text-muted-foreground text-xs" onClick={() => { StudyAudio.playTransition(); }}>
            View Library <ChevronRight className="w-4 h-4" />
          </GlassButton>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentSets.map((set) => (
            <GlassCard 
              key={set.id} 
              className="p-5 cursor-pointer group border border-white/5"
              hover
              gradient={set.color}
              onClick={() => handleSetClick(set.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <GlassBadge>{set.subject}</GlassBadge>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {set.lastStudied ? set.lastStudied.toLocaleDateString() : 'New Deck'}
                </span>
              </div>
              
              <div className="flex gap-4 items-center justify-between min-h-[90px]">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg mb-1 group-hover:text-primary transition-colors truncate text-white">
                    {set.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {set.description || "Active recall flashcard set designed for custom learning cycles."}
                  </p>
                  <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    {set.cardCount} cards
                  </span>
                </div>
                
                {/* Visual Radial SVG Widget */}
                <div className="shrink-0">
                  <GlassCircularProgress value={set.progress} size={68} strokeWidth={6}>
                    <span className="text-[11px] font-extrabold text-white">{set.progress}%</span>
                  </GlassCircularProgress>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* AI Insights Card */}
      <GlassCard className="p-6 border border-purple-500/20" variant="elevated" gradient="from-purple-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-chart-2 flex items-center justify-center shrink-0 shadow-lg animate-float">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white mb-1">Nova&apos;s Active Recall Advice</h3>
            <p className="text-muted-foreground text-xs sm:text-sm text-pretty leading-relaxed">
              Based on your study analytics, your active recall retention is optimal in the morning. 
              Try reviewing your due decks before 10:00 AM. 
              Your spaced repetition queue has **{dueToday}** deck review{dueToday === 1 ? '' : 's'} scheduled for today.
            </p>
            <div className="flex gap-3 mt-4">
              <GlassButton variant="primary" size="sm" className="text-xs" onClick={() => { onOpenAI(); StudyAudio.playTransition(); }}>
                Consult Nova AI
              </GlassButton>
              <GlassButton size="sm" className="text-xs" onClick={() => { onStartQuiz(); StudyAudio.playTransition(); }}>
                Review Due Cards ({dueToday})
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
