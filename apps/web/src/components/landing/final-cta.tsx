"use client";

import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Accent, Container, Eyebrow, Reveal } from "./primitives";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 90% at 50% 100%, rgba(166,1,1,0.32), transparent 65%)",
        }}
      />
      <Container className="relative py-24 sm:py-28 lg:py-36">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="on-ink" className="justify-center">
            Start with one property
          </Eyebrow>
          <h2 className="mt-6 text-display-md font-semibold tracking-tight text-white sm:text-display-lg lg:text-display-xl">
            See the whole market <Accent>before you set a rate.</Accent>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            Open the command centre with example data, or ask for a walkthrough
            and we will bring your comp set.
          </p>
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              href="/login"
              size="xl"
              color="primary"
              iconTrailing={ArrowRight}
              className="w-full justify-center sm:w-auto"
            >
              Open the command centre
            </Button>
            <Button
              href="/inquire"
              size="xl"
              color="secondary"
              className="w-full justify-center bg-white/[0.06] text-white ring-white/15 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Request a walkthrough
            </Button>
          </div>
          <p className="mt-10 text-sm text-white/45">
            Built in Cork · Supported from India · Hosted in the EU
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
