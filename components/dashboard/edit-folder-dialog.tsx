"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  initialName: string;
  onEditFolder: (id: string, name: string) => Promise<void>;
}

export default function EditFolderDialog({
  open,
  onOpenChange,
  folderId,
  initialName,
  onEditFolder,
}: EditFolderDialogProps) {
  const [folderName, setFolderName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFolderName(initialName);
    }
  }, [open, initialName]);

  const handleEdit = async () => {
    if (!folderName.trim() || folderName === initialName) return;

    try {
      setLoading(true);
      await onEditFolder(folderId, folderName);
      onOpenChange(false);
    } catch (error) {
      console.error("Error editing folder:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Change the name of your folder
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-2">
            <Label htmlFor="edit-folder-name">Folder Name</Label>
            <Input
              id="edit-folder-name"
              placeholder="e.g., Personal Projects, Work..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  folderName.trim() &&
                  folderName !== initialName
                ) {
                  handleEdit();
                }
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button
            onClick={handleEdit}
            disabled={
              !folderName.trim() || folderName === initialName || loading
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
