import Link from "next/link";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { Container } from "./primitives";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#product", label: "Command centre" },
      { href: "/#rate-calendar", label: "Rate calendar" },
      { href: "/#evidence", label: "Evidence drawer" },
      { href: "/#owner-view", label: "Owner view" },
      { href: "/#connected", label: "Data sources" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/#presence", label: "Cork, Ireland" },
      { href: "/#presence", label: "India" },
      { href: "/#presence", label: "EU hosting" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    heading: "Access",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/inquire", label: "Request a walkthrough" },
      { href: "/inquire", label: "Send a group inquiry" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-secondary bg-primary">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 text-primary">
              <TroskyMark className="h-9 w-9" />
              <span className="text-md font-semibold tracking-tight">Trosky</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-tertiary">
              Hotel revenue intelligence for European operators. Competitor
              rates, pace, events and inquiries in one record per property.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <p className="text-[12px] font-semibold tracking-[0.14em] text-quaternary uppercase">
                  {column.heading}
                </p>
                <ul role="list" className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-secondary transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-secondary pt-6 text-xs text-quaternary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Trosky. Cork, Ireland.</p>
          <p>Production data hosted in the EU (Frankfurt, eu-central-1).</p>
        </div>
      </Container>
    </footer>
  );
}
