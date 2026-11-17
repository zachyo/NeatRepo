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
import { Switch } from "@/components/ui/switch";
import { Globe, Lock } from "lucide-react";

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  initialName: string;
  initialIsPublic?: boolean;
  onEditFolder: (id: string, name: string, isPublic: boolean) => Promise<void>;
}

export default function EditFolderDialog({
  open,
  onOpenChange,
  folderId,
  initialName,
  initialIsPublic = false,
  onEditFolder,
}: EditFolderDialogProps) {
  const [folderName, setFolderName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFolderName(initialName);
      setIsPublic(initialIsPublic);
    }
  }, [open, initialName, initialIsPublic]);

  const unchanged = folderName === initialName && isPublic === initialIsPublic;

  const handleEdit = async () => {
    if (!folderName.trim() || unchanged) return;

    try {
      setLoading(true);
      await onEditFolder(folderId, folderName.trim(), isPublic);
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
            Rename your folder or change who can see it
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
                  !unchanged
                ) {
                  handleEdit();
                }
              }}
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="edit-folder-public" className="flex items-center gap-1.5">
                {isPublic ? (
                  <Globe className="h-3.5 w-3.5 text-gray-500" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-gray-500" />
                )}
                Public
              </Label>
              <p className="text-xs text-gray-500">
                Show this folder on your public profile. Private repos stay hidden.
              </p>
            </div>
            <Switch id="edit-folder-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <Button
            onClick={handleEdit}
            disabled={
              !folderName.trim() || unchanged || loading
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
