"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function PortfolioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Failed to load portfolio</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Please try again in a moment.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
