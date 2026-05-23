'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  ArrowRight,
  Sparkles,
  BookOpen,
  Trophy,
  Flame,
  Zap,
  Shield,
  TrendingUp,
  Cpu,
  ChevronRight,
  CheckCircle2
} from 'lucide-react'
import { GlassCard, GlassButton, GlassBadge } from '@/components/glass-ui'
import { cn } from '@/lib/utils'

interface LandingPageProps {
  onLaunch: () => void
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  // LERP references for buttery smooth Apple-spring 3D rotation
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const [displayRotation, setDisplayRotation] = useState({ x: 0, y: 0 })
  const [isHeroHovered, setIsHeroHovered] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Reusable smooth scroll helper that intercepts standard anchor clicks
  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // 3D rotation LERP animation loop (updates continuously for liquid fluid physics)
  useEffect(() => {
    let frameId: number
    const updateRotation = () => {
      // 0.08 dampening factor provides that luxury, heavy physical deceleration feel
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.08
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.08

      setDisplayRotation({
        x: currentRotation.current.x,
        y: currentRotation.current.y
      })
      frameId = requestAnimationFrame(updateRotation)
    }
    updateRotation()
    return () => cancelAnimationFrame(frameId)
  }, [])

  // Track active features for demo preview
  const [activeTab, setActiveTab] = useState<'ai' | 'flash' | 'quiz'>('ai')

  // Interactive Demo States
  const [demoFlashcardFlipped, setDemoFlashcardFlipped] = useState(false)
  const [demoFlashcardIndex, setDemoFlashcardIndex] = useState(12)
  const [demoQuizTypeIndex, setDemoQuizTypeIndex] = useState(0)

  // Tilt coordinates for individual feature cards
  const [featureTilts, setFeatureTilts] = useState<{ [key: string]: { x: number; y: number } }>({})

  // HTML5 Canvas for the 3D particle parallax background
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    // Handle resizing
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle class
    class Particle {
      x: number
      y: number
      z: number // Depth coordinate for 3D simulation
      vx: number
      vy: number
      vz: number
      radius: number
      color: string

      constructor() {
        this.x = Math.random() * width - width / 2
        this.y = Math.random() * height - height / 2
        this.z = Math.random() * 800 + 100
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        this.vz = -Math.random() * 0.5 - 0.2 // Move towards camera
        this.radius = Math.random() * 1.5 + 0.5
        // Curated HSL colors matching the brand identity
        const hue = Math.random() > 0.6 ? 288 : (Math.random() > 0.5 ? 262 : 210) // Purple, Indigo, Pink-Violet
        this.color = `hsla(${hue}, 85%, 75%, `
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.z += this.vz

        // Recycle particles that pass the camera
        if (this.z <= 0) {
          this.x = Math.random() * width - width / 2
          this.y = Math.random() * height - height / 2
          this.z = 800
        }
      }

      draw(context: CanvasRenderingContext2D, mouseX: number, mouseY: number) {
        // Perspective projection
        const scale = 400 / this.z
        // Add parallax offset based on mouse position
        const px = (this.x + mouseX * 0.05) * scale + width / 2
        const py = (this.y + mouseY * 0.05) * scale + height / 2
        const size = this.radius * scale

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = (1 - this.z / 800) * 0.6
          context.beginPath()
          context.arc(px, py, size, 0, Math.PI * 2)
          context.fillStyle = this.color + alpha + ')'
          context.shadowBlur = 10
          context.shadowColor = 'hsla(288, 85%, 75%, 0.3)'
          context.fill()
          context.shadowBlur = 0
        }
      }
    }

    const particles: Particle[] = Array.from({ length: 90 }, () => new Particle())

    // Track mouse position globally with smooth LERP damping for fluid iOS parallax
    let mx = 0
    let my = 0
    let curMx = 0
    let curMy = 0
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      mx = e.clientX - window.innerWidth / 2
      my = e.clientY - window.innerHeight / 2
    }
    window.addEventListener('mousemove', handleMouseMoveGlobal)

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Dampen global mouse parallax coords for luxury fluid look
      curMx += (mx - curMx) * 0.08
      curMy += (my - curMy) * 0.08

      // Draw background network paths connecting particles in 3D
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        p1.update()
        p1.draw(ctx, curMx, curMy)

        // Connect particles that are close
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dz = p1.z - p2.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < 100) {
            const scale1 = 400 / p1.z
            const scale2 = 400 / p2.z
            const x1 = (p1.x + curMx * 0.05) * scale1 + width / 2
            const y1 = (p1.y + curMy * 0.05) * scale1 + height / 2
            const x2 = (p2.x + curMx * 0.05) * scale2 + width / 2
            const y2 = (p2.y + curMy * 0.05) * scale2 + height / 2

            // Make sure lines remain on screen
            if (x1 >= 0 && x1 <= width && y1 >= 0 && y1 <= height &&
              x2 >= 0 && x2 <= width && y2 >= 0 && y2 <= height) {
              const alpha = (1 - (p1.z + p2.z) / 1600) * (1 - dist / 100) * 0.15
              ctx.beginPath()
              ctx.moveTo(x1, y1)
              ctx.lineTo(x2, y2)
              ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})` // Violet stroke
              ctx.lineWidth = 0.5 * ((scale1 + scale2) / 2)
              ctx.stroke()
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMoveGlobal)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // 3D Card Tilt handlers
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const heroEl = heroRef.current
    if (!heroEl) return
    const rect = heroEl.getBoundingClientRect()
    // Calculate distance from center of the hero element
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    // Limit rotation to maximum 15 degrees for smooth performance
    targetRotation.current = {
      x: -y / 15,
      y: x / 15
    }
  }

  const handleHeroMouseLeave = () => {
    setIsHeroHovered(false)
    targetRotation.current = { x: 0, y: 0 }
  }

  const handleFeatureClick = (tab: 'ai' | 'flash' | 'quiz' | 'analytics') => {
    if (tab === 'analytics') {
      onLaunch();
    } else {
      setActiveTab(tab);
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const handleFeatureMouseMove = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setFeatureTilts(prev => ({
      ...prev,
      [id]: { x: -y / 10, y: x / 10 }
    }))
  }

  const handleFeatureMouseLeave = (id: string) => {
    setFeatureTilts(prev => ({
      ...prev,
      [id]: { x: 0, y: 0 }
    }))
  }

  return (
    <div
      className="min-h-screen flex flex-col text-foreground relative overflow-x-hidden select-none bg-[#090616]"
    >
      {/* iOS buttery-smooth springs and active haptic styles override */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Butter-smooth springs using standard Apple system curve */
        .ios-spring {
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .ios-spring-slow {
          transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .ios-spring-bounce {
          transition: all 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        
        /* Haptic press simulation (subtle elastic shrink on tap/click) */
        .ios-active-scale {
          transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .ios-active-scale:active {
          transform: scale(0.96) !important;
        }
        .ios-active-scale-lg {
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .ios-active-scale-lg:active {
          transform: scale(0.93) !important;
        }
        
        /* Premium custom scroll behavior overrides */
        .ios-smooth-scroll {
          -webkit-overflow-scrolling: touch;
        }
      `}} />
      {/* 3D Parallax Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none -z-20 opacity-70"
      />

      {/* Decorative Radial Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-bl from-chart-2/20 via-chart-3/5 to-transparent rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-chart-4/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <header className="sticky top-0 w-full z-50 backdrop-blur-md border-b border-white/5 bg-[#090616]/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-primary/40 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                NovaMind
              </span>
              <span className="text-[10px] block text-primary font-medium tracking-widest uppercase">AI Study Hub</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              onClick={(e) => handleScrollToSection(e, 'features')}
              className="hover:text-white transition-colors py-2 relative group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#demo"
              onClick={(e) => handleScrollToSection(e, 'demo')}
              className="hover:text-white transition-colors py-2 relative group"
            >
              Interactive Demo
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#security"
              onClick={(e) => handleScrollToSection(e, 'security')}
              className="hover:text-white transition-colors py-2 relative group"
            >
              Integrations
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <GlassButton
              variant="primary"
              className="gap-2 group shadow-xl hover:shadow-primary/30 ios-spring ios-haptic-scale"
              onClick={onLaunch}
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </GlassButton>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 md:pt-24 pb-20 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Compelling content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <GlassBadge variant="info" className="px-3 py-1 bg-white/5 border-white/10 text-primary-foreground font-semibold flex items-center gap-1.5 animate-pulse-soft">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '6s' }} />
              <span>Next-Gen Active Recall Platform</span>
            </GlassBadge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-balance">
              Supercharge your study sessions with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-chart-2 relative">
                AI Architect
                <span className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-violet-400 to-transparent" />
              </span>
            </h1>

            <p className="text-lg text-muted-foreground/90 max-w-xl text-pretty leading-relaxed">
              NovaMind blends spatial dark-glass aesthetics, adaptive spaced repetition, and real-time AI guidance to turn studying from a chore into a highly engaging, gamified flow state.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
              <GlassButton
                variant="primary"
                size="lg"
                className="gap-2 text-base px-8 h-14 group shadow-xl hover:shadow-primary/30 shadow-primary/10 ios-spring-slow ios-haptic-scale-lg"
                onClick={onLaunch}
              >
                <span>Enter Workspace</span>
                <Zap className="w-5 h-5 transition-transform duration-300 group-hover:scale-125" />
              </GlassButton>
              <a
                href="#features"
                onClick={(e) => handleScrollToSection(e, 'features')}
              >
                <GlassButton
                  size="lg"
                  className="gap-2 text-base px-8 h-14 bg-white/5 border-white/10 hover:bg-white/10 ios-spring-slow ios-haptic-scale-lg"
                >
                  <span>Explore Features</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </GlassButton>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-white/5 w-full max-w-lg">
              <div>
                <p className="text-3xl font-extrabold text-white">10x</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Retention Boost</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">100%</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Local & Offline</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">24/7</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">AI Tutor Access</p>
              </div>
            </div>
          </div>

          {/* Right Column: Stunning Interactive 3D Study Hub mockup */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div
              className="relative w-full max-w-[430px] aspect-[4/5] perspective-1000 flex items-center justify-center"
              onMouseMove={handleHeroMouseMove}
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={handleHeroMouseLeave}
            >
              {/* Outer decorative halo glow behind the 3D element */}
              <div
                className="absolute inset-0 bg-primary/20 rounded-3xl blur-[80px] -z-10 transition-transform duration-500"
                style={{
                  transform: `scale(${isHeroHovered ? 1.15 : 1.0})`,
                }}
              />

              {/* Main 3D container */}
              <div
                ref={heroRef}
                className="w-full h-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 flex flex-col justify-between preserve-3d shadow-2xl relative"
                style={{
                  transform: `perspective(1000px) rotateX(${displayRotation.x}deg) rotateY(${displayRotation.y}deg)`,
                }}
              >
                {/* 3D Depth Card 1: AI Prompt Bubble (Floats high out of screen) */}
                <div
                  onClick={onLaunch}
                  className="absolute top-8 -left-6 w-[230px] rounded-2xl bg-gradient-to-r from-violet-600/90 to-primary/90 border border-violet-500/30 p-4 shadow-xl preserve-3d transition-transform duration-300 cursor-pointer hover:brightness-110 ios-haptic-scale"
                  style={{
                    transform: `translateZ(${isHeroHovered ? '80px' : '40px'}) translateY(-10px)`,
                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <div className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">Nova AI Tutor</p>
                      <p className="text-xs font-medium text-white mt-1">&quot;Let&apos;s review the Spaced Repetition cards. Ready to test?&quot;</p>
                    </div>
                  </div>
                </div>

                {/* 3D Depth Card 2: Interactive Flashcard (Middle Depth) */}
                <div
                  onClick={onLaunch}
                  className="absolute bottom-32 -right-8 w-[240px] rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-4 shadow-2xl preserve-3d transition-transform duration-300 hover:border-primary/50 cursor-pointer ios-haptic-scale"
                  style={{
                    transform: `translateZ(${isHeroHovered ? '60px' : '30px'}) rotateY(-10deg)`,
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                      Active Recall
                    </span>
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Mitochondria Definition</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-3">What is the primary function of the inner membrane folds?</p>

                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-[70%]" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] text-muted-foreground">Mastery: 70%</span>
                    <span className="text-[9px] text-emerald-400 font-bold">Excellent Progress</span>
                  </div>
                </div>

                {/* 3D Depth Card 3: Dashboard Stats Widget (Low Depth) */}
                <div
                  onClick={onLaunch}
                  className="absolute bottom-8 left-4 w-[180px] rounded-2xl bg-white/[0.05] border border-white/10 p-3 shadow-xl preserve-3d transition-transform duration-300 cursor-pointer hover:bg-white/[0.1] ios-haptic-scale"
                  style={{
                    transform: `translateZ(${isHeroHovered ? '40px' : '20px'})`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-white">Daily Streak</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white">14</span>
                    <span className="text-[10px] text-muted-foreground">days streak</span>
                  </div>
                </div>

                {/* Inner mockup aesthetic elements - Center UI visual grid */}
                <div className="w-full flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Workspace Mockup
                  </div>
                </div>

                {/* Main illustration container in the center */}
                <div className="flex-1 flex flex-col justify-center items-center py-6">
                  {/* Decorative glowing rotating ring */}
                  <div
                    className="relative w-36 h-36 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center animate-spin"
                    style={{ animationDuration: '20s' }}
                  >
                    <div className="w-28 h-28 rounded-full border border-violet-500/20 flex items-center justify-center animate-spin" style={{ animationDirection: 'reverse', animationDuration: '10s' }} />
                  </div>

                  {/* Central holographic icon */}
                  <div className="absolute w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/30 to-violet-500/30 flex items-center justify-center shadow-lg border border-white/10 preserve-3d">
                    <Brain
                      className="w-10 h-10 text-white transition-transform duration-300"
                      style={{ transform: `translateZ(${isHeroHovered ? '30px' : '15px'})` }}
                    />
                  </div>
                </div>

                {/* Footer panel of the card mockup */}
                <div className="w-full border-t border-white/5 pt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Live Sandbox</span>
                  </div>
                  <span className="text-[10px] text-primary font-extrabold uppercase">NovaMind v1.0</span>
                </div>

              </div>

              {/* Decorative spatial elements (little floating particles/plus signs) */}
              <div
                className="absolute top-[10%] right-[-15px] text-primary/40 text-xl font-bold select-none transition-transform duration-500"
                style={{ transform: `translateZ(${isHeroHovered ? '90px' : '0px'}) translate(10px, -15px)` }}
              >
                +
              </div>
              <div
                className="absolute bottom-[20%] left-[-25px] text-violet-400/40 text-2xl font-bold select-none transition-transform duration-500"
                style={{ transform: `translateZ(${isHeroHovered ? '70px' : '0px'}) translate(-10px, 15px)` }}
              >
                ✦
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CORE FEATURES GRID SECTION */}
      <section id="features" className="py-24 relative border-t border-white/5 bg-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <GlassBadge variant="success" className="px-3 py-1 font-semibold uppercase tracking-wider">
              High Performance Engine
            </GlassBadge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Smarter study features, in one unified interface
            </h2>
            <p className="text-muted-foreground text-pretty text-base">
              Say goodbye to juggling twenty different active recall extensions. We’ve consolidated the ultimate cognitive reinforcement pipeline into a premium glassmorphic environment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Feature 1: Nova AI */}
            <div
              className="perspective-1000"
              onMouseMove={(e) => handleFeatureMouseMove('feat-ai', e)}
              onMouseLeave={() => handleFeatureMouseLeave('feat-ai')}
            >
              <GlassCard
                className="p-6 h-full flex flex-col justify-between hover:border-primary/50 transition-all duration-200 bg-white/[0.02] cursor-pointer ios-haptic-scale group"
                onClick={() => handleFeatureClick('ai')}
                style={{
                  transform: featureTilts['feat-ai']
                    ? `rotateX(${featureTilts['feat-ai'].x}deg) rotateY(${featureTilts['feat-ai'].y}deg)`
                    : 'none',
                  boxShadow: featureTilts['feat-ai'] ? '0 15px 35px rgba(139, 92, 246, 0.1)' : 'none'
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Nova AI Tutor</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    An interactive AI chatbot trained in cognitive science. Ask it to explain complex concepts, generate study summaries, or test your logic real-time.
                  </p>
                </div>
                <div className="pt-6 mt-auto text-xs font-bold text-violet-400 flex items-center gap-1">
                  <span>Chat & learn</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </div>

            {/* Feature 2: Active Recall */}
            <div
              className="perspective-1000"
              onMouseMove={(e) => handleFeatureMouseMove('feat-cards', e)}
              onMouseLeave={() => handleFeatureMouseLeave('feat-cards')}
            >
              <GlassCard
                className="p-6 h-full flex flex-col justify-between hover:border-primary/50 transition-all duration-200 bg-white/[0.02] cursor-pointer ios-haptic-scale group"
                onClick={() => handleFeatureClick('flash')}
                style={{
                  transform: featureTilts['feat-cards']
                    ? `rotateX(${featureTilts['feat-cards'].x}deg) rotateY(${featureTilts['feat-cards'].y}deg)`
                    : 'none',
                  boxShadow: featureTilts['feat-cards'] ? '0 15px 35px rgba(139, 92, 246, 0.1)' : 'none'
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Active Recall</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    Create beautiful, custom study decks with color tokens. Review them through our high-end 3D card layout featuring smart keyboard controls.
                  </p>
                </div>
                <div className="pt-6 mt-auto text-xs font-bold text-primary flex items-center gap-1">
                  <span>Reinforce memory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </div>

            {/* Feature 3: Smart Quizzes */}
            <div
              className="perspective-1000"
              onMouseMove={(e) => handleFeatureMouseMove('feat-quiz', e)}
              onMouseLeave={() => handleFeatureMouseLeave('feat-quiz')}
            >
              <GlassCard
                className="p-6 h-full flex flex-col justify-between hover:border-primary/50 transition-all duration-200 bg-white/[0.02] cursor-pointer ios-haptic-scale group"
                onClick={() => handleFeatureClick('quiz')}
                style={{
                  transform: featureTilts['feat-quiz']
                    ? `rotateX(${featureTilts['feat-quiz'].x}deg) rotateY(${featureTilts['feat-quiz'].y}deg)`
                    : 'none',
                  boxShadow: featureTilts['feat-quiz'] ? '0 15px 35px rgba(139, 92, 246, 0.1)' : 'none'
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Practice Quizzes</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    Generate instant diagnostic quizzes. Track your correctness score, view immediate answer breakdowns, and review detailed mastery stats.
                  </p>
                </div>
                <div className="pt-6 mt-auto text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span>Diagnose retention</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </div>

            {/* Feature 4: High-End Analytics */}
            <div
              className="perspective-1000"
              onMouseMove={(e) => handleFeatureMouseMove('feat-analytics', e)}
              onMouseLeave={() => handleFeatureMouseLeave('feat-analytics')}
            >
              <GlassCard
                className="p-6 h-full flex flex-col justify-between hover:border-primary/50 transition-all duration-200 bg-white/[0.02] cursor-pointer ios-haptic-scale group"
                onClick={() => handleFeatureClick('analytics')}
                style={{
                  transform: featureTilts['feat-analytics']
                    ? `rotateX(${featureTilts['feat-analytics'].x}deg) rotateY(${featureTilts['feat-analytics'].y}deg)`
                    : 'none',
                  boxShadow: featureTilts['feat-analytics'] ? '0 15px 35px rgba(139, 92, 246, 0.1)' : 'none'
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Cognitive Analytics</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    Analyze your studying trends, daily streaks, and learning velocity. Integrated progress rings give you clean progress tracking at a glance.
                  </p>
                </div>
                <div className="pt-6 mt-auto text-xs font-bold text-amber-400 flex items-center gap-1">
                  <span>Track growth</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </GlassCard>
            </div>

          </div>
        </div>
      </section>

      {/* DYNAMIC INTERACTIVE DEMO ACCORDION */}
      <section id="demo" className="py-24 relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          <div className="lg:col-span-5 space-y-6">
            <GlassBadge variant="info" className="px-3 py-1 bg-white/5 border-white/10 text-primary-foreground font-semibold">
              Live Sandbox Preview
            </GlassBadge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight text-balance">
              Test drive the NovaMind ecosystem
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed max-w-prose text-pretty">
              Toggle the core modules below to see real-world interactive features of the workspace in action. See how elegant glassmorphism elevates data legibility and cognitive focus.
            </p>

            <div className="space-y-3 pt-4">

              {/* Tab 1 */}
              <button
                onClick={() => setActiveTab('ai')}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left ios-spring ios-haptic-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  activeTab === 'ai'
                    ? 'bg-white/5 border-white/15 text-white shadow-lg shadow-black/20'
                    : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center ios-spring',
                  activeTab === 'ai' ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                )}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-white/95">AI Chat</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Socratic mode or direct answers when you need them.</p>
                </div>
                {activeTab === 'ai' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

              {/* Tab 2 */}
              <button
                onClick={() => setActiveTab('flash')}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left ios-spring ios-haptic-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  activeTab === 'flash'
                    ? 'bg-white/5 border-white/15 text-white shadow-lg shadow-black/20'
                    : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center ios-spring',
                  activeTab === 'flash' ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                )}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-white/95">Flashcards</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition with quick recall rating.</p>
                </div>
                {activeTab === 'flash' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

              {/* Tab 3 */}
              <button
                onClick={() => setActiveTab('quiz')}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left ios-spring ios-haptic-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  activeTab === 'quiz'
                    ? 'bg-white/5 border-white/15 text-white shadow-lg shadow-black/20'
                    : 'bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center ios-spring',
                  activeTab === 'quiz' ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
                )}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-white/95">Diagnostic Review</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Short quizzes with instant feedback.</p>
                </div>
                {activeTab === 'quiz' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>

            </div>
          </div>

          <div className="lg:col-span-7">
            <GlassCard className="p-6 md:p-8 aspect-[16/10] bg-black/60 border-white/10 shadow-2xl relative flex flex-col overflow-hidden">

              {/* Window Controls Decorator */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-muted-foreground font-mono">
                  {activeTab === 'ai' && 'nova_tutor_shell.sh'}
                  {activeTab === 'flash' && 'biology_cellular_recall.json'}
                  {activeTab === 'quiz' && 'retention_audit.tsx'}
                </div>
              </div>

              {/* DEMO SHELL CONTENTS */}
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin flex flex-col justify-center">
                {activeTab === 'ai' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-white/5 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] border border-white/5">
                        <p className="text-xs font-semibold text-primary">Nova AI Tutor</p>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">
                          &quot;Hello! I am your Socratic AI companion. To help you master *Cellular Respiration*, can you explain in your own words what happens to pyruvate before it enters the Krebs Cycle?&quot;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-primary/25 rounded-2xl rounded-tr-none p-3.5 max-w-[85%] border border-primary/30">
                        <p className="text-xs font-semibold text-primary-foreground text-right">You (Scholar)</p>
                        <p className="text-sm text-white mt-1 leading-relaxed">
                          &quot;Pyruvate is oxidized into Acetyl CoA, releasing carbon dioxide and producing NADH, which is essential for carrying high-energy electrons.&quot;
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 animate-pulse-soft">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary animate-bounce" />
                      </div>
                      <div className="bg-white/5 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] border border-white/5">
                        <p className="text-xs font-semibold text-primary">Nova AI Tutor</p>
                        <p className="text-sm text-muted-foreground mt-1">Nova is typing a breakdown of Acetyl CoA preparation...</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'flash' && (
                  <div className="max-w-md mx-auto w-full space-y-6 flex flex-col items-center">
                    <div
                      className="w-full aspect-[7/4] bg-transparent perspective-1000 cursor-pointer group"
                      onClick={() => setDemoFlashcardFlipped(!demoFlashcardFlipped)}
                    >
                      <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${demoFlashcardFlipped ? "rotate-y-180" : ""}`}>
                        {/* Front of card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 via-primary/25 to-transparent rounded-2xl border-2 border-primary/40 p-6 flex flex-col justify-between shadow-lg backface-hidden group-hover:border-primary transition-all duration-300">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/30 border border-primary/30 text-white uppercase tracking-wider">
                              Decks / Biology
                            </span>
                            <div className="flex items-center gap-1.5 text-amber-400">
                              <Flame className="w-4 h-4 fill-amber-400/20" />
                              <span className="text-xs font-bold">Level 4</span>
                            </div>
                          </div>

                          <div className="text-center my-auto">
                            <h4 className="text-lg font-bold text-white tracking-wide">Oxidative Phosphorylation</h4>
                            <p className="text-xs text-muted-foreground mt-1.5">Where inside the mitochondria does this specific electron pathway process occur?</p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-white/5 pt-3">
                            <span>Card {demoFlashcardIndex} of 30</span>
                            <span className="text-primary font-bold">Click to Flip</span>
                          </div>
                        </div>

                        {/* Back of card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-teal-500/25 to-transparent rounded-2xl border-2 border-emerald-500/40 p-6 flex flex-col justify-between shadow-lg backface-hidden rotate-y-180 group-hover:border-emerald-400 transition-all duration-300">
                          <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                          <div className="text-center my-auto">
                            <h4 className="text-lg font-bold text-emerald-300 tracking-wide">Inner Mitochondrial Membrane</h4>
                            <p className="text-xs text-emerald-300/70 mt-2">The electron transport chain is embedded within the cristae (folds) of the inner membrane.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <GlassButton
                        size="sm"
                        className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 ios-haptic-scale"
                        onClick={() => {
                          setDemoFlashcardIndex(prev => prev < 30 ? prev + 1 : 1)
                          setDemoFlashcardFlipped(false)
                        }}
                      >Hard (10m)</GlassButton>
                      <GlassButton
                        size="sm"
                        className="bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30 ios-haptic-scale"
                        onClick={() => {
                          setDemoFlashcardIndex(prev => prev < 30 ? prev + 1 : 1)
                          setDemoFlashcardFlipped(false)
                        }}
                      >Good (1d)</GlassButton>
                      <GlassButton
                        size="sm"
                        className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 ios-haptic-scale"
                        variant="primary"
                        onClick={() => {
                          setDemoFlashcardIndex(prev => prev < 30 ? prev + 1 : 1)
                          setDemoFlashcardFlipped(false)
                        }}
                      >Easy (4d)</GlassButton>
                    </div>
                  </div>
                )}

                {activeTab === 'quiz' && (
                  <div className="space-y-6 animate-fade-in max-w-md mx-auto w-full flex flex-col justify-center h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {['Multiple Choice', 'Identification', 'Modified True/False', 'Enumeration', 'Essay'][demoQuizTypeIndex]}
                        </p>
                        <p className="text-sm font-semibold text-white mt-1">Question {demoQuizTypeIndex + 1} of 5</p>
                      </div>
                      <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                        24s
                      </div>
                    </div>

                    {/* Question Content based on type */}
                    <div className="flex-1">
                      {demoQuizTypeIndex === 0 && (
                        <>
                          <h4 className="text-base font-medium text-white leading-relaxed mb-4">
                            Which of the following is NOT a stage of cellular respiration?
                          </h4>
                          <div className="space-y-3">
                            {['Glycolysis', 'Calvin Cycle', 'Krebs Cycle', 'Electron Transport Chain'].map((option, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer ios-haptic-scale transition-all ${i === 1 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10 text-muted-foreground'}`}
                              >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${i === 1 ? 'border-emerald-500 bg-emerald-500/30' : 'border-white/20'}`}>
                                  {i === 1 ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : ['A', 'B', 'C', 'D'][i]}
                                </div>
                                <span className="text-sm font-medium">{option}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {demoQuizTypeIndex === 1 && (
                        <>
                          <h4 className="text-base font-medium text-white leading-relaxed mb-4">
                            Identify the organelle responsible for producing the majority of ATP in a eukaryotic cell.
                          </h4>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden">
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                            <span className="text-white font-medium pl-2">Mitochondria</span>
                            <div className="w-[1px] h-4 bg-primary animate-pulse" />
                          </div>
                        </>
                      )}

                      {demoQuizTypeIndex === 2 && (
                        <>
                          <h4 className="text-base font-medium text-white leading-relaxed">
                            Statement: Glycolysis occurs in the mitochondrial matrix.
                          </h4>
                          <p className="text-xs text-muted-foreground mt-2 mb-4">If false, provide the correct term to replace the underlined word.</p>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-center text-muted-foreground">True</div>
                            <div className="p-3 rounded-xl border border-red-500/50 bg-red-500/20 text-center text-red-200 shadow-lg shadow-red-500/10">False</div>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-emerald-100 text-sm">Correction: <span className="font-bold">Cytoplasm</span></span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                        </>
                      )}

                      {demoQuizTypeIndex === 3 && (
                        <>
                          <h4 className="text-base font-medium text-white leading-relaxed mb-4">
                            Enumerate the three main products of Glycolysis.
                          </h4>
                          <div className="space-y-3">
                            <div className="flex gap-3 items-center">
                              <span className="text-muted-foreground text-sm font-bold">1.</span>
                              <div className="flex-1 bg-white/5 border border-emerald-500/50 rounded-lg p-2.5 text-sm text-white">2 ATP</div>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex gap-3 items-center">
                              <span className="text-muted-foreground text-sm font-bold">2.</span>
                              <div className="flex-1 bg-white/5 border border-emerald-500/50 rounded-lg p-2.5 text-sm text-white">2 NADH</div>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="flex gap-3 items-center">
                              <span className="text-muted-foreground text-sm font-bold">3.</span>
                              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-muted-foreground flex items-center">
                                Pyruvat<div className="w-[1px] h-3 bg-primary animate-pulse ml-[1px]" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {demoQuizTypeIndex === 4 && (
                        <>
                          <h4 className="text-base font-medium text-white leading-relaxed mb-4">
                            Explain the role of oxygen in the electron transport chain.
                          </h4>
                          <div className="relative">
                            <div className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 leading-relaxed text-pretty">
                              Oxygen acts as the final electron acceptor in the electron transport chain. It binds with electrons and hydrogen ions to form water, allowing the chain to continue functioning and producing ATP...
                            </div>
                            <div className="absolute bottom-3 right-3 flex gap-2">
                              <GlassBadge variant="success" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30">AI Graded: 92%</GlassBadge>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-2 flex justify-between items-center mt-auto">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> +14% Learning Velocity</p>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        className="gap-2 group ios-haptic-scale"
                        onClick={() => setDemoQuizTypeIndex(prev => (prev + 1) % 5)}
                      >
                        {demoQuizTypeIndex === 4 ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </GlassButton>
                    </div>
                  </div>
                )}
              </div>

            </GlassCard>
          </div>

        </div>
      </section>

      {/* OFFLINE FIRST / SECURITY CALLOUT */}
      <section id="security" className="py-24 relative border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              <GlassBadge variant="info" className="px-3 py-1 font-semibold uppercase tracking-wider">
                100% Private & Self-Contained
              </GlassBadge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Designed for distraction-free deep work
              </h2>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                NovaMind is built to keep your studies localized, lightning-fast, and completely safe. No advertisements, no doomscrolling, no trackers, and no forced online synchronizations. Just pure, clean study blocks.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Offline-First Design</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Your study datasets stay completely stored on your local browser memory, fully functional offline.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Lightweight Architecture</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">No heavy databases or complex backends. Starts instantly in standard browser clients with hot-reloading.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              {/* Glowing spatial background grid */}
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl -z-10" />

              <GlassCard className="p-8 border-white/10 w-full max-w-md bg-white/[0.02]" variant="elevated">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Interactive Study Streak</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Biology Masters</span>
                    <span className="text-primary font-bold">12 / 15 Cards Due</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[80%]" />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Neuroscience Intro</span>
                    <span className="text-primary font-bold">8 / 20 Cards Due</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full w-[40%]" />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Chemistry Mastery</span>
                    <span className="text-primary font-bold">Completed 🎉</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[100%]" />
                  </div>
                </div>

                <div className="border-t border-white/5 mt-6 pt-6 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block">Total Review Time</span>
                    <span className="text-xl font-black text-white">4.2 Hours</span>
                  </div>
                  <GlassBadge variant="success">Active recall active</GlassBadge>
                </div>
              </GlassCard>
            </div>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section className="pt-24 pb-36 relative max-w-5xl mx-auto px-6 text-center">
        <div className="absolute inset-0 bg-primary/10 rounded-[40px] blur-[100px] -z-10" />

        <GlassCard className="p-8 sm:p-12 md:p-16 border-white/10 relative overflow-hidden bg-white/[0.01]" variant="elevated">
          {/* Neon gradient mesh backing */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-chart-2/10 -z-10" />

          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white text-balance leading-tight">
              Ready to experience spatial cognitive science?
            </h2>
            <p className="text-muted-foreground text-pretty max-w-lg mx-auto text-base">
              Boost your grades, study offline, and chat with Nova. All localized, entirely free, and beautifully styled.
            </p>

            <div className="pt-4 flex justify-center">
              <GlassButton
                variant="primary"
                size="lg"
                className="gap-2 text-base px-8 h-14 group shadow-xl hover:shadow-primary/30 ios-spring-slow ios-haptic-scale-lg animate-pulse-soft"
                onClick={onLaunch}
              >
                <span>Launch Workspace Now</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* FOOTER - strictly fixed to remain anchored at the bottom on scroll */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 py-6 bg-[#090616]/80 backdrop-blur-xl text-xs text-muted-foreground text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-white">NovaMind AI Study Hub</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} NovaMind. Built offline for deep scholarship.
          </div>
          <div className="flex gap-6">
            <a
              href="#features"
              onClick={(e) => handleScrollToSection(e, 'features')}
              className="hover:text-white ios-spring ios-haptic-scale block"
            >
              Features
            </a>
            <a
              href="#demo"
              onClick={(e) => handleScrollToSection(e, 'demo')}
              className="hover:text-white ios-spring ios-haptic-scale block"
            >
              Interactive Demo
            </a>
            <a
              href="#security"
              onClick={(e) => handleScrollToSection(e, 'security')}
              className="hover:text-white ios-spring ios-haptic-scale block"
            >
              Integrations
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
