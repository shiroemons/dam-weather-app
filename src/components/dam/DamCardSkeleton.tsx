export default function DamCardSkeleton(): JSX.Element {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-5 animate-pulse">
      <div className="h-5 w-3/5 bg-gray-200 rounded" />
      <div className="mt-0.5 h-4 w-2/5 bg-gray-200 rounded" />
      <div className="mt-4 flex gap-3">
        <div className="flex-1 h-24 bg-gray-200 rounded" />
        <div className="flex-1 h-24 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
