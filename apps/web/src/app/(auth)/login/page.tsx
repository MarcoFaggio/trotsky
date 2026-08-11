"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { TroskyMark } from "@/components/brand/trosky-logo";

const demoAccounts = [
  { label: "Analyst demo", email: "analyst@example.com", password: "Password123!" },
  { label: "Client demo", email: "client@example.com", password: "Password123!" },
];

const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials(account: (typeof demoAccounts)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="relative flex min-h-screen">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 0% 0%, color-mix(in srgb, var(--color-brand-600) 12%, transparent), transparent 55%),
            var(--color-bg-secondary)
          `,
        }}
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <TroskyMark priority className="mx-auto mb-5 h-16 w-16" />
          <p className="text-sm font-semibold tracking-[0.18em] text-brand-secondary uppercase">
            Trosky
          </p>
          <h1 className="mt-2 text-display-xs font-semibold text-primary">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-tertiary">
            Hotel revenue intelligence for your team
          </p>
        </div>

        <div className="rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-error-primary px-3 py-2.5 text-sm text-error-primary ring-1 ring-error_subtle ring-inset"
              >
                {error}
              </div>
            )}
            <Input
              label="Email"
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              isRequired
              size="md"
            />
            <Input
              label="Password"
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              isRequired
              size="md"
            />
            <Button
              type="submit"
              size="lg"
              color="primary"
              className="w-full justify-center"
              isDisabled={loading}
              isLoading={loading}
              showTextWhileLoading
              iconTrailing={loading ? undefined : ArrowRight}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {showDemoAccounts && (
            <div className="mt-6 rounded-xl bg-secondary_alt p-3 ring-1 ring-secondary ring-inset">
              <p className="mb-2 text-center text-xs font-semibold text-secondary">
                Pilot demo accounts
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className="rounded-lg bg-primary px-3 py-2.5 text-left shadow-xs ring-1 ring-primary ring-inset transition-colors hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    onClick={() => fillDemoCredentials(account)}
                  >
                    <span className="block text-sm font-semibold text-secondary">
                      {account.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-tertiary">
                      {account.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
