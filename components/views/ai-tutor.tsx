'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Send, Sparkles, BookOpen, Brain, Lightbulb, Loader2, Copy, Check, Key, Wifi, AlertTriangle, Play } from 'lucide-react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GlassCard, GlassButton, GlassTextarea, GlassBadge } from '@/components/glass-ui'
import { type AIMessage, type TutorMode, generateId } from '@/lib/store'
import { cn, isOnline } from '@/lib/utils'
import { StudyAudio } from '@/lib/audio'

interface AITutorViewProps {
  messages: AIMessage[]
  isTyping: boolean
  onSendMessage: (message: string) => void
  mode: TutorMode
  onModeChange: (mode: TutorMode) => void
}

const suggestions = [
  { icon: BookOpen, text: 'Create flashcards about photosynthesis' },
  { icon: Brain, text: 'Explain quantum physics simply' },
  { icon: Lightbulb, text: 'Quiz me on World War II' },
]

const markdownPlugins = [remarkGfm]

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-primary-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mt-2 pl-5 list-disc space-y-1 text-[13px] sm:text-sm text-white/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2 pl-5 list-decimal space-y-1 text-[13px] sm:text-sm text-white/90">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="px-1.5 py-0.5 rounded-md bg-black/40 font-mono text-[12px] sm:text-[13px] text-purple-300">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mt-2 p-3 rounded-xl bg-black/50 border border-white/5 overflow-x-auto text-[12px] sm:text-[13px] font-mono leading-relaxed">{children}</pre>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 text-primary hover:text-purple-300 break-words transition-colors">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-2 border-purple-500 pl-3 text-white/80 italic">{children}</blockquote>
  ),
}

function getSocraticDemoResponse(prompt: string, mode: TutorMode): string {
  const clean = prompt.toLowerCase()
  const modePrefix = mode === 'socratic' ? 'In Socratic mode, ' : ''
  
  if (clean.includes('photosynthesis')) {
    return "Ah, **photosynthesis**! 🌿 The miraculous biological engine that turns thin air and sunshine into sugar. \n\n" +
           "Before I give you the chemical equations, let me ask you: **Where do you think a massive redwood tree gets its physical weight?** Does it eat the soil, or does it build itself from something else in the environment?"
  }
  
  if (clean.includes('quantum') || clean.includes('physics')) {
    return "Welcome to the **quantum realm**! 🌀 A place where tiny particles behave like waves, and can exist in multiple states at once.\n\n" +
           "To help us grasp this, imagine a spinning coin on a table. While it's spinning, is it *heads* or *tails*? Or is it somehow a blur of **both** at the same time? What do you think?"
  }
  
  if (clean.includes('war') || clean.includes('history') || clean.includes('world war')) {
    return "History is a tapestry of human choices and consequences. Let's look at **World War II**.\n\n" +
           "Before the war erupted in 1939, European powers tried to deal with aggressive expansionist demands through a policy called **appeasement** (giving in to avoid conflict).\n\n" +
           "If you were a leader trying to prevent a massive war, why do you think giving a small piece of land to an aggressor seemed like a good idea? What was the fatal flaw in that assumption?"
  }

  if (clean.includes('soil') || clean.includes('tree') || clean.includes('air') || clean.includes('carbon') || clean.includes('co2')) {
    return "Spot on! 🍃 Many people assume trees eat the soil, but they actually breathe in **Carbon Dioxide ($CO_2$)** from the air to build their carbon trunks!\n\n" +
           "Now, to weld this carbon together, plants need energy. You know they get it from the **Sun**. But how do they capture that light? What is that famous green pigment inside plant leaves called?"
  }

  if (clean.includes('chlorophyll') || clean.includes('sunlight') || clean.includes('sun')) {
    return "Brilliant! **Chlorophyll** is the molecular solar panel of the plant cell! 🔋\n\n" +
           "Using chlorophyll, plants capture solar photons to break apart **Water ($H_2O$)** and **Carbon Dioxide ($CO_2$)** to forge glucose ($C_6H_{12}O_6$).\n\n" +
           "But as a byproduct of this reaction, they release a gas that you and I are breathing right now. What is that essential gas?"
  }

  if (clean.includes('oxygen') || clean.includes('o2')) {
    return "Yes! **Oxygen ($O_2$)**! 🎉 You've just fully mapped the chemical magic of photosynthesis:\n" +
           "$$6CO_2 + 6H_2O + \\text{light} \\rightarrow C_6H_{12}O_6 + 6O_2$$\n\n" +
           "You successfully deduced the power source, the ingredients, the pigment, and the products yourself! How does it feel to see the whole cycle come together like this?"
  }

  if (clean.includes('both') || clean.includes('spinning') || clean.includes('coin')) {
    return "Precisely! It&apos;s a blend of **both**! In quantum mechanics, this is called **Superposition**. \n\n" +
           "A particle like an electron exists in a cloud of probabilities (spinning coin) until we look at it. The act of measuring it forces the coin to land on heads or tails.\n\n" +
           "This brings us to a famous thought experiment: **Schrödinger's Cat**. Have you heard of it? Why do you think a cat in a sealed box could be considered both alive and dead until we open it?"
  }

  // Fallback Socratic dialogue
  return `${modePrefix}That&apos;s an excellent question! In the Socratic spirit, let&apos;s explore this together. \n\nTo help us break this down, let me ask: **What do you think is the single most important element or core concept when you think of this topic?** What seems like the most natural starting point?`
}

const MessageBubble = memo(function MessageBubble({
  message,
  isCopied,
  onCopy,
}: {
  message: AIMessage
  isCopied: boolean
  onCopy: (content: string, id: string) => void
}) {
  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {message.role === 'assistant' && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-chart-2 flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          'relative max-w-[90%] sm:max-w-[85%] md:max-w-[70%] rounded-[22px] px-3.5 py-2.5 group shadow-md transition-all',
          message.role === 'user'
            ? 'bg-gradient-to-r from-primary to-purple-600 text-white rounded-br-[6px]'
            : 'bg-white/5 border border-white/10 text-white/95 rounded-bl-[6px] backdrop-blur-md'
        )}
      >
        {message.role === 'assistant' ? (
          <ReactMarkdown remarkPlugins={markdownPlugins} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        ) : (
          <p className="text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        <span
          className={cn(
            'text-[9px] sm:text-[10px] opacity-50 mt-1.5 block',
            message.role === 'user' ? 'text-right' : 'text-left'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {message.role === 'assistant' && (
          <button
            onClick={() => onCopy(message.content, message.id)}
            className="absolute -right-2 -top-2 p-1.5 rounded-lg bg-[#1C1C1E] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block hover:bg-white/5"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  )
})

export function AITutorView({ messages, isTyping, onSendMessage, mode, onModeChange }: AITutorViewProps) {
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Local Settings & Wizard State
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('novamind_gemini_key') || ''
  })
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [keyDiagnosticMsg, setKeyDiagnosticMsg] = useState('')
  
  // Demo Mode State
  const [demoActive, setDemoActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return !navigator.onLine
  })
  const [demoMessages, setDemoMessages] = useState<AIMessage[]>(() => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return [
        {
          id: 'demo-init',
          role: 'assistant',
          content: "🚀 **Offline Socratic Demo Mode is Active!** \n\n" +
                   "I am Nova, your Socratic study mentor. In this demo, I will lead you through fundamental science or history concepts through guiding questions. \n\n" +
                   "Try clicking one of the suggestions below, or ask me about **Photosynthesis**, **Quantum Physics**, or **World War II** to start our dialogue!",
          timestamp: new Date(),
        },
      ]
    }
    return []
  })
  const [demoIsTyping, setDemoIsTyping] = useState(false)
  const [isAppOnline, setIsAppOnline] = useState<boolean>(() => typeof window !== 'undefined' ? navigator.onLine : true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activateDemo = (active: boolean) => {
    setDemoActive(active)
    if (active) {
      setDemoMessages((prev) =>
        prev.length ? prev : [
          {
            id: 'demo-init',
            role: 'assistant',
            content: "🚀 **Offline Socratic Demo Mode is Active!** \n\n" +
                     "I am Nova, your Socratic study mentor. In this demo, I will lead you through fundamental science or history concepts through guiding questions. \n\n" +
                     "Try clicking one of the suggestions below, or ask me about **Photosynthesis**, **Quantum Physics**, or **World War II** to start our dialogue!",
            timestamp: new Date(),
          },
        ]
      )
    } else {
      setDemoMessages([])
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setIsAppOnline(true)
    const handleOffline = () => {
      setIsAppOnline(false)
      activateDemo(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Scroll to bottom
  const demoModeActive = demoActive || !isAppOnline
  const activeMessages = demoModeActive ? demoMessages : messages
  const activeTyping = demoModeActive ? demoIsTyping : isTyping

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeMessages, activeTyping])

  const handleSend = () => {
    if (!input.trim()) return
    const promptText = input.trim()
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    const useDemo = demoModeActive

    if (useDemo) {
      if (!demoActive) {
        activateDemo(true)
      }

      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: promptText,
        timestamp: new Date()
      }
      setDemoMessages(prev => [...prev, userMsg])
      setDemoIsTyping(true)

      setTimeout(() => {
        const responseText = getSocraticDemoResponse(promptText, mode)
        const assistantMsg: AIMessage = {
          id: generateId(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        }
        setDemoMessages(prev => [...prev, assistantMsg])
        setDemoIsTyping(false)
        StudyAudio.playCorrect()
      }, 1200)
    } else {
      onSendMessage(promptText)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = useCallback(async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Save API key
  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('novamind_gemini_key', apiKeyInput.trim())
      setKeyStatus('success')
      setKeyDiagnosticMsg('API Key saved locally in browser context!')
      StudyAudio.playSuccess()
      
      // Turn off demo mode if key is set
      if (apiKeyInput.trim()) {
        activateDemo(false)
      }
      
      setTimeout(() => setKeyStatus('idle'), 2500)
    }
  }

  // Diagnostic connection test
  const handleTestConnection = async () => {
    setKeyStatus('testing')
    setKeyDiagnosticMsg('Connecting to tutor endpoint...')
    StudyAudio.playTransition()

    if (!isOnline()) {
      setKeyStatus('failed')
      setKeyDiagnosticMsg('Offline — cannot test connection without internet.')
      StudyAudio.playIncorrect()
      return
    }

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ping connection test. Reply with exactly the word "Success" if active.' }],
          mode: 'direct',
          apiKey: apiKeyInput.trim(),
        })
      })

      const data = await response.json()
      if (response.ok && data?.content && !data?.isKeyMissing) {
        setKeyStatus('success')
        setKeyDiagnosticMsg('Connection Diagnostic: Passed! Nova is online! 🎉')
        StudyAudio.playSuccess()
        activateDemo(false) // Disable demo as actual endpoint works!
      } else {
        setKeyStatus('failed')
        setKeyDiagnosticMsg(data?.content || 'Diagnostics failed. Key is invalid or rate limited.')
        StudyAudio.playIncorrect()
      }
    } catch (error) {
      console.error(error)
      setKeyStatus('failed')
      setKeyDiagnosticMsg('Network test failed. Server is unreachable.')
      StudyAudio.playIncorrect()
    }
  }

  // Check if API key is currently entered locally
  const hasLocalKey = !!apiKeyInput.trim()
  const serverKeyAlert = messages[messages.length - 1]?.content?.includes('isn\'t configured yet')

  return (
    <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex flex-col space-y-4">
      
      {/* Header Panel */}
      <GlassCard className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 shrink-0" variant="elevated">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-chart-2 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground animate-pulse" />
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-background",
              demoModeActive ? "bg-amber-400 animate-pulse" : (hasLocalKey || !serverKeyAlert) ? "bg-emerald-500" : "bg-red-500"
            )} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold">Nova AI</h1>
              {demoModeActive && <GlassBadge variant="warning">Offline Demo</GlassBadge>}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {demoModeActive ? "Simulating offline Socratic dialogue" : "Your personal AI study companion"}
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton
            size="sm"
            variant={demoModeActive ? "pressed" : "default"}
            onClick={() => activateDemo(!demoActive)}
            className="gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            {demoModeActive ? "Exit Demo" : "Demo Mode"}
          </GlassButton>

          <GlassButton
            size="sm"
            variant={showSettings ? "pressed" : "default"}
            onClick={() => setShowSettings(!showSettings)}
            className="gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            Wizard
          </GlassButton>

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <GlassButton
              size="sm"
              variant={mode === 'socratic' ? 'primary' : 'default'}
              onClick={() => onModeChange('socratic')}
            >
              Socratic
            </GlassButton>
            <GlassButton
              size="sm"
              variant={mode === 'direct' ? 'primary' : 'default'}
              onClick={() => onModeChange('direct')}
            >
              Direct
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Activation Wizard/Key Setup Panel */}
      {showSettings && (
        <GlassCard className="p-4 sm:p-5 border border-purple-500/20" gradient="from-purple-500/10 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-sm sm:text-base">Nova AI Activation Wizard</h3>
            </div>
            <GlassBadge variant={demoModeActive ? "warning" : hasLocalKey ? "success" : "error"}>
              {demoModeActive ? "Local Demo Active" : hasLocalKey ? "Active (Local Key)" : "Setup Required"}
            </GlassBadge>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-pretty leading-relaxed">
              Nova utilizes the free, fast Google Gemini API to run. You can configure your key below. Keys are stored safely in your own browser local sandbox, never uploaded to third parties.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch mb-4">
            <div className="relative flex-1">
              <input
                type="password"
                placeholder="Paste Gemini API Key (AI Studio)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full h-10 px-3.5 py-2 pr-10 text-xs sm:text-sm rounded-xl bg-black/40 border border-white/15 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
              />
              <Key className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex gap-2">
              <GlassButton size="sm" onClick={handleSaveKey} className="flex-1 sm:flex-none">
                Save Key
              </GlassButton>
              <GlassButton size="sm" variant="primary" onClick={handleTestConnection} disabled={keyStatus === 'testing'} className="flex-1 sm:flex-none gap-1.5">
                {keyStatus === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                Test
              </GlassButton>
            </div>
          </div>

          {keyStatus !== 'idle' && (
            <div className={cn(
              "p-3 rounded-xl text-xs flex items-start gap-2",
              keyStatus === 'testing' && "bg-white/5 text-muted-foreground",
              keyStatus === 'success' && "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
              keyStatus === 'failed' && "bg-red-500/10 border border-red-500/20 text-red-400"
            )}>
              {keyStatus === 'testing' && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
              {keyStatus === 'success' && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
              {keyStatus === 'failed' && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />}
              <span className="font-medium">{keyDiagnosticMsg}</span>
            </div>
          )}

          <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/5 pt-3">
            <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs text-primary hover:underline flex items-center gap-1">
              Get a free Gemini API Key from Google AI Studio &rarr;
            </a>
            <button 
              onClick={() => {
                activateDemo(!demoActive)
                setShowSettings(false)
              }} 
              className="text-[10px] sm:text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              Or play offline Socratic Demo Mode instead &rarr;
            </button>
          </div>
        </GlassCard>
      )}

      {/* Main Chat Workspace */}
      <GlassCard className="flex-1 overflow-hidden flex flex-col shadow-inner" variant="solid">
        
        {/* Messages list */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin"
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-atomic="false"
        >
          
          {/* Key Missing / Wizard Prompt */}
          {!demoModeActive && serverKeyAlert && !hasLocalKey && (
            <GlassCard className="p-4 mb-4 border border-amber-500/20 text-center" gradient="from-amber-500/5 to-transparent">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h4 className="font-semibold text-sm sm:text-base mb-1">Configuration Required</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 text-pretty leading-relaxed">
                The local developer environment has not set a Gemini API key. Paste your own key in our browser manager or play the offline demo!
              </p>
              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <GlassButton size="sm" variant="primary" className="flex-1" onClick={() => setShowSettings(true)}>
                  Open Setup Wizard
                </GlassButton>
                <GlassButton size="sm" className="flex-1" onClick={() => activateDemo(true)}>
                  Launch Socratic Demo
                </GlassButton>
              </div>
            </GlassCard>
          )}

          {activeMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCopied={copiedId === message.id}
              onCopy={handleCopy}
            />
          ))}

          {activeTyping && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-chart-2 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground animate-spin" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[22px] rounded-tl-[6px] px-3.5 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">Nova is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Prompt chips if only 1 message exists */}
          {activeMessages.length === 1 && (
            <div className="mt-6">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 font-medium flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Select a topic to start Socratic learning:
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon
                  return (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion.text)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group active:scale-[0.98] cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium line-clamp-1">{suggestion.text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-white/5 bg-[#1C1C1E]/40 backdrop-blur-md">
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 rounded-[22px] bg-black/40 border border-white/10 px-4 py-2 flex items-center focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.5)]">
              <GlassTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto'
                    inputRef.current.style.height = `${Math.min(120, inputRef.current.scrollHeight)}px`
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={demoModeActive ? "Ask about Photosynthesis, Quantum, or WWII..." : "Message Nova…"}
                className="min-h-[20px] max-h-[120px] px-0 py-1.5 bg-transparent border-0 focus:ring-0 focus:border-0 text-sm sm:text-base leading-relaxed resize-none w-full outline-none placeholder:text-muted-foreground text-foreground"
                rows={1}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || activeTyping}
              className={cn(
                'shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 shadow-md',
                !input.trim() || activeTyping
                  ? 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/20'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-2 text-center select-none font-medium">
            Enter to send • Shift+Enter for new line • Local data fully sandbox encrypted
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
