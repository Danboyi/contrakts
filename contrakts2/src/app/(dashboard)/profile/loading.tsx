import { Skeleton } from '@/components/ui/spinner'

export default function ProfileLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
          <div className="mb-4 flex flex-col items-center">
            <Skeleton className="mb-3 h-20 w-20 rounded-full" />
            <Skeleton className="mb-1 h-5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Trust score + details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface))] p-6">
            <Skeleton className="mb-4 h-5 w-28" />
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
