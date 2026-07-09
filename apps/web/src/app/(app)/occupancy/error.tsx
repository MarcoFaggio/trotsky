"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function OccupancyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="the occupancy editor" />;
}
