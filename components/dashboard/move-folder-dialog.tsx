"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CornerLeftUp, Folder } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiSend, errorMessage } from "@/lib/api-client";
import { buildTree, canMoveFolder, flattenTree } from "@/lib/folder-tree";
import { cn } from "@/lib/utils";
import { useInvalidateRepoData } from "@/hooks/queries";
import type { DashboardFolder } from "./dnd-provider";

interface MoveFolderDialogProps {
  folderId: string | null;
  folders: DashboardFolder[];
  onClose: () => void;
}

export default function MoveFolderDialog({
  folderId,
  folders,
  onClose,
}: MoveFolderDialogProps) {
  const invalidate = useInvalidateRepoData();
  const folder = folders.find((f) => f.id === folderId);
  const currentParent = folder?.parent_id ?? null;
  const [target, setTarget] = useState<string | null>(currentParent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTarget(currentParent);
  }, [folderId, currentParent]);

  const options = useMemo(() => flattenTree(buildTree(folders)), [folders]);

  const handleMove = async () => {
    if (!folderId) return;
    try {
      setSaving(true);
      await apiSend(`/api/folders/${folderId}`, "PUT", { parent_id: target });
      await invalidate();
      toast.success("Folder moved");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const optionClass = (selected: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-md py-2 pr-2 text-left text-sm transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
      "disabled:cursor-not-allowed disabled:opacity-40",
      selected ? "bg-blue-50 text-blue-700" : "text-gray-700 enabled:hover:bg-gray-100",
    );

  return (
    <Dialog open={!!folder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move folder</DialogTitle>
          <DialogDescription>
            Choose a new location for{" "}
            <span className="font-semibold text-gray-900">{folder?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-72 rounded-lg border border-gray-200 p-2">
          <button
            type="button"
            aria-pressed={target === null}
            onClick={() => setTarget(null)}
            className={cn(optionClass(target === null), "pl-2")}
          >
            <CornerLeftUp className="size-4 shrink-0" />
            <span className="flex-1">Top level</span>
            {target === null && <Check className="size-4 shrink-0" />}
          </button>

          {options.map((option) => {
            const allowed = !!folderId && canMoveFolder(folders, folderId, option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={!allowed}
                aria-pressed={target === option.id}
                onClick={() => setTarget(option.id)}
                style={{ paddingLeft: `${0.5 + (option.depth + 1) * 0.875}rem` }}
                className={optionClass(target === option.id)}
              >
                <Folder className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{option.name}</span>
                {target === option.id && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </ScrollArea>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={saving || target === currentParent}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? "Moving..." : "Move here"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
