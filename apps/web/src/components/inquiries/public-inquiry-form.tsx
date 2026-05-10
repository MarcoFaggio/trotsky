"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HotelOption = {
  id: string;
  name: string;
  city: string | null;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; inquiryId: string }
  | { status: "error"; message: string };

export function PublicInquiryForm({ hotels }: { hotels: HotelOption[] }) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState({ status: "submitting" });

    const response = await fetch("/api/inquiries/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: form.get("hotelId"),
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        organizationName: form.get("organizationName"),
        message: form.get("message"),
        source: "WEB_CHAT",
        website: form.get("website"),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setState({
        status: "error",
        message: payload.error || "Could not send inquiry.",
      });
      return;
    }

    event.currentTarget.reset();
    setState({ status: "success", inquiryId: payload.inquiry.id });
  }

  if (hotels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">
        No active hotels are available for inquiries yet.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot for bots — leave blank */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
        defaultValue=""
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="hotelId">Hotel</Label>
          <select
            id="hotelId"
            name="hotelId"
            required
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
                {hotel.city ? `, ${hotel.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization</Label>
          <Input
            id="organizationName"
            name="organizationName"
            placeholder="Company, school, planner"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Inquiry</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={5}
          maxLength={4000}
          placeholder="Tell us dates, rooms, guests, budget, and any meeting or catering needs."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={state.status === "submitting"}>
          {state.status === "submitting" ? "Sending..." : "Send inquiry"}
        </Button>
        {state.status === "success" && (
          <p className="text-sm text-emerald-700">
            Inquiry received. Reference {state.inquiryId.slice(-6)}.
          </p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}
      </div>
    </form>
  );
}
