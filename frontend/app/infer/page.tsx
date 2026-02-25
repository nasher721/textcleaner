'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { InferenceResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

export default function Infer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<InferenceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [threshold, setThreshold] = useState(0.5)

  const runInference = useCallback(async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const out = await api.inference.run(text, undefined, threshold)
      setResult(out)
    } catch (err) {
      console.error('Inference failed:', err)
    } finally {
      setLoading(false)
    }
  }, [text, threshold])

  // Debounced inference
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.length > 10) runInference()
    }, 800)
    return () => clearTimeout(timer)
  }, [text, threshold, runInference])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Inference Lab</h1>
          <p className="text-slate-400">Live clinical entity extraction and cleaning.</p>
        </div>
        <div className="flex items-center gap-6 glass-card py-2 px-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="threshold-slider" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Keep Threshold: {threshold}
            </label>
            <input
              id="threshold-slider"
              type="range" min="0" max="1" step="0.1"
              className="w-32 accent-sky-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              title="Adjust keep threshold"
            />
          </div>
          <button
            onClick={runInference}
            disabled={loading}
            className="btn-primary px-6"
          >
            {loading ? 'Processing...' : 'Run Manual'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <GlassCard subtitle="Source Clinical Note" className="flex flex-col">
          <textarea
            id="clinical-note-input"
            className="flex-1 w-full bg-transparent border-none resize-none text-slate-200 font-mono text-sm focus:ring-0 p-0 placeholder-slate-600"
            placeholder="Paste raw clinical note here (patient names, dates, etc)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            title="Raw clinical note input"
          />
        </GlassCard>

        <GlassCard subtitle="Live Cleaned View" className="flex flex-col bg-slate-900/40">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && !result ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
                <div className="h-4 bg-slate-800 rounded w-5/6" />
              </div>
            ) : result ? (
              <div className="space-y-6">
                <p className="text-slate-200 leading-relaxed font-medium">
                  {result.cleaned_text || "No text remaining after cleaning."}
                </p>

                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Extracted Findings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(result.structured_json).map(([key, val]) => (
                      <div key={key} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl group hover:border-sky-500/30 transition-all">
                        <div className="text-[10px] font-bold text-sky-400 uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-slate-200 font-medium">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-widest transition-all">
                  💾 Save Feedback
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 italic">
                Awaiting input for analysis...
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
