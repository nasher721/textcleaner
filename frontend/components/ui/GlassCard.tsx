import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
}

export function GlassCard({ children, className = '', title, subtitle }: GlassCardProps) {
    return (
        <div className={`glass-card ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
                    {subtitle && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
}
