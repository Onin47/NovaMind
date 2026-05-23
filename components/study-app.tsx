'use client'

import { useState } from 'react'
import { useStudyApp } from '@/hooks/use-study-app'
import { Navigation } from '@/components/navigation'
import { DashboardView } from '@/components/views/dashboard'
import { LibraryView } from '@/components/views/library'
import { AITutorView } from '@/components/views/ai-tutor'
import { QuizView } from '@/components/views/quiz'
import { CreateSetView } from '@/components/views/create-set'
import { FlashcardStudyView } from '@/components/views/flashcard-study'
import { LandingPage } from '@/components/landing-page'

type View = 'dashboard' | 'library' | 'ai-tutor' | 'quiz' | 'create'

export function StudyApp() {
  const [showLanding, setShowLanding] = useState(true)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [studyingSetId, setStudyingSetId] = useState<string | null>(null)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)

  const {
    studySets,
    quizQuestions,
    aiMessages,
    isAiTyping,
    aiTutorMode,
    setAiTutorMode,
    addStudySet,
    updateStudySet,
    deleteStudySet,
    updateCardMastery,
    sendAiMessage,
  } = useStudyApp()

  const studyingSet = studyingSetId ? studySets.find((s) => s.id === studyingSetId) : null

  const handleStartStudy = (setId: string) => {
    setStudyingSetId(setId)
  }

  const handleEditSet = (setId: string) => {
    setEditingSetId(setId)
    setCurrentView('create')
  }

  const handleEndStudy = () => {
    setStudyingSetId(null)
  }

  const handleUpdateMastery = (cardId: string, correct: boolean) => {
    if (studyingSetId) {
      updateCardMastery(studyingSetId, cardId, correct)
    }
  }

  // Render the premium 3D landing page by default
  if (showLanding) {
    return <LandingPage onLaunch={() => setShowLanding(false)} />
  }

  // If studying a set, show the flashcard view
  if (studyingSet) {
    return (
      <div className="min-h-screen bg-background">
        {/* Background Effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-chart-2/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chart-3/5 rounded-full blur-[120px]" />
        </div>

        <main className="p-4 lg:pl-80 lg:p-8 pt-24 lg:pt-8">
          <FlashcardStudyView
            studySet={studyingSet}
            onBack={handleEndStudy}
            onUpdateMastery={handleUpdateMastery}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-chart-2/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-chart-3/5 rounded-full blur-[120px]" />
      </div>

      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onExitToLanding={() => setShowLanding(true)}
      />

      <main className="p-4 lg:pl-80 lg:p-8 pt-24 lg:pt-8 pb-28 lg:pb-8">
        {currentView === 'dashboard' && (
          <DashboardView
            studySets={studySets}
            onViewSet={handleStartStudy}
            onStartQuiz={() => setCurrentView('quiz')}
            onOpenAI={() => setCurrentView('ai-tutor')}
          />
        )}

        {currentView === 'library' && (
          <LibraryView
            studySets={studySets}
            onViewSet={handleStartStudy}
            onDeleteSet={deleteStudySet}
            onStudySet={handleStartStudy}
            onEditSet={handleEditSet}            onImportSet={addStudySet}          />
        )}

        {currentView === 'ai-tutor' && (
          <AITutorView
            messages={aiMessages}
            isTyping={isAiTyping}
            onSendMessage={sendAiMessage}
            mode={aiTutorMode}
            onModeChange={setAiTutorMode}
          />
        )}

        {currentView === 'quiz' && (
          <QuizView
            questions={quizQuestions}
            studySets={studySets}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'create' && (
          <CreateSetView
            onBack={() => { setCurrentView('library'); setEditingSetId(null) }}
            onSave={addStudySet}
            initialSet={editingSetId ? studySets.find(s => s.id === editingSetId) ?? undefined : undefined}
            onUpdate={(id, updates) => updateStudySet(id, updates)}
          />
        )}
      </main>
    </div>
  )
}
