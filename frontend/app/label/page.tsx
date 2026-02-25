'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { Note } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

export default function Label() {
  const [sentences, setSentences] = useState<any[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const data = await api.labeling.sentences()
      setSentences(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const labelSent = useCallback(async (idx: number, label: string) => {
    if (!sentences[idx]) return
    const id = sentences[idx].id

    // Optimistic update
    const newSentences = [...sentences]
    newSentences[idx] = { ...newSentences[idx], last_label: label }
    setSentences(newSentences)

    await api.labeling.submit(id, label)

    if (idx < sentences.length - 1) {
      setActiveIdx(idx + 1)
    }
  }, [sentences])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA') return

      if (e.key.toLowerCase() === 'k') labelSent(activeIdx, 'KEEP')
      if (e.key.toLowerCase() === 'r') labelSent(activeIdx, 'REMOVE')
      if (e.key === 'ArrowDown' && activeIdx < sentences.length - 1) setActiveIdx(activeIdx + 1)
      if (e.key === 'ArrowUp' && activeIdx > 0) setActiveIdx(activeIdx - 1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIdx, sentences, labelSent])

  if (loading) return <div className="text-center py-20 text-slate-500">Loading pipeline...</div>

  const progress = Math.round((sentences.filter(s => s.last_label).length / sentences.length) * 100) || 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Data Curation</h1>
          <p className="text-slate-400">Classify sentences to improve model accuracy.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Session Progress</div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-emerald-400">{progress}%</span>
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {sentences.map((s, i) => (
          <GlassCard
            key={s.id}
            className={`transition-all duration-200 cursor-pointer border-l-4 ${activeIdx === i ? 'border-l-sky-500 bg-slate-800/80 scale-[1.02] shadow-xl' :
                s.last_label === 'KEEP' ? 'border-l-emerald-500/50' :
                  s.last_label === 'REMOVE' ? 'border-l-rose-500/50' : 'border-l-transparent opacity-60'
              }`}
          >
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${activeIdx === i ? 'bg-sky-500 text-white border-sky-400' : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}>
                  {i + 1}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <p className={`text-lg leading-relaxed ${activeIdx === i ? 'text-slate-100' : 'text-slate-400'}`}>
                  {s.text}
                </p>

                {activeIdx === i && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => labelSent(i, 'KEEP')}
                      className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      [K] Keep
                    </button>
                    <button
                      onClick={() => labelSent(i, 'REMOVE')}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      [R] Remove
                    </button>
                    <span className="text-[10px] text-slate-500 ml-auto italic">Use K/R hotkeys or arrows</span>
                  </div>
                )}
              </div>

              {s.last_label && (
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${s.last_label === 'KEEP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                  {s.last_label}
                </div>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
