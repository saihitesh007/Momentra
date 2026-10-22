// Reusable loading skeleton shapes

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card p-4 space-y-3 ${className}`}>
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function SkeletonBudget() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTimeline() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

