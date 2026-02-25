'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { DashboardStats } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.stats.get()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Notes', value: stats?.notes || 0, icon: '📄', color: 'text-sky-400' },
    { label: 'Active Models', value: stats?.models || 0, icon: '🤖', color: 'text-indigo-400' },
    { label: 'Labeled Sentences', value: stats?.labeled_sentences || 0, icon: '🏷️', color: 'text-emerald-400' },
    { label: 'Span Annotations', value: stats?.span_annotations || 0, icon: '🔍', color: 'text-amber-400' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Clinical Dashboard</h1>
        <p className="text-slate-400">System overview and data curation metrics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <GlassCard key={card.label} className="group hover:border-sky-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-900 ${card.color}`}>
                +4%
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-100">{card.value.toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">{card.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard title="Labeling Velocity" subtitle="Last 7 Days">
          <div className="flex items-end gap-2 h-32 mb-4">
            {stats?.labeling_history?.map((h) => (
              <div key={h.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-sky-500/20 group-hover:bg-sky-500/40 border-t-2 border-sky-500 transition-all duration-300 rounded-t"
                  style={{ height: `${Math.min(100, (h.count / 50) * 100)}%` }}
                />
                <span className="text-[10px] text-slate-600 font-mono -rotate-45 mt-2">{h.day.split('-').slice(1).join('/')}</span>
              </div>
            ))}
            {(!stats?.labeling_history || stats.labeling_history.length === 0) && (
              <div className="flex-1 h-full flex items-center justify-center text-slate-700 italic text-sm">
                No recent labeling activity
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard title="Recent Activity" subtitle="Last 7 Days">
          <div className="space-y-4">
            {stats?.labeling_history?.slice(-3).reverse().map((h) => (
              <div key={h.day} className="flex items-center gap-4 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-slate-200"><span className="text-emerald-400 font-mono">{h.count}</span> sentences labeled</p>
                  <p className="text-xs text-slate-500">{h.day}</p>
                </div>
              </div>
            ))}
            {(!stats?.labeling_history || stats.labeling_history.length === 0) && (
              <p className="text-slate-500 italic text-sm">No recent labeling activity</p>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="System Health" subtitle="Service Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              ⚡
            </div>
            <div>
              <div className="text-sm font-bold">API Gateway</div>
              <div className="text-xs text-slate-500">{stats ? '🟢 Operational' : '🔴 Offline'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">🧠</div>
            <div>
              <div className="text-sm font-bold">Inference Engine</div>
              <div className="text-xs text-slate-500">{stats ? `${stats.models} model(s) ready` : 'Unknown'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">💾</div>
            <div>
              <div className="text-sm font-bold">Data Layer</div>
              <div className="text-xs text-slate-500">{stats ? `${stats.notes} notes stored` : 'Unknown'}</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
