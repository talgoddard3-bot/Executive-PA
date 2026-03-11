'use client'

import { useState, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id: string
  category: string
  content: string
  expires_at: string
  created_at: string
}

interface Doc {
  id: string
  title: string
  description: string
  file_type: string
  file_size: number | null
  expires_at: string
  created_at: string
}

const NOTE_CATEGORIES = ['Sales Signal', 'Customer Intel', 'Risk Flag', 'Opportunity', 'General'] as const
const CATEGORY_COLORS: Record<string, string> = {
  'Sales Signal':   'bg-blue-50 text-blue-700 border-blue-200',
  'Customer Intel': 'bg-violet-50 text-violet-700 border-violet-200',
  'Risk Flag':      'bg-red-50 text-red-700 border-red-200',
  'Opportunity':    'bg-emerald-50 text-emerald-700 border-emerald-200',
  'General':        'bg-gray-100 text-gray-600 border-gray-200',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Note form ─────────────────────────────────────────────────────────────────

function NoteForm({ onAdded }: { onAdded: (note: Note) => void }) {
  const [category, setCategory] = useState<string>('General')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/internal/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content }),
      })
      if (res.ok) {
        const note = await res.json()
        onAdded(note)
        setContent('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {NOTE_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
              category === cat
                ? CATEGORY_COLORS[cat]
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={
          category === 'Sales Signal' ? 'e.g. "ACME Corp pushing out Q3 procurement freeze — likely delays order"'
          : category === 'Customer Intel' ? 'e.g. "Spoke with [Customer] — they\'re expanding into APAC next year, need localised offering"'
          : category === 'Risk Flag' ? 'e.g. "Key supplier in Mexico facing labour dispute — monitor for Q2 delivery impact"'
          : category === 'Opportunity' ? 'e.g. "Competitor X lost [Customer] account — they\'re actively evaluating alternatives"'
          : 'Add any internal context that should inform this week\'s brief…'
        }
        rows={3}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white placeholder-gray-400"
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-400">Expires in 60 days · visible to your whole team</p>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Add Note'}
        </button>
      </div>
    </form>
  )
}

// ── Document upload ────────────────────────────────────────────────────────────

function DocUpload({ onAdded }: { onAdded: (doc: Doc) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      // Step 1: get signed upload URL
      setProgress('Getting upload URL…')
      const urlRes = await fetch('/api/internal/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      })
      if (!urlRes.ok) {
        const { error } = await urlRes.json()
        setProgress(`Error: ${error}`)
        return
      }
      const { signedUrl, storagePath, fileType } = await urlRes.json()

      // Step 2: upload file directly to Supabase Storage
      setProgress('Uploading file…')
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!uploadRes.ok) {
        setProgress('Upload failed. Please try again.')
        return
      }

      // Step 3: save metadata
      setProgress('Saving metadata…')
      const metaRes = await fetch('/api/internal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          storagePath,
          fileType,
          fileSize: file.size,
        }),
      })
      if (metaRes.ok) {
        const doc = await metaRes.json()
        onAdded(doc)
        setTitle('')
        setDescription('')
        setFile(null)
        setProgress('')
        if (fileRef.current) fileRef.current.value = ''
      } else {
        setProgress('Failed to save metadata.')
      }
    } catch {
      setProgress('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      {/* File picker */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      >
        {file ? (
          <div className="text-sm">
            <p className="font-semibold text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatSize(file.size)}</p>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-500">Click to upload a file</p>
            <p className="text-[10px] text-gray-400 mt-1">PDF, Excel, CSV, PNG, DOCX, PPTX · max 20 MB</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt,.docx,.pptx"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="File title (e.g. Q2 Sales Pipeline, Board Deck Mar 2026)"
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-400"
      />

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Key insight or summary (this is what the AI sees — be specific)"
        rows={2}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white placeholder-gray-400"
      />
      <p className="text-[10px] text-gray-400 -mt-1">The AI only reads your description above. Raw file contents are never sent to the AI.</p>

      <div className="flex items-center justify-between">
        {progress && <p className="text-xs text-blue-600">{progress}</p>}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function InternalPageClient({
  initialNotes,
  initialDocs,
}: {
  initialNotes: Note[]
  initialDocs: Doc[]
}) {
  const [tab, setTab] = useState<'notes' | 'documents'>('notes')
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [docs, setDocs] = useState<Doc[]>(initialDocs)

  async function deleteNote(id: string) {
    await fetch(`/api/internal/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/internal/documents/${id}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['notes', 'documents'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors capitalize ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'notes' ? `Notes (${notes.length})` : `Documents (${docs.length})`}
          </button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="space-y-4">
          {/* Add note */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Add Internal Note</h2>
            <NoteForm onAdded={note => setNotes(prev => [note, ...prev])} />
          </div>

          {/* Notes list */}
          {notes.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {notes.map(note => (
                <div key={note.id} className="flex items-start gap-3 p-4">
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${CATEGORY_COLORS[note.category]}`}>
                    {note.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed">{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Added {formatDate(note.created_at)} · expires {formatDate(note.expires_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove note"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-sm text-gray-500">No active notes.</p>
              <p className="text-xs text-gray-400 mt-1">Add a note above — it will influence the next brief generated.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-4">
          {/* Upload form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Upload Internal Document</h2>
            <DocUpload onAdded={doc => setDocs(prev => [doc, ...prev])} />
          </div>

          {/* Docs list */}
          {docs.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-start gap-3 p-4">
                  <span className="shrink-0 text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded uppercase mt-0.5">
                    {doc.file_type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{doc.title}</p>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{doc.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      {doc.file_size ? formatSize(doc.file_size) + ' · ' : ''}
                      Added {formatDate(doc.created_at)} · expires {formatDate(doc.expires_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Upload files above — only your description is shared with the AI.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
