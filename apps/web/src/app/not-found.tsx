import Link from "next/link";
import { TroskyMark } from "@/components/brand/trosky-logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <TroskyMark className="h-14 w-14" />
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          This page doesn&apos;t exist
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          The link may be outdated, or the page may have moved. Head back to
          your command centre to pick up where you left off.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-trosky-red-dark"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-full border border-input px-5 py-2 text-sm transition-colors hover:bg-accent"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
