"use client";

import { useEffect, useState } from "react";
import { Moon01, Sun } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("dark-mode", isDark);
  localStorage.setItem("trosky:theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const currentTheme =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.classList.contains("dark-mode")
        ? "dark"
        : "light";
    setTheme(currentTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <Button
      type="button"
      color="tertiary"
      size="sm"
      data-tour="theme-toggle"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
      iconLeading={theme === "dark" ? Sun : Moon01}
    />
  );
}
