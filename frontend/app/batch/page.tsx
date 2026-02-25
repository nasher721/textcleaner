'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { InferenceResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

export default function Batch() {
    const [inputText, setInputText] = useState('')
    const [results, setResults] = useState<Array<{ input: string; result: InferenceResult }>>([])
    const [loading, setLoading] = useState(false)

    const processBatch = async () => {
        const lines = inputText.split('\n').filter(l => l.trim())
        if (!lines.length) return
        setLoading(true)
        try {
            const resp = await api.inference.batch(lines)
            setResults(lines.map((input, i) => ({ input, result: resp.results[i] })))
        } catch (error) {
            console.error('Batch failed:', error)
        } finally {
            setLoading(false)
        }
    }

    const downloadCSV = () => {
        const headers = ['Original', 'Cleaned', 'Findings']
        const rows = results.map(r => [
            `"${r.input.replace(/"/g, '""')}"`,
            `"${r.result.cleaned_text.replace(/"/g, '""')}"`,
            `"${JSON.stringify(r.result.structured_json).replace(/"/g, '""')}"`
        ].join(','))
        const csvContent = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `batch_export_${new Date().getTime()}.csv`
        a.click()
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Batch Processing</h1>
                <p className="text-slate-400">Process hundreds of notes simultaneously and export to CSV.</p>
            </header>

            <GlassCard subtitle="Input Queue">
                <textarea
                    rows={8}
                    className="w-full bg-slate-900/50 border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-sky-500/50"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter notes (one per line)..."
                    title="Batch Input"
                />
                <button
                    onClick={processBatch}
                    disabled={loading || !inputText.trim()}
                    className="w-full btn-primary mt-4"
                >
                    {loading ? 'Processing Batch...' : 'Run Batch Analysis'}
                </button>
            </GlassCard>

            {results.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-100">Results ({results.length})</h2>
                        <button
                            onClick={downloadCSV}
                            className="text-sm text-sky-400 hover:text-sky-300 font-medium flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 rounded-lg transition-colors border border-sky-500/20"
                        >
                            📥 Download CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto glass-card p-0 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800/50 text-slate-400 font-bold uppercase tracking-tighter text-[10px]">
                                <tr>
                                    <th className="px-4 py-3 border-b border-slate-700">Raw Preview</th>
                                    <th className="px-4 py-3 border-b border-slate-700">Cleaned Result</th>
                                    <th className="px-4 py-3 border-b border-slate-700">Entities</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {results.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-4 py-3 text-slate-500 font-mono truncate max-w-[200px]">{r.input}</td>
                                        <td className="px-4 py-3 text-slate-200">{r.result.cleaned_text.slice(0, 50)}...</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {Object.keys(r.result.structured_json).map(k => (
                                                    <span key={k} className="px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[10px] uppercase font-bold border border-sky-500/10 group-hover:border-sky-500/30 transition-colors">
                                                        {k}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
