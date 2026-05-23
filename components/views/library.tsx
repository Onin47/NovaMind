'use client'

import React, { useState, useRef } from 'react'
import { Search, Filter, BookOpen, ChevronRight, MoreVertical, Trash2, Edit, Play } from 'lucide-react'
import { GlassCard, GlassInput, GlassBadge, GlassProgress, GlassButton } from '@/components/glass-ui'
import { studySetToCsv, csvToStudySet } from '@/lib/csv'
import { toast } from '@/hooks/use-toast'
import { type StudySet } from '@/lib/store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface LibraryViewProps {
  studySets: StudySet[]
  onViewSet: (setId: string) => void
  onDeleteSet: (setId: string) => void
  onStudySet: (setId: string) => void
  onEditSet?: (setId: string) => void
  onImportSet?: (set: StudySet) => void
}

const subjects = ['All', 'Biology', 'Languages', 'History', 'Mathematics', 'Science', 'Other']

export function LibraryView({ studySets, onViewSet, onDeleteSet, onStudySet, onEditSet, onImportSet }: LibraryViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const set = csvToStudySet(text, { title: file.name.replace(/\.[^/.]+$/, '') })
      if (onImportSet) {
        onImportSet(set)
        toast({ title: 'Imported', description: `Imported ${set.cardCount} cards from ${file.name}` })
      } else {
        toast({ title: 'Import ready', description: 'Import parsed but no handler provided', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Import failed', description: err instanceof Error ? err.message : 'Failed to import CSV', variant: 'destructive' })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const exportSet = (set: StudySet) => {
    try {
      const csv = studySetToCsv(set)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${set.title.replace(/[^a-z0-9-_ ]/gi, '') || 'study-set'}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: 'Exported', description: `Exported ${set.cardCount} cards` })
    } catch (err) {
      console.error(err)
      toast({ title: 'Export failed', description: err instanceof Error ? err.message : 'Failed to export CSV', variant: 'destructive' })
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')

  const filteredSets = studySets.filter(set => {
    const matchesSearch = set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          set.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === 'All' || set.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Study Library</h1>
        <p className="text-muted-foreground">
          Manage and organize all your study materials in one place
        </p>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-4" variant="elevated">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <GlassInput
              placeholder="Search study sets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedSubject === subject
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
                }`}
              >
                {subject}
              </button>
            ))}

            <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
            <GlassButton size="sm" onClick={handleImportClick} className="ml-2">
              Import CSV
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Study Sets Grid */}
      {filteredSets.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSets.map((set) => (
            <GlassCard 
              key={set.id} 
              className="p-5 group"
              gradient={set.color}
            >
              <div className="flex items-start justify-between mb-3">
                <GlassBadge>{set.subject}</GlassBadge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card/90 backdrop-blur-xl border-white/10">
                    <DropdownMenuItem onClick={() => exportSet(set)}>
                      <Play className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditSet ? onEditSet(set.id) : onViewSet(set.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStudySet(set.id)}>
                      <Play className="w-4 h-4 mr-2" />
                      Study
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteSet(set.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div 
                className="cursor-pointer"
                onClick={() => onViewSet(set.id)}
              >
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {set.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {set.description}
                </p>
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {set.cardCount} cards
                </div>
                <span>•</span>
                <span>{set.createdAt.toLocaleDateString()}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{set.progress}%</span>
                </div>
                <GlassProgress value={set.progress} />
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <GlassButton 
                  variant="primary" 
                  size="sm" 
                  className="flex-1 gap-1"
                  onClick={() => onStudySet(set.id)}
                >
                  <Play className="w-4 h-4" />
                  Study
                </GlassButton>
                <GlassButton 
                  size="sm" 
                  className="gap-1"
                  onClick={() => onViewSet(set.id)}
                >
                  View
                  <ChevronRight className="w-4 h-4" />
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No study sets found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedSubject !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Create your first study set to get started'}
          </p>
        </GlassCard>
      )}
    </div>
  )
}
