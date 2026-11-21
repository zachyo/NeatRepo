"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "list" | "grid";

const STORAGE_KEY = "neatrepo:repo-view";

/** Remembers the list/grid choice. Read after mount to match server markup. */
export function useViewMode() {
  const [view, setViewState] = useState<ViewMode>("list");

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "grid") setViewState("grid");
    } catch {
      // Storage can be blocked; the default view still works.
    }
  }, []);

  const setView = useCallback((next: ViewMode) => {
    setViewState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice lasts for this page only.
    }
  }, []);

  return [view, setView] as const;
}
