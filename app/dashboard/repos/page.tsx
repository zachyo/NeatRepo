"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddRepoDialog from "@/components/dashboard/add-repo-dialog";
import RepoBrowser from "@/components/dashboard/repo-browser";
import { useFolders, useInvalidateRepoData } from "@/hooks/queries";

export default function RepositoriesPage() {
  const [showAddRepo, setShowAddRepo] = useState(false);
  const invalidate = useInvalidateRepoData();
  const { data: foldersData } = useFolders({ queryParams: { search: "" } });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <RepoBrowser
        actions={
          <Button
            onClick={() => setShowAddRepo(true)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="mr-1 size-4" />
            Add repository
          </Button>
        }
      />

      <AddRepoDialog
        open={showAddRepo}
        onOpenChange={setShowAddRepo}
        folders={Array.isArray(foldersData) ? foldersData : []}
        onSuccess={() => {
          setShowAddRepo(false);
          invalidate();
        }}
      />
    </div>
  );
}
