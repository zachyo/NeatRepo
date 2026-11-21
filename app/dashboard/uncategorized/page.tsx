"use client";

import RepoBrowser from "@/components/dashboard/repo-browser";
import { UNCATEGORIZED_FOLDER } from "@/lib/repo-query";

export default function UncategorizedPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <p className="text-pretty text-sm text-gray-500">
        Repositories that aren&apos;t in any folder yet. Select several to file them at once.
      </p>
      <RepoBrowser
        lockedFolder={UNCATEGORIZED_FOLDER}
        emptyTitle="Everything is organized"
        emptyDescription="Every repository is in at least one folder."
      />
    </div>
  );
}
