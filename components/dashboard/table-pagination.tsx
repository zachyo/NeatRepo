"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PageItem = number | "gap-start" | "gap-end";

/**
 * Page numbers to show: always the first and last page, plus `siblings`
 * pages either side of the current one, with gaps marked where pages are
 * skipped. A gap never hides just one page; that page is shown instead.
 */
export function getPageItems(
  page: number,
  totalPages: number,
  siblings = 1,
): PageItem[] {
  // first + last + current + siblings on each side + two gaps
  const maxSlots = siblings * 2 + 5;
  if (totalPages <= maxSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, page - siblings);
  const end = Math.min(totalPages - 1, page + siblings);
  // Keep the number of slots constant so the controls don't jump around.
  const windowSize = siblings * 2 + 3;
  const showStartGap = start > 3;
  const showEndGap = end < totalPages - 2;

  if (!showStartGap) {
    return [
      ...Array.from({ length: windowSize }, (_, i) => i + 1),
      "gap-end",
      totalPages,
    ];
  }
  if (!showEndGap) {
    return [
      1,
      "gap-start",
      ...Array.from({ length: windowSize }, (_, i) => totalPages - windowSize + 1 + i),
    ];
  }
  return [
    1,
    "gap-start",
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    "gap-end",
    totalPages,
  ];
}

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  itemLabel = "repositories",
  onPageChange,
  className,
}: TablePaginationProps) {
  const [jumpValue, setJumpValue] = useState("");

  if (totalPages <= 1) return null;

  const goTo = (target: number) => {
    const clamped = Math.min(totalPages, Math.max(1, target));
    if (clamped !== page) onPageChange(clamped);
  };

  const handleJump = (event: FormEvent) => {
    event.preventDefault();
    const target = Number.parseInt(jumpValue, 10);
    if (Number.isNaN(target)) return;
    goTo(target);
    setJumpValue("");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <p className="text-sm tabular-nums text-gray-500">
        Page {page} of {totalPages} · {totalItems.toLocaleString()} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            disabled={page === 1}
            onClick={() => goTo(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <ul className="hidden items-center gap-1 sm:flex">
            {getPageItems(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <li key={item}>
                  <Button
                    variant={item === page ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 min-w-8 px-2 tabular-nums",
                      item === page && "bg-blue-600 hover:bg-blue-700",
                    )}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => goTo(item)}
                  >
                    {item}
                  </Button>
                </li>
              ) : (
                <li
                  key={item}
                  aria-hidden="true"
                  className="flex h-8 w-6 items-center justify-center text-sm text-gray-400"
                >
                  …
                </li>
              ),
            )}
          </ul>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            disabled={page === totalPages}
            onClick={() => goTo(page + 1)}
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </Button>
        </nav>

        {/* noValidate: out-of-range numbers are clamped instead of blocked */}
        <form noValidate onSubmit={handleJump} className="flex items-center gap-2">
          <label htmlFor="jump-to-page" className="text-sm text-gray-500">
            Go to
          </label>
          <Input
            id="jump-to-page"
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            placeholder={String(page)}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            className="h-8 w-16 px-2 tabular-nums"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={jumpValue.trim() === ""}
          >
            Go
          </Button>
        </form>
      </div>
    </div>
  );
}
