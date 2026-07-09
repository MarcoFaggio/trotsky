"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function ActionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="the revenue actions queue" />;
}
