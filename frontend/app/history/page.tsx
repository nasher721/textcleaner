'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Note } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { Skeleton } from '@/components/ui/Skeleton'

export default function History() {
    const [notes, setNotes] = useState<Note[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)

    const fetchNotes = async (q = '') => {
        setLoading(true)
        try {
            const data = q ? await api.notes.search(q) : await api.notes.all()
            setNotes(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotes()
    }, [])

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-slate-100">Clinical History</h1>
                <p className="text-slate-400">Search and recall past clinical note cleaning sessions.</p>
            </header>

            <GlassCard title="Search Notes">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search clinical notes (e.g. 'fever', 'pneumonia')..."
                        className="w-full bg-slate-900/50 border-slate-700 rounded-xl p-4 text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/50 transition-all placeholder-slate-600"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchNotes(query)}
                        title="Full-text search for clinical notes"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-mono">
                        Press Enter ↵
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="glass-card h-32 animate-pulse bg-slate-800/20" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {notes.map(n => (
                            <GlassCard
                                key={n.id}
                                className="hover:border-slate-500 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono text-sky-500 uppercase tracking-widest">Note #{n.id.slice(0, 6)}</span>
                                    <span className="text-xs text-slate-500">{new Date(n.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-300 line-clamp-2 italic text-sm">"{n.text}"</p>
                                <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase">
                                    <span className="group-hover:text-sky-400 transition-colors">📄 View Details</span>
                                    <span className="group-hover:text-emerald-400 transition-colors">🧠 Re-run Inference</span>
                                </div>
                            </GlassCard>
                        ))}
                        {notes.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                                No history found for "{query}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
