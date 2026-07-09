"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function HotelSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="the hotel settings" />;
}
