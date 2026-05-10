#!/usr/bin/env python3
"""
Remove macOS AppleDouble / resource-fork files (names starting with ._)
generated on external drives and network volumes.

Usage:
  python3 scripts/cleanup-macos-appledouble.py
  python3 scripts/cleanup-macos-appledouble.py /path/to/root

Safe skips: .git, node_modules, .next, dist, build, coverage, .turbo, etc.
"""

from __future__ import annotations

import argparse
import os
import sys

SKIP_DIR_NAMES = frozenset(
    {
        ".git",
        "node_modules",
        ".next",
        "dist",
        "build",
        ".turbo",
        "coverage",
        ".venv",
        "venv",
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
    }
)


def should_skip_dir(name: str) -> bool:
    return name in SKIP_DIR_NAMES or name.startswith(".")


def cleanup(root: str, *, dry_run: bool) -> tuple[int, list[str]]:
    removed = 0
    paths: list[str] = []
    root = os.path.abspath(os.path.expanduser(root))

    if not os.path.isdir(root):
        print(f"Not a directory: {root}", file=sys.stderr)
        sys.exit(1)

    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        dirnames[:] = sorted(d for d in dirnames if not should_skip_dir(d))

        for name in filenames:
            if not name.startswith("._"):
                continue
            path = os.path.join(dirpath, name)
            paths.append(path)
            if dry_run:
                continue
            try:
                os.remove(path)
                removed += 1
            except OSError as exc:
                print(f"skip {path}: {exc}", file=sys.stderr)

    return removed, paths


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Recursively delete macOS ._ AppleDouble files."
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=".",
        help="Directory tree root (default: current directory)",
    )
    parser.add_argument(
        "-n",
        "--dry-run",
        action="store_true",
        help="List matching files only; do not delete",
    )
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="Only print summary counts (stderr)",
    )
    args = parser.parse_args()

    removed, paths = cleanup(args.root, dry_run=args.dry_run)

    if args.dry_run:
        if not args.quiet:
            for p in paths:
                print(p)
        print(
            f"[dry-run] Would remove {len(paths)} file(s).",
            file=sys.stderr,
        )
        return

    if not args.quiet:
        for p in paths:
            print(f"removed {p}")
    print(f"Removed {removed} file(s).", file=sys.stderr)


if __name__ == "__main__":
    main()
