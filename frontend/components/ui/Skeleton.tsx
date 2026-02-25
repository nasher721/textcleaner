interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
    return (
        <div
            className={`bg-slate-800 animate-pulse ${variant === 'circle' ? 'rounded-full' : 'rounded'} ${className}`}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="glass-card space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
            </div>
        </div>
    );
}
