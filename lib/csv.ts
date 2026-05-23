import { StudySet, Flashcard, generateId } from './store'

function escapeCsvCell(value: string) {
  if (value == null) return ''
  const needsQuotes = /[",\n\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export function studySetToCsv(set: StudySet): string {
  const rows: string[] = []
  // header
  rows.push(['Front', 'Back'].map(escapeCsvCell).join(','))

  for (const c of set.cards) {
    rows.push([c.front || '', c.back || ''].map(escapeCsvCell).join(','))
  }

  return rows.join('\r\n')
}

// Basic CSV parser with support for quoted cells
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const len = text.length

  let row: string[] = []
  let cell = ''
  let inQuotes = false

  while (i < len) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      cell += ch
      i++
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }

    if (ch === ',') {
      row.push(cell)
      cell = ''
      i++
      continue
    }

    if (ch === '\r') {
      // ignore, handle on \n
      i++
      continue
    }

    if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i++
      continue
    }

    cell += ch
    i++
  }

  // push last
  if (cell !== '' || inQuotes || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

export function csvToStudySet(csvText: string, options?: { title?: string; subject?: string }): StudySet {
  const rows = parseCsv(csvText).filter((r) => r.length > 0 && !(r.length === 1 && r[0].trim() === ''))
  if (rows.length === 0) {
    throw new Error('CSV empty')
  }

  // detect header
  const header = rows[0].map((h) => h.toLowerCase())
  let startIndex = 0
  const hasHeader = header.includes('front') || header.includes('back')
  if (hasHeader) startIndex = 1

  const cards: Flashcard[] = []

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i]
    const front = (row[0] ?? '').trim()
    const back = (row[1] ?? '').trim()
    if (!front && !back) continue

    cards.push({
      id: generateId(),
      front,
      back,
      mastery: 'new',
      timesReviewed: 0,
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      dueDate: new Date(),
    })
  }

  const title = options?.title ?? 'Imported Set'

  const set: StudySet = {
    id: generateId(),
    title,
    description: `${title} (imported)` ,
    subject: options?.subject ?? 'Other',
    cardCount: cards.length,
    createdAt: new Date(),
    progress: 0,
    color: 'from-primary/20 to-chart-2/20',
    cards,
  }

  return set
}
