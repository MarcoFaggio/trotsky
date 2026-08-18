"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase, TextField } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { TroskyWordmark } from "@/components/brand/trosky-logo";

const demoAccounts = [
  { label: "Analyst demo", email: "analyst@example.com", password: "Password123!" },
  { label: "Client demo", email: "client@example.com", password: "Password123!" },
];

const showDemoAccounts = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-svh bg-primary">
      <section className="relative hidden min-h-svh w-[46%] overflow-hidden lg:block">
        <img
          src="/login-hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(72, 0, 0, 0.62) 0%, rgba(32, 0, 0, 0.78) 100%),
              color-mix(in srgb, var(--color-brand-700) 28%, transparent)
            `,
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-10 xl:px-16">
          <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-white xl:text-5xl">
            Trosky
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/85 xl:text-lg">
            Hotel revenue intelligence that keeps pace with the market — competitor
            rates, pace, and recommended actions in one cockpit for analysts and owners.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-svh flex-1 flex-col bg-primary">
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-[420px]">
            <TroskyWordmark priority />

            <h2 className="mt-10 text-4xl font-semibold tracking-tight text-primary sm:text-[2.5rem]">
              Login
            </h2>
            <p className="mt-2 text-base text-tertiary">
              Sign in to your revenue dashboard
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-error-primary px-3 py-2.5 text-sm text-error-primary ring-1 ring-error_subtle ring-inset"
                >
                  {error}
                </div>
              )}

              <Input
                label="Your Email"
                id="email"
                type="email"
                name="email"
                placeholder="you@hotel.com"
                value={email}
                onChange={setEmail}
                isRequired
                hideRequiredIndicator
                size="md"
                autoComplete="email"
              />

              <TextField
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                isRequired
                autoComplete="current-password"
              >
                <Label>Password</Label>
                <div className="relative w-full">
                  <InputBase
                    size="md"
                    placeholder="Enter your password"
                    inputClassName="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-1.5 top-1/2 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition-colors duration-200 hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </TextField>

              <Button
                type="submit"
                size="xl"
                color="primary"
                className="mt-2 w-full justify-center rounded-lg"
                isDisabled={loading}
                isLoading={loading}
                showTextWhileLoading
              >
                {loading ? "Signing in..." : "Login"}
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
                      className="cursor-pointer rounded-lg bg-primary px-3 py-2.5 text-left shadow-xs ring-1 ring-primary ring-inset transition-colors duration-200 hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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

        <p className="px-6 pb-6 text-center text-xs text-tertiary sm:px-10 lg:px-16">
          © 2026 Trosky. All rights reserved.
        </p>
      </section>
    </div>
  );
}
