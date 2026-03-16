import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Seven day cards */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-[130px] shrink-0 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[350px] w-full rounded-lg" />
      </div>

      {/* Competitor cards */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-52 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
