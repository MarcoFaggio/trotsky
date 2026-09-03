"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { Container, EASE, Reveal, SectionHeading } from "./primitives";

/* ------------------------------------------------------------------ */
/* Mock UI primitives — illustrative, theme-aware, no screenshots.      */
/* ------------------------------------------------------------------ */

function Frame({
  title,
  crumbs,
  children,
  aside,
  status = "Rates refreshed 06:10 · next run 06:00 tomorrow",
}: {
  title: string;
  crumbs?: string;
  children: ReactNode;
  aside?: ReactNode;
  status?: string;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-primary text-[11px] leading-tight text-secondary ring-1 ring-secondary sm:text-xs">
      <div className="flex items-center justify-between gap-3 border-b border-secondary px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2 rounded-full bg-brand-solid" aria-hidden />
          <span className="truncate font-semibold text-primary">{title}</span>
          {crumbs ? (
            <span className="hidden truncate text-quaternary sm:inline">{crumbs}</span>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="relative flex-1">{children}</div>
      <div className="flex items-center gap-2 border-t border-secondary px-3.5 py-2 text-[10px] text-quaternary">
        <span className="size-1.5 rounded-full bg-success-solid" aria-hidden />
        {status}
      </div>
    </div>
  );
}

function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warning" | "success" | "error";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ring-1 ring-inset",
        tone === "neutral" && "bg-secondary text-secondary ring-primary",
        tone === "brand" && "bg-brand-primary text-brand-secondary ring-brand",
        tone === "warning" && "bg-warning-primary text-warning-primary ring-amber-300 dark:ring-amber-800",
        tone === "success" && "bg-success-primary text-success-primary ring-emerald-300 dark:ring-emerald-800",
        tone === "error" && "bg-error-primary text-error-primary ring-error_subtle"
      )}
    >
      {children}
    </span>
  );
}

function Dot({ tone }: { tone: "urgent" | "watch" | "opportunity" | "healthy" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        tone === "urgent" && "bg-error-solid",
        tone === "watch" && "bg-warning-solid",
        tone === "opportunity" && "bg-violet-500",
        tone === "healthy" && "bg-success-solid"
      )}
    />
  );
}

function CommandCentrePanel() {
  const queue = [
    { tone: "urgent" as const, title: "Raise Fri–Sat by €12", tag: "Price change", toneTag: "brand" as const, meta: "12–13 Sep · comp set +7%" },
    { tone: "watch" as const, title: "Cork Jazz Festival — hold BAR", tag: "Event", toneTag: "warning" as const, meta: "23–26 Oct · demand +18%" },
    { tone: "opportunity" as const, title: "Thu 18 Sep pickup ahead of pace", tag: "Watch", toneTag: "neutral" as const, meta: "Review at 85% occupancy" },
    { tone: "healthy" as const, title: "Expedia €6 under direct", tag: "Parity", toneTag: "error" as const, meta: "Fri 19 Sep" },
  ];
  return (
    <Frame
      title="Command centre"
      crumbs="Harbour View Hotel"
      aside={
        <div className="flex rounded-md bg-secondary_alt p-0.5 ring-1 ring-secondary ring-inset">
          <span className="rounded bg-primary px-2 py-0.5 font-semibold text-primary shadow-xs">Operate</span>
          <span className="px-2 py-0.5 text-tertiary">Market</span>
        </div>
      }
    >
      <div className="grid grid-cols-3 divide-x divide-secondary border-b border-secondary">
        {[
          ["Your ADR", "€148"],
          ["Comp avg", "€132"],
          ["Occupancy", "82%"],
        ].map(([label, value]) => (
          <div key={label} className="px-3.5 py-2.5">
            <p className="text-[10px] font-medium tracking-wide text-tertiary uppercase">{label}</p>
            <p className="mt-0.5 text-md font-semibold text-primary tabular-nums sm:text-lg">{value}</p>
          </div>
        ))}
      </div>
      <div className="px-3.5 pt-3 pb-1">
        <p className="mb-2 font-semibold text-primary">Priority queue</p>
        <ul role="list" className="divide-y divide-secondary">
          {queue.map((item) => (
            <li key={item.title} className="flex items-center gap-2.5 py-2">
              <Dot tone={item.tone} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">{item.title}</p>
                <p className="truncate text-quaternary">{item.meta}</p>
              </div>
              <Tag tone={item.toneTag}>{item.tag}</Tag>
              <span className="hidden text-brand-secondary sm:inline">Evidence</span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function RateCalendarPanel() {
  const statuses: Array<"urgent" | "watch" | "opportunity" | "healthy"> = [
    "healthy", "healthy", "healthy", "watch", "urgent", "urgent", "healthy",
    "healthy", "opportunity", "healthy", "healthy", "watch", "watch", "healthy",
    "opportunity", "healthy", "healthy", "healthy", "urgent", "urgent", "healthy",
  ];
  const prices = [128, 131, 136, 142, 148, 155, 149, 140, 136, 133, 130, 138, 146, 141, 138, 140, 143, 147, 156, 164, 155];
  const border = {
    urgent: "border-l-red-500",
    watch: "border-l-amber-500",
    opportunity: "border-l-violet-500",
    healthy: "border-l-emerald-500",
  };
  return (
    <Frame title="Rate calendar" crumbs="September" aside={<Tag tone="neutral">Month</Tag>}>
      <div className="grid grid-cols-7 border-b border-secondary text-center text-[10px] font-medium text-quaternary uppercase">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="py-1.5">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border-secondary">
        {statuses.map((status, i) => (
          <div
            key={i}
            className={cn("min-h-[3rem] border-l-2 bg-primary px-1.5 py-1.5 sm:min-h-[3.4rem]", border[status])}
          >
            <p className="text-[10px] text-quaternary tabular-nums">{i + 1}</p>
            <p className="mt-1 font-semibold text-primary tabular-nums">€{prices[i]}</p>
          </div>
        ))}
      </div>
      <ul role="list" className="flex flex-wrap gap-x-3 gap-y-1 px-3.5 py-2.5 text-[10px] text-tertiary">
        {(["urgent", "watch", "opportunity", "healthy"] as const).map((t) => (
          <li key={t} className="flex items-center gap-1.5 capitalize">
            <Dot tone={t} />
            {t}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function EvidencePanel() {
  const evidence = [
    { label: "Comp set moved +7% for the weekend", detail: "4 of 6 comps raised Fri–Sat", width: 72 },
    { label: "Pace +6% vs last year", detail: "82% on the books, 11 days out", width: 58 },
    { label: "No event overlap", detail: "Nothing on the calendar for 12–13 Sep", width: 30 },
  ];
  return (
    <Frame title="Evidence" crumbs="Raise Fri–Sat by €12" aside={<Tag tone="brand">Suggested</Tag>} status="Raised by the recommendation engine · 06:10 today">
      <div className="px-3.5 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-primary">Why this action</p>
          <p className="text-quaternary">
            Confidence <span className="font-semibold text-primary tabular-nums">0.82</span>
          </p>
        </div>
        <ul role="list" className="mt-2.5 space-y-2.5">
          {evidence.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium text-primary">{row.label}</p>
                <p className="hidden shrink-0 text-quaternary sm:block">{row.detail}</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-brand-solid" style={{ width: `${row.width}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-secondary pt-3">
          {[
            ["Current", "€148"],
            ["Recommended", "€160"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-secondary_alt px-2.5 py-2 ring-1 ring-secondary ring-inset">
              <p className="text-[10px] text-tertiary uppercase">{label}</p>
              <p className="mt-0.5 text-md font-semibold text-primary tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-secondary px-3.5 py-2.5">
        <span className="rounded-md bg-brand-solid px-2.5 py-1.5 font-semibold text-white">Accept</span>
        <span className="rounded-md bg-primary px-2.5 py-1.5 font-semibold text-secondary ring-1 ring-primary ring-inset">Snooze</span>
        <span className="rounded-md px-2.5 py-1.5 font-semibold text-tertiary">Reject</span>
      </div>
    </Frame>
  );
}

function OwnerPanel() {
  const rows = [
    { who: "Aoife Kelleher", type: "Room block · 24 rooms", when: "3–5 Oct", status: "New", tone: "brand" as const },
    { who: "Rowan & Priya", type: "Wedding · 120 guests", when: "16 May", status: "Qualified", tone: "success" as const },
    { who: "Munster Tech Ltd", type: "Offsite · 40 delegates", when: "8–9 Nov", status: "Quoted", tone: "neutral" as const },
  ];
  return (
    <Frame title="Inquiries" crumbs="Harbour View Hotel" aside={<Tag tone="neutral">Client · read-only</Tag>} status="3 open inquiries · scoped to Harbour View Hotel">
      <div className="grid h-full grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr]">
        <nav aria-hidden className="border-r border-secondary bg-secondary_alt px-2 py-2.5">
          {["Dashboard", "Rate calendar", "Pace", "Inquiries"].map((item) => (
            <p
              key={item}
              className={cn(
                "truncate rounded-md px-2 py-1.5",
                item === "Inquiries" ? "bg-primary font-semibold text-primary shadow-xs" : "text-tertiary"
              )}
            >
              {item}
            </p>
          ))}
        </nav>
        <ul role="list" className="divide-y divide-secondary px-3 py-1">
          {rows.map((row) => (
            <li key={row.who} className="flex items-center gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">{row.who}</p>
                <p className="truncate text-quaternary">
                  {row.type} · {row.when}
                </p>
              </div>
              <Tag tone={row.tone}>{row.status}</Tag>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    id: "command-centre",
    label: "Command centre",
    title: "Open to the work, not a dashboard.",
    body: "The property opens on a ranked queue of revenue actions, with today's ADR, comp average and occupancy beside the rate chart. Switch to Market for the matrix and calendar.",
    Panel: CommandCentrePanel,
  },
  {
    id: "rate-calendar",
    label: "Rate calendar",
    title: "Every stay date carries a status.",
    body: "Urgent, watch, opportunity or healthy, computed from open actions and where you sit against the comp set. Scan a month in seconds and go straight to the dates that need a decision.",
    Panel: RateCalendarPanel,
  },
  {
    id: "evidence",
    label: "Evidence drawer",
    title: "Every suggestion shows its working.",
    body: "Which comps moved and by how much, what pace and events say, and the confidence behind the number. Accept, snooze or reject in place — the decision is logged with its evidence.",
    Panel: EvidencePanel,
  },
  {
    id: "owner-view",
    label: "Owner view",
    title: "Owners see the same record, read-only.",
    body: "Clients log in to their own hotels only: the cockpit, the calendar and the inquiry inbox where room blocks, weddings and offsites arrive already structured.",
    Panel: OwnerPanel,
  },
] as const;

function Step({
  index,
  active,
  onActivate,
  step,
}: {
  index: number;
  active: boolean;
  onActivate: (i: number) => void;
  step: (typeof STEPS)[number];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55, margin: "-15% 0px -35% 0px" });

  useEffect(() => {
    if (inView) onActivate(index);
  }, [inView, index, onActivate]);

  return (
    <div ref={ref} id={step.id} className="scroll-mt-28 lg:flex lg:min-h-[52vh] lg:flex-col lg:justify-center">
      <Reveal>
        <button
          type="button"
          onClick={() => onActivate(index)}
          className={cn(
            "group w-full border-l-2 py-1 pl-5 text-left transition-colors duration-300 sm:pl-6",
            active ? "border-brand-solid" : "border-secondary hover:border-primary"
          )}
        >
          <p
            className={cn(
              "text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors",
              active ? "text-brand-secondary" : "text-quaternary"
            )}
          >
            0{index + 1} · {step.label}
          </p>
          <h3
            className={cn(
              "mt-2 text-xl font-semibold tracking-tight transition-colors sm:text-display-xs",
              active ? "text-primary" : "text-tertiary group-hover:text-primary"
            )}
          >
            {step.title}
          </h3>
          <p className="mt-2.5 max-w-lg text-md leading-relaxed text-tertiary">{step.body}</p>
        </button>
      </Reveal>

      {/* Below lg the panel rides along with its step. */}
      <div className="mt-6 pl-5 sm:pl-6 lg:hidden">
        <step.Panel />
      </div>
    </div>
  );
}

export function ProductTour() {
  const [active, setActive] = useState(0);

  return (
    <section id="product" className="scroll-mt-20 border-t border-secondary bg-secondary_alt py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="The product"
            title="One record for the property, four ways in."
            lede="Rates, pace, events and inquiries stop living in separate tabs. Analysts and owners work from the same evidence."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-14 lg:col-span-5 lg:gap-0">
            {STEPS.map((step, i) => (
              <Step key={step.id} index={i} step={step} active={active === i} onActivate={setActive} />
            ))}
          </div>

          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[16/11] w-full">
                {STEPS.map((step, i) => {
                  const isActive = active === i;
                  return (
                    <motion.div
                      key={step.id}
                      aria-hidden={!isActive}
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 18, scale: isActive ? 1 : 0.985 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className={cn("absolute inset-0", !isActive && "pointer-events-none")}
                    >
                      <div className="h-full rounded-2xl bg-secondary p-2 shadow-2xl ring-1 ring-secondary">
                        <step.Panel />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-xs text-quaternary">
                Illustrative screens with example data.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
