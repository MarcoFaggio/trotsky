import { Skeleton } from "@/components/ui/skeleton";

/** Generic route-loading skeleton: page header, metric row, content block. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-border/80 pb-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {cards > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}
