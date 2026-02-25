'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Model {
    id: string
    created_at: string
}

export default function Sidebar() {
    const pathname = usePathname()
    const [models, setModels] = useState<Model[]>([])
    const [selectedModel, setSelectedModel] = useState('')

    useEffect(() => {
        fetch(`${API}/api/models`)
            .then(r => r.json())
            .then(m => {
                setModels(m)
                if (m[0]) setSelectedModel(m[0].id)
            })
    }, [])

    const navLinks = [
        { name: 'Dashboard', href: '/', icon: '📊' },
        { name: 'History', href: '/history', icon: '🕰️' },
        { name: 'Inference', href: '/infer', icon: '🧠' },
        { name: 'Labeling', href: '/label', icon: '🏷️' },
        { name: 'Batch Process', href: '/batch', icon: '📦' },
        { name: 'Training', href: '/train', icon: '⚙️' },
    ]

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 overflow-y-auto">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-sky-500/20">
                        M
                    </div>
                    <div>
                        <h1 className="text-lg font-bold font-display tracking-tight">MedNote</h1>
                        <p className="text-xs text-slate-500 font-medium">Cleaner & Extractor</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            <span className="text-lg">{link.icon}</span>
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/50">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Active Model
                </label>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full text-sm py-2 px-3 bg-slate-800 border-slate-700 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500/50 rounded-lg transition-all"
                    title="Select active clinical model"
                >
                    <option value="">Latest</option>
                    {models.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.id.slice(0, 8)} ({new Date(m.created_at).toLocaleDateString()})
                        </option>
                    ))}
                </select>

                <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-medium text-slate-400">API Connected</span>
                </div>
            </div>
        </aside>
    )
}
