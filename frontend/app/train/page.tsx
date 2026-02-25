'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Model } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

export default function Train() {
  const [progress, setProgress] = useState<{ status: string; progress: number }>({ status: 'idle', progress: 0 })
  const [models, setModels] = useState<Model[]>([])
  const [config, setConfig] = useState({
    base_model: 'en_core_web_sm',
    max_steps: 100,
    lr: 0.001,
    dropout: 0.2,
    batch_size: 32
  })

  const loadModels = () => api.models.list().then(setModels)

  useEffect(() => {
    loadModels()
    const i = setInterval(() => {
      api.models.progress()
        .then(setProgress)
        .catch(() => { })
    }, 2000)
    return () => clearInterval(i)
  }, [])

  const startTraining = () => {
    api.models.train(config)
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Model Training</h1>
        <p className="text-slate-400">Configure and monitor spaCy NLP pipeline training sessions.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard subtitle="Pipeline Hyperparameters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="base_model" className="text-sm font-medium text-slate-300">Base Model</label>
                <select
                  id="base_model"
                  className="w-full bg-slate-900 border-slate-700 rounded-lg p-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-sky-500/50 transition-all"
                  value={config.base_model}
                  onChange={e => setConfig({ ...config, base_model: e.target.value })}
                  title="Select base model"
                >
                  <option value="en_core_web_sm">en_core_web_sm (Fast)</option>
                  <option value="en_core_web_md">en_core_web_md (Medium)</option>
                  <option value="en_core_web_lg">en_core_web_lg (Accurate)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="max_steps" className="text-sm font-medium text-slate-300">Max Steps: {config.max_steps}</label>
                <input
                  id="max_steps"
                  type="range" min="10" max="1000" step="10"
                  className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none cursor-pointer h-2"
                  value={config.max_steps}
                  onChange={e => setConfig({ ...config, max_steps: parseInt(e.target.value) })}
                  title="Maximum training steps"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lr" className="text-sm font-medium text-slate-300">Learning Rate: {config.lr}</label>
                <input
                  id="lr"
                  type="range" min="0.0001" max="0.01" step="0.0001"
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg appearance-none cursor-pointer h-2"
                  value={config.lr}
                  onChange={e => setConfig({ ...config, lr: parseFloat(e.target.value) })}
                  title="Learning rate"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="dropout" className="text-sm font-medium text-slate-300">Dropout: {config.dropout}</label>
                <input
                  id="dropout"
                  type="range" min="0" max="0.5" step="0.05"
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg appearance-none cursor-pointer h-2"
                  value={config.dropout}
                  onChange={e => setConfig({ ...config, dropout: parseFloat(e.target.value) })}
                  title="Dropout rate"
                />
              </div>
            </div>

            <button
              onClick={startTraining}
              disabled={progress.status === 'training'}
              className="w-full btn-primary h-12 text-lg mt-8"
            >
              {progress.status === 'training' ? 'Training in Progress...' : 'Launch Training Pipeline'}
            </button>
          </GlassCard>

          {progress.status !== 'idle' && (
            <GlassCard title="Active Session">
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                Processing components: <span className="text-slate-300">ner, parser, tagger</span>
              </p>
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-100 uppercase tracking-widest text-xs">Model Inventory</h3>
            <button onClick={loadModels} className="text-[10px] uppercase font-bold text-sky-500 hover:text-sky-400">Refresh</button>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {models.map(m => (
              <GlassCard key={m.id} className="hover:border-slate-500 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-[10px] text-slate-500">{m.id.slice(0, 8)}</div>
                  {m.is_active && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <div className="text-sm font-bold text-slate-100 mb-1">v{m.version}</div>
                <div className="text-xs text-slate-400 mb-3">{m.base_model}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] bg-slate-900 rounded p-1.5 border border-slate-800">
                    <div className="text-slate-500 uppercase font-bold">Steps</div>
                    <div className="text-slate-200">{m.max_steps || 'N/A'}</div>
                  </div>
                  <div className="text-[10px] bg-slate-900 rounded p-1.5 border border-slate-800">
                    <div className="text-slate-500 uppercase font-bold">LR</div>
                    <div className="text-slate-200">{m.lr || 'N/A'}</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
