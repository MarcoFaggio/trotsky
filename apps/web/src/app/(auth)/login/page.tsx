"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-trosky-soft/60 via-background to-primary/5 p-4 dark:from-background dark:via-background dark:to-primary/15">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.14),transparent)] blur-3xl"
        aria-hidden
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="relative w-full max-w-md overflow-hidden border-border/80 bg-card/90 shadow-2xl shadow-black/[0.08] backdrop-blur-xl dark:border-white/10 dark:shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-trosky-red via-trosky-red to-trosky-red-dark" />
        <CardHeader className="space-y-1 text-center">
          <TroskyMark
            priority
            className="mx-auto mb-4 h-20 w-20 rounded-2xl p-2 sm:h-24 sm:w-24 sm:p-2.5"
          />
          <CardTitle className="text-2xl">Trosky</CardTitle>
          <CardDescription>
            Sign in to manage your hotel pricing strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 text-destructive text-sm p-3"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            {showDemoAccounts && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="mb-2 text-center font-medium text-foreground">
                  Pilot demo accounts
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      className="rounded-md border bg-background px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => fillDemoCredentials(account)}
                    >
                      <span className="block font-medium text-foreground">
                        {account.label}
                      </span>
                      <span className="block truncate">{account.email}</span>
                      <span className="block truncate">{account.password}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
