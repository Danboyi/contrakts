import { Skeleton, ContractCardSkeleton } from '@/components/ui/spinner'

export default function ContractsLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-[var(--radius-md)]" />
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-[var(--radius-md)]" />
        ))}
      </div>

      {/* Contract cards */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ContractCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
