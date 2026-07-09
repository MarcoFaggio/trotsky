"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** What failed, e.g. "the revenue actions queue". */
  subject: string;
}

/** Shared error boundary body for route-level error.tsx files. */
export function RouteErrorFallback({
  error,
  reset,
  subject,
}: RouteErrorFallbackProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-destructive" aria-hidden />
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
        Something went wrong
      </h2>
      <p className="mb-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Failed to load {subject}. This may be a temporary issue — trying again
        usually resolves it.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
