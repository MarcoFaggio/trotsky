"use client";

import Link from "next/link";
import { ArrowLeft } from "@untitledui/icons";
import { TroskyMark } from "@/components/brand/trosky-logo";
import { Button } from "@/components/base/buttons/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "./primitives";

/** Slim header for public pages that are not the landing page itself. */
export function PublicHeader() {
  return (
    <header className="border-b border-secondary bg-primary/85 backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-primary">
          <TroskyMark priority className="h-9 w-9" />
          <span className="text-md font-semibold tracking-tight">Trosky</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button href="/" size="md" color="tertiary" iconLeading={ArrowLeft}>
            <span className="hidden sm:inline">Back to site</span>
            <span className="sm:hidden">Site</span>
          </Button>
          <Button href="/login" size="md" color="secondary">
            Log in
          </Button>
        </div>
      </Container>
    </header>
  );
}
