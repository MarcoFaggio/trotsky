import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Trosky runs the web app on{" "}
          <span className="font-mono text-foreground">http://localhost:3030</span> in
          development. If you used port 3000, you may be on a different process.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Home
        </Link>
        <Link href="/login" className="rounded-md border border-input px-4 py-2 text-sm">
          Log in
        </Link>
      </div>
    </div>
  );
}
