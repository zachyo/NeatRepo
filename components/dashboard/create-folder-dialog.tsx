'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Lock } from 'lucide-react';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string, isPublic: boolean) => Promise<void>;
  title?: string;
  description?: string;
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
  title = 'Create New Folder',
  description = 'Create a new folder to organize your repositories',
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) return;

    try {
      setLoading(true);
      await onCreateFolder(folderName.trim(), isPublic);
      setFolderName('');
      setIsPublic(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="e.g., Personal Projects, Work..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && folderName.trim()) {
                  handleCreate();
                }
              }}
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3">
            <div className="space-y-0.5">
              <Label htmlFor='folder-public' className="flex items-center gap-1.5">
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
            <Switch id='folder-public' checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCreate}
            disabled={!folderName.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating...' : 'Create'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
