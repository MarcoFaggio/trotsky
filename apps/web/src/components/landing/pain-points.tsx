"use client";

import { Container, Reveal, SectionHeading } from "./primitives";

const POINTS = [
  {
    title: "The weekly OTA check eats the afternoon",
    body: "Comp rates get copied by hand into a sheet, one stay date at a time. By the time the sheet is finished, the rates on it have moved.",
  },
  {
    title: "Competitor moves land days late",
    body: "A comp drops €15 on Tuesday and you find out on Friday. The weekend has already sold at the wrong price.",
  },
  {
    title: "Owners get decks instead of context",
    body: "Stakeholders see a monthly summary, not the evidence behind each change. Every rate decision turns into a conversation.",
  },
];

export function PainPoints() {
  return (
    <section id="problem" className="scroll-mt-20 py-20 sm:py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading
              eyebrow="The problem"
              title="Rates drift when the market is checked by hand."
              lede="Most independent hotels still price from a spreadsheet and a weekly look at Booking.com. The market moves every day."
            />
          </Reveal>
        </div>

        <ol className="lg:col-span-7 lg:pt-2" role="list">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} as="li" index={i} className="group border-t border-secondary py-7 last:border-b sm:py-8">
              <div className="grid grid-cols-[3rem_1fr] gap-4 sm:grid-cols-[4.5rem_1fr] sm:gap-6">
                <span className="font-serif text-display-xs leading-none text-quaternary tabular-nums transition-colors group-hover:text-brand-secondary sm:text-display-sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-primary sm:text-xl">{point.title}</h3>
                  <p className="mt-2 max-w-xl text-md leading-relaxed text-tertiary">{point.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
