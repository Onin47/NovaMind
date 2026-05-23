'use client'

import { useState } from 'react'
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  Plus,
  Home,
  Sparkles,
  Settings,
  TrendingUp,
  Menu,
  X,
  Volume2,
  VolumeX
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard, GlassButton } from '@/components/glass-ui'
import { StudyAudio } from '@/lib/audio'

type View = 'dashboard' | 'library' | 'ai-tutor' | 'quiz' | 'create'

interface NavigationProps {
  currentView: View
  onViewChange: (view: View) => void
  onExitToLanding?: () => void
}

const navItems = [
  { id: 'dashboard' as const, label: 'Home', icon: Home },
  { id: 'library' as const, label: 'Library', icon: BookOpen },
  { id: 'ai-tutor' as const, label: 'Nova AI', icon: Sparkles },
  { id: 'quiz' as const, label: 'Practice', icon: Trophy },
]

export function Navigation({ currentView, onViewChange, onExitToLanding }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [isMuted, setIsMuted] = useState<boolean>(() => StudyAudio.isMuted())
  const [volume, setVolume] = useState<number>(() => StudyAudio.getVolume())

  const handleMuteToggle = () => {
    const nextMute = !isMuted
    setIsMuted(nextMute)
    StudyAudio.setMuted(nextMute)
    if (!nextMute) {
      StudyAudio.playCorrect()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    StudyAudio.setVolume(vol)
    // Play test click sound
    StudyAudio.playHover()
  }

  const handleNavClick = (view: View) => {
    onViewChange(view)
    setMobileMenuOpen(false)
    StudyAudio.playTransition()
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col z-40">
        <GlassCard className="m-4 flex-1 flex flex-col p-4 border border-white/10" variant="elevated">
          {/* Logo */}
          <button 
            onClick={() => {
              if (onExitToLanding) onExitToLanding()
              StudyAudio.playTransition()
            }}
            className="w-full flex items-center gap-3 px-2 py-4 mb-6 hover:bg-white/5 rounded-2xl transition-all duration-250 cursor-pointer group text-left outline-none"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-md">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-primary/30 rounded-xl blur-lg -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">NovaMind</h1>
              <p className="text-xs text-muted-foreground group-hover:text-white/60 transition-colors">&larr; Exit to Landing</p>
            </div>
          </button>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl ios-spring ios-haptic-scale outline-none cursor-pointer',
                    isActive 
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_1.5px_3px_rgba(168,85,247,0.15)] font-semibold' 
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-5 h-5 transition-transform duration-300 group-hover:scale-110', isActive && 'text-primary')} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Create Button */}
          <GlassButton 
            variant="primary" 
            className="mt-4 w-full gap-2 ios-spring ios-haptic-scale text-xs"
            onClick={() => handleNavClick('create')}
          >
            <Plus className="w-4 h-4" />
            Create Study Set
          </GlassButton>

          {/* Stats Card */}
          <GlassCard className="mt-4 p-4 border border-white/5" gradient="from-primary/10 to-transparent" spotlight={false}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-white/90">Weekly Review</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold">847 cards</p>
                <p className="text-[10px] text-muted-foreground font-medium">96% active recall accuracy</p>
              </div>
              <span className="text-emerald-400 text-xs font-bold">+23%</span>
            </div>
          </GlassCard>

          {/* Settings Control Toggle */}
          <div className="mt-4 border-t border-white/5 pt-2">
            <button 
              onClick={() => {
                setShowAudioSettings(!showAudioSettings)
                StudyAudio.playFlip()
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ios-haptic-scale outline-none cursor-pointer",
                showAudioSettings ? "bg-white/5 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span>Study Settings</span>
            </button>

            {showAudioSettings && (
              <GlassCard className="mt-2 p-3 border border-white/5 space-y-3 bg-black/40 animate-fade-in" spotlight={false}>
                <div className="flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold flex items-center gap-1.5">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-primary" />}
                    Sound Effects
                  </span>
                  <button 
                    onClick={handleMuteToggle}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                      isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-primary/20 border-primary/30 text-primary"
                    )}
                  >
                    {isMuted ? "Muted" : "Active"}
                  </button>
                </div>
                
                {!isMuted && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                      <span>Volume</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        </GlassCard>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <GlassCard className="mx-4 mt-4 px-4 py-3 flex items-center justify-between border border-white/15" variant="elevated">
          <button 
            onClick={() => {
              if (onExitToLanding) onExitToLanding()
              StudyAudio.playTransition()
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">NovaMind</h1>
          </button>
          <button 
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen)
              StudyAudio.playFlip()
            }}
            className="p-2 rounded-lg hover:bg-white/10 outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </GlassCard>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-20">
          <div 
            className="absolute inset-0 bg-background/85 backdrop-blur-md"
            onClick={() => {
              setMobileMenuOpen(false)
              StudyAudio.playFlip()
            }}
          />
          <GlassCard className="relative mx-4 p-4 border border-white/15" variant="elevated">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all outline-none',
                      isActive 
                        ? 'bg-primary/20 text-primary border border-primary/30 font-semibold' 
                        : 'text-muted-foreground hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}

              <div className="h-px bg-white/5 my-3" />

              {/* Mobile Volume Control */}
              <div className="p-3 bg-white/5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-white/95">
                  <span className="font-semibold flex items-center gap-1.5">
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-primary" />}
                    Synthesizer Sound Effects
                  </span>
                  <button 
                    onClick={handleMuteToggle}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                      isMuted ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-primary/20 border-primary/30 text-primary"
                    )}
                  >
                    {isMuted ? "Muted" : "Active"}
                  </button>
                </div>
                {!isMuted && (
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                )}
              </div>

              <GlassButton 
                variant="primary" 
                className="mt-4 w-full gap-2 text-xs"
                onClick={() => handleNavClick('create')}
              >
                <Plus className="w-4 h-4" />
                Create Study Set
              </GlassButton>
            </nav>
          </GlassCard>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <GlassCard className="mx-4 mb-4 p-2 border border-white/10" variant="elevated">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all outline-none cursor-pointer',
                    isActive ? 'text-primary font-semibold scale-105' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </GlassCard>
      </nav>
    </>
  )
}
