'use client'

import { useEffect, useState } from 'react'
import type { WeeklyAction } from '@/lib/types'

const ROLES = ['All', 'CEO', 'CFO', 'CMO', 'CTO', 'CBPO', 'VP HR'] as const
type Role = typeof ROLES[number]

const OWNER_COLORS: Record<string, string> = {
  CEO:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  CFO:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  CMO:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  CTO:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  CBPO:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'VP HR':'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  All:    'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

interface CustomAction {
  action: string
  owner: string
  priority: 'high' | 'medium' | 'low'
  section: string
  isCustom: true
  id: string
}

interface Props {
  briefId: string
  actions: WeeklyAction[]
  userRole?: string | null
}

export default function ActionItemsPanel({ briefId, actions, userRole }: Props) {
  const storageKey   = `actions-done-${briefId}`
  const customKey    = `actions-custom-${briefId}`
  const deletedKey   = `actions-deleted-${briefId}`
  const editedKey    = `actions-edited-${briefId}`
  const roleKey      = `actions-role-${briefId}`

  const [done, setDone]           = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)
  const [editMode, setEditMode]   = useState(false)
  const [customActions, setCustomActions] = useState<CustomAction[]>([])
  const [deletedIds, setDeletedIds]       = useState<Set<string>>(new Set())
  const [editedTexts, setEditedTexts]     = useState<Record<string, string>>({})
  const [selectedRole, setSelectedRole]   = useState<Role>('All')
  const [addingNew, setAddingNew]         = useState(false)
  const [newText, setNewText]             = useState('')
  const [newOwner, setNewOwner]           = useState<string>('All')
  const [newPriority, setNewPriority]     = useState<'high' | 'medium' | 'low'>('medium')
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editingText, setEditingText]     = useState('')

  // Load persisted state
  useEffect(() => {
    try {
      const storedDone    = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[]
      const storedCustom  = JSON.parse(localStorage.getItem(customKey) ?? '[]') as CustomAction[]
      const storedDeleted = JSON.parse(localStorage.getItem(deletedKey) ?? '[]') as string[]
      const storedEdited  = JSON.parse(localStorage.getItem(editedKey) ?? '{}') as Record<string, string>
      const storedRole    = (localStorage.getItem(roleKey) ?? 'All') as Role
      setDone(new Set(storedDone))
      setCustomActions(storedCustom)
      setDeletedIds(new Set(storedDeleted))
      setEditedTexts(storedEdited)
      // Default to userRole if no stored preference
      if (userRole && storedRole === 'All' && !localStorage.getItem(roleKey)) {
        const matched = ROLES.find(r => r === userRole)
        if (matched) setSelectedRole(matched)
      } else {
        setSelectedRole(storedRole)
      }
    } catch { /* ignore */ }
  }, [storageKey, customKey, deletedKey, editedKey, roleKey, userRole])

  function persist<T>(key: string, value: T) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  }

  function toggleDone(id: string) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      persist(storageKey, [...next])
      return next
    })
  }

  function deleteAction(id: string) {
    setDeletedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      persist(deletedKey, [...next])
      return next
    })
  }

  function deleteCustomAction(id: string) {
    setCustomActions(prev => {
      const next = prev.filter(a => a.id !== id)
      persist(customKey, next)
      return next
    })
  }

  function startEditing(id: string, currentText: string) {
    setEditingId(id)
    setEditingText(currentText)
  }

  function saveEdit(id: string) {
    if (!editingText.trim()) { setEditingId(null); return }
    if (id.startsWith('custom-')) {
      setCustomActions(prev => {
        const next = prev.map(a => a.id === id ? { ...a, action: editingText.trim() } : a)
        persist(customKey, next)
        return next
      })
    } else {
      setEditedTexts(prev => {
        const next = { ...prev, [id]: editingText.trim() }
        persist(editedKey, next)
        return next
      })
    }
    setEditingId(null)
  }

  function addAction() {
    if (!newText.trim()) return
    const action: CustomAction = {
      action: newText.trim(),
      owner: newOwner,
      priority: newPriority,
      section: 'Custom',
      isCustom: true,
      id: `custom-${Date.now()}`,
    }
    setCustomActions(prev => {
      const next = [...prev, action]
      persist(customKey, next)
      return next
    })
    setNewText('')
    setNewOwner('All')
    setNewPriority('medium')
    setAddingNew(false)
  }

  function setRole(role: Role) {
    setSelectedRole(role)
    persist(roleKey, role)
  }

  // Build combined list: AI actions (not deleted) + custom actions
  const aiActions = actions
    .map((a, i) => ({ ...a, id: `ai-${i}`, isCustom: false as const }))
    .filter(a => !deletedIds.has(a.id))

  const allActions = [
    ...aiActions.map(a => ({ ...a, displayText: editedTexts[a.id] ?? a.action })),
    ...customActions.map(a => ({ ...a, displayText: editedTexts[a.id] ?? a.action })),
  ].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  // Role filter
  const filtered = selectedRole === 'All'
    ? allActions
    : allActions.filter(a => a.owner === selectedRole || a.owner === 'All')

  const doneCount = filtered.filter(a => done.has(a.id)).length
  const allDone   = filtered.length > 0 && doneCount === filtered.length
  const highCount = filtered.filter(a => a.priority === 'high' && !done.has(a.id)).length

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden ${allDone ? 'border-emerald-200 dark:border-emerald-700' : 'border-blue-200 dark:border-blue-700/50'}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <button onClick={() => setCollapsed(v => !v)} className="flex items-center gap-3 flex-1 text-left">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">This Week&apos;s Actions</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            allDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            {doneCount}/{filtered.length} done
          </span>
          {highCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {highCount} high priority
            </span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <button
          onClick={() => setEditMode(v => !v)}
          className={`ml-3 shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            editMode
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
          }`}
        >
          {editMode ? 'Done editing' : 'Edit'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* ── Role filter ── */}
          <div className="px-5 pb-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-1">Show for</span>
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setRole(role)}
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors ${
                  selectedRole === role
                    ? OWNER_COLORS[role]
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* ── Action list ── */}
          <div className="border-t border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
            {filtered.length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
                No actions for {selectedRole} this week.
              </p>
            )}
            {filtered.map((action) => (
              <div key={action.id} className={`flex items-start gap-3 px-5 py-3 transition-colors ${
                done.has(action.id) ? 'bg-gray-50/60 dark:bg-white/3' : 'hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
              }`}>
                {/* Checkbox */}
                {!editMode && (
                  <button
                    onClick={() => toggleDone(action.id)}
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      done.has(action.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {done.has(action.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === action.id ? (
                    <div className="flex gap-2 items-start">
                      <textarea
                        className="flex-1 text-sm border border-blue-300 dark:border-blue-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                        rows={2}
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => saveEdit(action.id)} className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm leading-snug ${done.has(action.id) ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                      {action.displayText}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${OWNER_COLORS[action.owner] ?? 'bg-gray-100 text-gray-600'}`}>
                      {action.owner}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                      action.priority === 'high'   ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                      action.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                                     'bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                    }`}>
                      {action.priority}
                    </span>
                    {action.section !== 'Custom' && <span className="text-[10px] text-gray-400 dark:text-gray-500">{action.section}</span>}
                    {'isCustom' in action && action.isCustom && (
                      <span className="text-[10px] text-blue-400 dark:text-blue-500 font-medium">custom</span>
                    )}
                  </div>
                </div>

                {/* Edit-mode controls */}
                {editMode && editingId !== action.id && (
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      onClick={() => startEditing(action.id, action.displayText)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => 'isCustom' in action && action.isCustom ? deleteCustomAction(action.id) : deleteAction(action.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Add new action ── */}
          {editMode && (
            <div className="border-t border-gray-100 dark:border-white/5 px-5 py-3">
              {addingNew ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-400"
                    rows={2}
                    placeholder="Describe the action…"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={newOwner}
                      onChange={e => setNewOwner(e.target.value)}
                      className="text-xs border border-gray-200 dark:border-white/10 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                      className="text-xs border border-gray-200 dark:border-white/10 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <button onClick={addAction} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors">
                      Add
                    </button>
                    <button onClick={() => { setAddingNew(false); setNewText('') }} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNew(true)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add action item
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
