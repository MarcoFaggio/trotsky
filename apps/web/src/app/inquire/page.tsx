import type { Metadata } from "next";
import { prisma } from "@hotel-pricing/db";
import { PublicHeader } from "@/components/landing/public-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PublicInquiryForm } from "@/components/inquiries/public-inquiry-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Send an inquiry",
  description:
    "Send a room block, meeting, wedding or offsite request to a hotel on Trosky, or ask the Trosky team for a walkthrough.",
};

const PROMISES = [
  { title: "Group-aware", body: "Rooms, guests, dates and the gaps you still need to fill." },
  { title: "Sales-ready", body: "Arrives as a lead the hotel team can qualify and quote." },
  { title: "Captured once", body: "Structured on arrival and routed to the right property." },
];

export default async function PublicInquiryPage() {
  const hotels = await prisma.hotel.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="landing-page flex min-h-screen flex-col bg-secondary font-body text-primary antialiased">
      <PublicHeader />
      <main id="main" className="relative flex-1">
        <div
          aria-hidden
          className="landing-hairline-grid pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        />
        <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16 lg:py-24">
          <section className="lg:sticky lg:top-24">
            <p className="flex items-center gap-2.5 text-[12px] font-semibold tracking-[0.14em] text-brand-secondary uppercase">
              <span aria-hidden className="h-px w-6 bg-brand-solid" />
              Inquiries
            </p>
            <h1 className="mt-4 max-w-xl text-display-sm font-semibold tracking-tight text-primary sm:text-display-md">
              Ask once. The hotel team picks it up{" "}
              <em className="landing-serif">with the context attached.</em>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-tertiary">
              Room blocks, meetings, weddings, school trips and offsites go
              straight into the property&apos;s inquiry inbox on Trosky. Hotel
              operators asking about the product can use the same form; mention
              a walkthrough and the Cork team will reply.
            </p>
            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {PROMISES.map((item) => (
                <div key={item.title} className="border-t border-secondary pt-4">
                  <dt className="text-sm font-semibold text-primary">{item.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-tertiary">{item.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-primary p-6 shadow-2xl ring-1 ring-secondary sm:p-8">
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
      <LandingFooter />
    </div>
  );
}
