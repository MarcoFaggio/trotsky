import Link from "next/link";
import { prisma } from "@hotel-pricing/db";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { PublicInquiryForm } from "@/components/inquiries/public-inquiry-form";

export const dynamic = "force-dynamic";

export default async function PublicInquiryPage() {
  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
        <section className="space-y-8">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2.5 text-sm font-semibold">
            <TroskyMark className="h-9 w-9" />
            <span className="truncate text-trosky-ink dark:text-foreground">Trosky</span>
          </Link>
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Hotel inquiry capture
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
              Ask once. Let the hotel sales team pick it up cleanly.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              Send room block, meeting, school trip, wedding, or offsite requests
              into Trosky. The inquiry is structured automatically for hotel teams.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="border-t pt-3">
              <p className="font-medium text-foreground">Group-aware</p>
              <p>Detects rooms, guests, events, and missing details.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium text-foreground">Sales-ready</p>
              <p>Creates a lead the hotel can qualify and quote.</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium text-foreground">Model-ready</p>
              <p>Uses fallback logic now, with AI provider placeholders ready.</p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm md:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary to-landing-emerald" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Send an inquiry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Include as much detail as you know. Unknowns are fine.
            </p>
          </div>
          <PublicInquiryForm hotels={hotels} />
        </section>
      </div>
    </main>
  );
}
