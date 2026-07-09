"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function PaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="the pace dashboard" />;
}
