'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { StudyAudio } from '@/lib/audio'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'solid' | 'pressed'
  gradient?: string
  hover?: boolean
  glow?: boolean
  spotlight?: boolean
}

export function GlassCard({ 
  className, 
  variant = 'default', 
  gradient,
  hover = false,
  glow = false,
  spotlight = true,
  children,
  ...props 
}: GlassCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCoords({ x, y })
    
    // Also pass to CSS variables for advanced stylesheet rules
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`)
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`)
  }

  const handleMouseEnter = () => {
    setHovering(true)
    if (hover) {
      StudyAudio.playHover()
    }
  }

  const handleMouseLeave = () => {
    setHovering(false)
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden ios-spring',
        variant === 'default' && 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg',
        variant === 'elevated' && 'bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl',
        variant === 'solid' && 'bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/5 shadow-md',
        variant === 'pressed' && 'bg-black/35 backdrop-blur-xl border border-white/5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]',
        hover && 'hover:bg-white/10 hover:border-white/20 hover:scale-[1.015] cursor-pointer active:scale-[0.985]',
        glow && 'shadow-lg shadow-primary/10 border-primary/20',
        className
      )}
      onMouseMove={spotlight ? handleMouseMove : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Interactive Glassmorphic Spotlight (Cursor Glow Tracking) */}
      {spotlight && hovering && (
        <div 
          className="absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(280px circle at ${coords.x}px ${coords.y}px, rgba(168, 85, 247, 0.08), transparent 85%)`
          }}
        />
      )}
      
      {/* Fine-Border Glow Overlay */}
      {spotlight && hovering && (
        <div 
          className="absolute inset-0 pointer-events-none -z-10 rounded-2xl transition-opacity duration-300 opacity-100"
          style={{
            border: '1px solid transparent',
            background: `radial-gradient(180px circle at ${coords.x}px ${coords.y}px, rgba(168, 85, 247, 0.25), transparent 75%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        />
      )}

      {gradient && (
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 -z-20', gradient)} />
      )}
      {children}
    </div>
  )
}

export function GlassButton({
  className,
  children,
  variant = 'default',
  size = 'default',
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'pressed'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const handleMouseEnter = () => {
    StudyAudio.playHover()
  }

  const handleCLick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      StudyAudio.playTransition()
    } else {
      StudyAudio.playFlip()
    }
    if (onClick) onClick(e)
  }

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer',
        'rounded-xl backdrop-blur-xl border select-none active:scale-95',
        variant === 'default' && 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-foreground shadow-sm',
        variant === 'primary' && 'bg-primary/80 border-primary/40 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/25',
        variant === 'ghost' && 'bg-transparent border-transparent hover:bg-white/5 text-foreground',
        variant === 'pressed' && 'bg-black/30 border-white/5 text-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]',
        size === 'default' && 'h-10 px-4 py-2 text-sm',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'lg' && 'h-12 px-6 text-base',
        size === 'icon' && 'h-10 w-10',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onClick={handleCLick}
      {...props}
    >
      {children}
    </button>
  )
}

export function GlassInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl bg-white/5 backdrop-blur-xl border border-white/10',
        'px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-black/20',
        'transition-all duration-200 shadow-sm focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
        className
      )}
      {...props}
    />
  )
}

export const GlassTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function GlassTextarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-xl bg-white/5 backdrop-blur-xl border border-white/10',
          'px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-black/20',
          'transition-all duration-200 resize-none shadow-sm focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
          className
        )}
        {...props}
      />
    )
  }
)

export function GlassBadge({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-xl border select-none',
        variant === 'default' && 'bg-white/10 border-white/20 text-foreground',
        variant === 'outline' && 'bg-transparent border-white/20 text-muted-foreground',
        variant === 'success' && 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
        variant === 'warning' && 'bg-amber-500/20 border-amber-500/30 text-amber-300',
        variant === 'error' && 'bg-red-500/20 border-red-500/30 text-red-300',
        variant === 'info' && 'bg-blue-500/20 border-blue-500/30 text-blue-300',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function GlassProgress({
  value,
  className,
  showLabel = false,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="h-2.5 w-full rounded-full bg-black/40 backdrop-blur-xl overflow-hidden border border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
        <div 
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-chart-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-6 text-xs text-muted-foreground font-medium">
          {value}%
        </span>
      )}
    </div>
  )
}

// PREMIUM 3D RADIAL SVG mastery widget
export function GlassCircularProgress({
  value,
  size = 64,
  strokeWidth = 6,
  className,
  children,
}: {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: React.ReactNode
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        {/* Background ring */}
        <circle
          className="text-white/5"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          className="text-primary transition-all duration-700 ease-out"
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="var(--color-chart-2)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text / slot */}
      <div className="absolute flex flex-col items-center justify-center text-xs font-semibold text-white">
        {children ?? `${Math.round(value)}%`}
      </div>
    </div>
  )
}
