"use client";

import { Container, Reveal, SectionHeading } from "./primitives";
import { Globe } from "./globe";

const PLACES = [
  {
    place: "Cork, Ireland",
    role: "Company and product",
    body: "Trosky is built in Cork for European hotel groups first: the analyst desk, the product decisions and the commercial conversations happen here.",
  },
  {
    place: "India",
    role: "Engineering and support",
    body: "Engineering and customer support run from India on European working hours, so the desk is staffed through your day.",
  },
  {
    place: "Frankfurt, eu-central-1",
    role: "Production data",
    body: "The production database runs on Neon Postgres in the EU. Hotel rates, actions and inquiries stay inside the Union.",
  },
];

const ASSURANCES = [
  { title: "EU data residency", body: "Production data is stored and processed in Frankfurt." },
  { title: "Role-based access", body: "Analyst and client roles, with each client scoped to their own hotels." },
  { title: "Hardened by default", body: "Strict content-security policy, HSTS and per-request nonces on every response." },
  { title: "GDPR-aware workflows", body: "Inquiry data is captured once, with a clear owner and a clear purpose." },
];

export function Presence() {
  return (
    <section id="presence" className="scroll-mt-20 border-t border-secondary bg-secondary_alt py-20 sm:py-24 lg:py-32">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Reveal amount={0.2}>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            />
            <Globe className="mx-auto max-w-[420px] lg:max-w-none" />
          </Reveal>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-7 lg:pl-8">
          <Reveal>
            <SectionHeading
              eyebrow="Ireland · India · EU-hosted"
              title="A European product, run from Cork and India."
              lede="Built for hotel groups that need EU data residency and a team that understands both European owners and global distribution."
            />
          </Reveal>

          <dl className="mt-10">
            {PLACES.map((item, i) => (
              <Reveal key={item.place} index={i} className="grid gap-2 border-t border-secondary py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt>
                  <p className="text-md font-semibold text-primary">{item.place}</p>
                  <p className="mt-0.5 text-sm text-brand-secondary">{item.role}</p>
                </dt>
                <dd className="text-md leading-relaxed text-tertiary">{item.body}</dd>
              </Reveal>
            ))}
          </dl>

          <Reveal index={3} className="mt-8 grid gap-x-8 gap-y-5 border-t border-secondary pt-8 sm:grid-cols-2">
            {ASSURANCES.map((item) => (
              <div key={item.title} className="flex gap-3">
                <span aria-hidden className="mt-[0.6rem] h-px w-4 shrink-0 bg-brand-solid" />
                <div>
                  <p className="text-sm font-semibold text-primary">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-tertiary">{item.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
