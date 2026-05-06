// =============================================================================
// app/(dashboard)/settings/settings-skeleton.tsx
// Skeleton loader for the settings form — zero layout shift on hydration.
// =============================================================================

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((section) => (
        <div
          key={section}
          className="rounded-xl border border-white/[0.06] bg-[#111111] p-6"
        >
          {/* Section title */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-white/[0.06]" />
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: section === 4 ? 2 : 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-white/[0.04]" />
                <div className="h-10 w-full rounded-lg bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save button */}
      <div className="flex justify-end">
        <div className="h-10 w-32 rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}
