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
    <main className="min-h-screen bg-secondary">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <section className="space-y-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <TroskyMark className="h-9 w-9" />
            <span className="text-md font-semibold text-primary">Trosky</span>
          </Link>
          <div className="space-y-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-brand-secondary uppercase">
              Group inquiry
            </p>
            <h1 className="max-w-xl text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
              Ask once. Let the hotel team pick it up cleanly.
            </h1>
            <p className="max-w-lg text-lg text-tertiary">
              Send room block, meeting, school trip, wedding, or offsite requests into Trosky.
            </p>
          </div>
          <div className="grid gap-6 text-sm sm:grid-cols-3">
            {[
              { title: "Group-aware", body: "Rooms, guests, events, and gaps." },
              { title: "Sales-ready", body: "A lead the hotel can qualify." },
              { title: "Structured", body: "Captured once, routed correctly." },
            ].map((item) => (
              <div key={item.title} className="border-t border-secondary pt-4">
                <p className="font-semibold text-primary">{item.title}</p>
                <p className="mt-1 text-tertiary">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-solid" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-primary">Send an inquiry</h2>
            <p className="mt-1 text-sm text-tertiary">
              Include as much detail as you know. Unknowns are fine.
            </p>
          </div>
          <PublicInquiryForm hotels={hotels} />
        </section>
      </div>
    </main>
  );
}
