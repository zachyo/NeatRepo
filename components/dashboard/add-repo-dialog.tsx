'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitBranch, Search, Star } from 'lucide-react';

interface SearchResult {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

interface Folder {
  id: string;
  name: string;
}

interface AddRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  onSuccess: () => void;
}

export default function AddRepoDialog({
  open,
  onOpenChange,
  folders,
  onSuccess,
}: AddRepoDialogProps) {
  const [step, setStep] = useState<'search' | 'confirm'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/github/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.repos || []);
      }
    } catch (error) {
      console.error('Error searching GitHub:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repo: SearchResult) => {
    setSelectedRepo(repo);
    setStep('confirm');
  };

  const handleToggleFolder = (folderId: string) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId);
    } else {
      newSelected.add(folderId);
    }
    setSelectedFolders(newSelected);
  };

  const handleAddRepo = async () => {
    if (!selectedRepo) return;

    try {
      setLoading(true);

      // Add repo to database
      const response = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_owner: selectedRepo.owner,
          repo_name: selectedRepo.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to add repo');

      // Add to selected folders
      const repoData = await response.json();
      for (const folderId of selectedFolders) {
        await fetch(`/api/folders/${folderId}/repos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoId: repoData.id }),
        });
      }

      onSuccess();
      // Reset state
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRepo(null);
      setSelectedFolders(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding repo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'confirm') {
      setStep('search');
      setSelectedRepo(null);
    } else {
      onOpenChange(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRepo(null);
      setSelectedFolders(new Set());
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'Search Repository' : 'Add to Folders'}
          </DialogTitle>
          <DialogDescription>
            {step === 'search'
              ? 'Search for a GitHub repository to add'
              : `Add ${selectedRepo?.name} to your folders`}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search GitHub repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || searchQuery.length < 2}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <ScrollArea className="h-96 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2">
                  {searchResults.map((repo) => (
                    <Card
                      key={repo.id}
                      className="bg-white border-gray-200 p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition"
                      onClick={() => handleSelectRepo(repo)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {repo.full_name}
                          </h4>
                          {repo.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {repo.stars > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {repo.stars.toLocaleString()}
                              </span>
                            )}
                            {repo.language && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Repo Info */}
            <Card className="bg-blue-50 border-blue-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">
                    {selectedRepo?.full_name}
                  </p>
                </div>
              </div>
            </Card>

            {/* Folder Selection */}
            <div className="space-y-2">
              <Label>Add to Folders (optional)</Label>
              {folders.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No folders yet. You can add this repo to folders later.
                </p>
              ) : (
                <ScrollArea className="h-48 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleToggleFolder(folder.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-left"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            selectedFolders.has(folder.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedFolders.has(folder.id) && (
                            <span className="text-white text-sm">✓</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {folder.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={handleClose}>
            {step === 'confirm' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'confirm' && (
            <Button
              onClick={handleAddRepo}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Repository'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
