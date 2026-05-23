'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  Save,
  Loader2,
  Upload,
  FileText,
  X,
  FileType,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { GlassCard, GlassButton, GlassInput, GlassTextarea, GlassBadge } from '@/components/glass-ui'
import { toast } from '@/hooks/use-toast'
import { type StudySet } from '@/lib/store'
import { cn, isOnline } from '@/lib/utils'

interface CreateSetViewProps {
  onBack: () => void
  onSave: (set: Omit<StudySet, 'id' | 'createdAt' | 'progress'>) => void
  // Optional: when provided, the view will be used to edit an existing set
  initialSet?: StudySet
  onUpdate?: (id: string, updates: Partial<StudySet>) => void
}

interface CardDraft {
  front: string
  back: string
}

interface UploadedFile {
  name: string
  size: number
  text: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  error?: string
}

const subjects = ['Biology', 'Languages', 'History', 'Mathematics', 'Science', 'Other']
const gradients = [
  'from-emerald-500/20 to-teal-500/20',
  'from-orange-500/20 to-amber-500/20',
  'from-violet-500/20 to-indigo-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-pink-500/20 to-rose-500/20',
  'from-red-500/20 to-orange-500/20',
]

const acceptedFileTypes = '.pdf,.doc,.docx,.pptx,.txt,.md'
const acceptedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-400" />
    case 'doc':
    case 'docx':
      return <FileType className="w-5 h-5 text-blue-400" />
    case 'pptx':
      return <FileType className="w-5 h-5 text-orange-400" />
    default:
      return <FileText className="w-5 h-5 text-muted-foreground" />
  }
}

export function CreateSetView({ onBack, onSave, initialSet, onUpdate }: CreateSetViewProps) {
  const [title, setTitle] = useState(initialSet?.title ?? '')
  const [description, setDescription] = useState(initialSet?.description ?? '')
  const [subject, setSubject] = useState(initialSet?.subject ?? 'Other')
  const [color, setColor] = useState(initialSet?.color ?? gradients[0])
  const [cards, setCards] = useState<CardDraft[]>(
    initialSet?.cards.map((c) => ({ front: c.front, back: c.back })) ?? [{ front: '', back: '' }]
  )
  const [titleError, setTitleError] = useState<string | null>(null)
  const [cardErrors, setCardErrors] = useState<Array<{ front?: string | null; back?: string | null }>>(
    initialSet?.cards.map(() => ({ front: null, back: null })) ?? [{ front: null, back: null }]
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGeneratingFromFile, setIsGeneratingFromFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addCard = () => {
    setCards([...cards, { front: '', back: '' }])
    setCardErrors((prev) => [...prev, { front: null, back: null }])
  }

  const removeCard = (index: number) => {
    if (cards.length === 1) return
    setCards(cards.filter((_, i) => i !== index))
    setCardErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    const updated = [...cards]
    updated[index][field] = value
    setCards(updated)
    // Inline validation: clear error when user types
    setCardErrors((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value.trim() ? null : `${field === 'front' ? 'Question' : 'Answer'} is required` }
      return copy
    })
  }

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return

    if (!isOnline()) {
      toast({ title: 'Offline', description: 'Cannot generate flashcards while offline. Connect to the internet to use AI generation.', variant: 'destructive' })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate flashcards')
      
      if (data.flashcards && data.flashcards.length > 0) {
        setCards([...cards.filter((c) => c.front || c.back), ...data.flashcards])
        setTitle(aiTopic)
        setAiTopic('')
      } else {
        toast({ title: 'No cards generated', description: 'AI did not return any flashcards. Try a different topic or adjust your prompt.', variant: 'destructive' })
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Generation failed', description: error instanceof Error ? error.message : 'Error generating flashcards', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  // File upload handlers
  const processFile = useCallback(async (file: File) => {
    // Validate file type
    if (!acceptedMimeTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?|pptx|txt|md)$/i)) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        text: '',
        status: 'error',
        error: 'Unsupported file format. Please upload PDF, Word, PowerPoint, or text files.',
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        text: '',
        status: 'error',
        error: 'File too large. Maximum size is 10MB.',
      })
      return
    }

    setUploadedFile({
      name: file.name,
      size: file.size,
      text: '',
      status: 'uploading',
    })

    try {
      if (!isOnline()) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          text: '',
          status: 'error',
          error: 'Cannot parse documents while offline. Connect to the internet and try again.',
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)

      setUploadedFile((prev) => (prev ? { ...prev, status: 'processing' } : null))

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse document')
      }

      setUploadedFile({
        name: file.name,
        size: file.size,
        text: data.text,
        status: 'ready',
      })

      // Auto-set title from file name if empty
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(cleanName)
      }
    } catch (error) {
      setUploadedFile({
        name: file.name,
        size: file.size,
        text: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process file',
      })
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
  }

  const generateFromDocument = async () => {
    if (!uploadedFile?.text) return

    if (!isOnline()) {
      toast({ title: 'Offline', description: 'Cannot generate flashcards from document while offline. Connect to the internet to use this feature.', variant: 'destructive' })
      return
    }

    setIsGeneratingFromFile(true)

    try {
      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadedFile.text })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate from document')
      
      if (data.flashcards && data.flashcards.length > 0) {
        setCards([...cards.filter((c) => c.front || c.back), ...data.flashcards])
      } else {
        alert('AI did not return any flashcards from this document.')
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Generation failed', description: error instanceof Error ? error.message : 'Error generating from document', variant: 'destructive' })
    } finally {
      setIsGeneratingFromFile(false)
    }
  }

  const handleSave = () => {
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim())

    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required')
    } else {
      setTitleError(null)
    }

    // Validate cards
    const newCardErrors = cards.map((c) => ({
      front: c.front.trim() ? null : 'Question is required',
      back: c.back.trim() ? null : 'Answer is required',
    }))
    setCardErrors(newCardErrors)

    if (!title.trim() || validCards.length === 0) {
      // focus first invalid field (attempt)
      const firstInvalidIndex = newCardErrors.findIndex((e) => e.front || e.back)
      if (firstInvalidIndex >= 0) {
        const el = document.querySelectorAll('textarea')[firstInvalidIndex + 1] as HTMLTextAreaElement | undefined
        if (el) el.focus()
      }
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || `Study set about ${title}`,
      subject,
      cardCount: validCards.length,
      color,
      cards: validCards.map((c, i) => ({
        id: initialSet ? initialSet.cards[i]?.id ?? `new-${i}` : `new-${i}`,
        front: c.front,
        back: c.back,
        mastery: initialSet ? initialSet.cards[i]?.mastery ?? 'new' : 'new',
        timesReviewed: initialSet ? initialSet.cards[i]?.timesReviewed ?? 0 : 0,
        repetitions: initialSet ? initialSet.cards[i]?.repetitions ?? 0 : 0,
        interval: initialSet ? initialSet.cards[i]?.interval ?? 0 : 0,
        easeFactor: initialSet ? initialSet.cards[i]?.easeFactor ?? 2.5 : 2.5,
        dueDate: new Date(),
      })),
    }

    if (initialSet && onUpdate) {
      onUpdate(initialSet.id, payload)
    } else {
      onSave(payload)
    }

    onBack()
  }

  const validCardsCount = cards.filter((c) => c.front.trim() && c.back.trim()).length

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <GlassButton variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </GlassButton>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Create Study Set</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Build your flashcards manually or with AI assistance
            </p>
          </div>
        </div>
        <GlassButton
          variant="primary"
          onClick={handleSave}
          disabled={!title.trim() || validCardsCount === 0}
          className="gap-2 w-full sm:w-auto justify-center"
        >
          <Save className="w-4 h-4" />
          Save Set
        </GlassButton>
      </div>

      {/* File Upload Section */}
      <GlassCard className="p-4 sm:p-6" variant="elevated" gradient="from-chart-2/10 to-transparent">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="font-semibold mb-1">Upload Document</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Upload PDF, Word, PowerPoint, or text files to generate flashcards automatically
            </p>

            {!uploadedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, PPTX, TXT, MD (max 10MB)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File Info Card */}
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    uploadedFile.status === 'error'
                      ? 'bg-red-500/10 border-red-500/20'
                      : uploadedFile.status === 'ready'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-white/5 border-white/10'
                  )}
                >
                  {getFileIcon(uploadedFile.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                      {uploadedFile.status === 'uploading' && ' - Uploading...'}
                      {uploadedFile.status === 'processing' && ' - Processing...'}
                      {uploadedFile.status === 'ready' &&
                        ` - ${uploadedFile.text.length.toLocaleString()} characters extracted`}
                      {uploadedFile.status === 'error' && ` - ${uploadedFile.error}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'uploading' || uploadedFile.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : uploadedFile.status === 'ready' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <GlassButton
                      variant="ghost"
                      size="icon"
                      onClick={removeUploadedFile}
                      className="h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </GlassButton>
                  </div>
                </div>

                {/* Generate Button */}
                {uploadedFile.status === 'ready' && (
                  <GlassButton
                    variant="primary"
                    onClick={generateFromDocument}
                    disabled={isGeneratingFromFile}
                    className="w-full justify-center gap-2"
                  >
                    {isGeneratingFromFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Flashcards from Document
                      </>
                    )}
                  </GlassButton>
                )}

                {/* Retry Upload */}
                {uploadedFile.status === 'error' && (
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      setUploadedFile(null)
                      fileInputRef.current?.click()
                    }}
                    className="w-full justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Try Another File
                  </GlassButton>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* AI Topic Generation */}
      <GlassCard className="p-4 sm:p-6" variant="elevated" gradient="from-primary/10 to-transparent">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="font-semibold mb-1">Generate from Topic</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Enter a topic and let Nova AI create flashcards for you instantly
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <GlassInput
                placeholder="Enter a topic (e.g., 'Photosynthesis')"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="flex-1"
              />
              <GlassButton
                variant="primary"
                onClick={handleAIGenerate}
                disabled={!aiTopic.trim() || isGenerating}
                className="w-full sm:w-auto justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Set Details */}
      <GlassCard className="p-4 sm:p-6" variant="solid">
        <h3 className="font-semibold mb-4">Set Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Title</label>
            <GlassInput
              placeholder="Enter set title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {titleError && (
              <p role="alert" aria-live="assertive" className="text-xs text-red-400 mt-1">{titleError}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    subject === s
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm text-muted-foreground mb-2 block">Description (optional)</label>
          <GlassTextarea
            placeholder="Add a description for your study set"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <label className="text-sm text-muted-foreground mb-2 block">Color Theme</label>
          <div className="flex gap-2 flex-wrap">
            {gradients.map((g) => (
              <button
                key={g}
                onClick={() => setColor(g)}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g} border-2 transition-all ${
                  color === g ? 'border-primary scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Flashcards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 flex-wrap">
            Flashcards
            <GlassBadge>{validCardsCount} cards</GlassBadge>
          </h3>
          <GlassButton size="sm" onClick={addCard} className="gap-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Card</span>
          </GlassButton>
        </div>

        {cards.map((card, index) => (
          <GlassCard key={index} className="p-3 sm:p-4" variant="solid">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Card {index + 1}</span>
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={() => removeCard(index)}
                disabled={cards.length === 1}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </GlassButton>
            </div>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Front (Question)</label>
                <GlassTextarea
                  placeholder="Enter the question or term"
                  value={card.front}
                  onChange={(e) => updateCard(index, 'front', e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px]"
                />
                {cardErrors[index]?.front && (
                  <p role="alert" aria-live="polite" className="text-xs text-red-400 mt-1">{cardErrors[index].front}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Back (Answer)</label>
                <GlassTextarea
                  placeholder="Enter the answer or definition"
                  value={card.back}
                  onChange={(e) => updateCard(index, 'back', e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px]"
                />
                {cardErrors[index]?.back && (
                  <p role="alert" aria-live="polite" className="text-xs text-red-400 mt-1">{cardErrors[index].back}</p>
                )}
              </div>
            </div>
          </GlassCard>
        ))}

        <GlassButton onClick={addCard} className="w-full gap-2 h-12 sm:h-14 border-dashed">
          <Plus className="w-5 h-5" />
          Add Another Card
        </GlassButton>
      </div>
    </div>
  )
}
