export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse space-y-4">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-48 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-slate-200" />
    </div>
  );
}
