"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function RateCalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="the rate calendar" />;
}
