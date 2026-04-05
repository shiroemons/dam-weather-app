export default function DamCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface-primary shadow-sm p-5 animate-pulse">
      <div className="h-5 w-3/5 bg-border-primary rounded" />
      <div className="mt-0.5 h-4 w-2/5 bg-border-primary rounded" />
      <div className="mt-4 flex gap-3">
        <div className="flex-1 h-24 bg-border-primary rounded" />
        <div className="flex-1 h-24 bg-border-primary rounded" />
      </div>
    </div>
  );
}
