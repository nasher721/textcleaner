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
            {stats?.labeling_history?.map((h) => {
              const heightClass = `h-[${Math.min(100, (h.count / 50) * 100)}%]`;
              return (
                <div key={h.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className={`w-full bg-sky-500/20 group-hover:bg-sky-500/40 border-t-2 border-sky-500 transition-all duration-300 rounded-t`}
                    style={{ height: `${Math.min(100, (h.count / 50) * 100)}%` }} // Still using inline style for dynamic height, will move to CSS variables if needed
                  />
                  <span className="text-[10px] text-slate-600 font-mono -rotate-45 mt-2">{h.day.split('-').slice(1).join('/')}</span>
                </div>
              );
            })}
            {(!stats?.labeling_history || stats.labeling_history.length === 0) && (
              <div className="flex-1 h-full flex items-center justify-center text-slate-700 italic text-sm">
                No recent labeling activity
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard title="Recent Activity" subtitle="Real-time log">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <div className="flex-1">
                  <p className="text-slate-200">Model <span className="text-sky-400 font-mono">v1.2.4</span> inference completed</p>
                  <p className="text-xs text-slate-500">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard title="System Health" subtitle="Hardware & Service Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              ⚡
            </div>
            <div>
              <div className="text-sm font-bold">API Gateway</div>
              <div className="text-xs text-slate-500">99.9% Uptime</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              🧠
            </div>
            <div>
              <div className="text-sm font-bold">Inference Engine</div>
              <div className="text-xs text-slate-500">v3.4.1 Connected</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              💾
            </div>
            <div>
              <div className="text-sm font-bold">Vector Database</div>
              <div className="text-xs text-slate-500">Stable (1.2GB)</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
