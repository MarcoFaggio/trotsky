"use client";

import { RouteErrorFallback } from "@/components/ui/route-error";

export default function PromotionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} subject="your promotions" />;
}
