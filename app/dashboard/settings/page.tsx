"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  LogOut,
  Trash2,
  Globe,
  GitBranch,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  is_public?: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        setUser(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync/background", { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        if (result.synced > 0) {
          toast.success(`Synced ${result.synced} new repositories from GitHub`);
        } else if (!result.hasMore) {
          toast.success("All repositories are already up to date");
        } else {
          toast.info("Sync complete — check back later for more repos");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to connect to GitHub");
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!user) return;
    setTogglingPublic(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: !user.is_public }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) =>
          prev ? { ...prev, is_public: updated.is_public } : null,
        );
        toast.success(
          updated.is_public
            ? "Public profile enabled"
            : "Public profile disabled",
        );
      } else {
        toast.error("Failed to update profile visibility");
      }
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      } else {
        toast.error("Failed to delete account");
        setDeleting(false);
      }
    } catch {
      toast.error("An error occurred");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mt-5 mx-auto space-y-8">
        <div className="space-y-2">
          <Skeleton className="w-48 h-9" />
          <Skeleton className="w-72 h-5" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="hidden">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          GitHub Account
        </h2>
        <div className="flex items-center gap-4">
          {user?.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-14 h-14 rounded-full border border-gray-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              @{user?.username}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.email || "No email on file"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`https://github.com/${user?.username}`, "_blank")
            }
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on GitHub
          </Button>
        </div>
      </Card>

      {/* Sync Card */}
      <Card className="bg-white border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Repository Sync
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Manually pull the latest repositories from GitHub. This fetches the
          next batch beyond the initial 100.
        </p>
        <Button
          onClick={handleManualSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Now
            </>
          )}
        </Button>
      </Card>

      {/* Public Profile Card */}
      <Card className="bg-white border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Public Profile
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          When enabled, anyone can view your NeatRepo profile at{" "}
          <span className="font-mono text-gray-700">/p/{user?.username}</span>.
        </p>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="font-medium text-gray-900">
              {user?.is_public ? "Profile is public" : "Profile is private"}
            </p>
            <p className="text-sm text-gray-500">
              {user?.is_public
                ? "Your folders and pinned repos are visible to anyone with the link"
                : "Only you can see your data"}
            </p>
          </div>
          <Button
            variant={user?.is_public ? "outline" : "default"}
            onClick={handleTogglePublic}
            disabled={togglingPublic}
            className={user?.is_public ? "" : "bg-blue-600 hover:bg-blue-700"}
          >
            {togglingPublic
              ? "Updating…"
              : user?.is_public
                ? "Make Private"
                : "Make Public"}
          </Button>
        </div>
        {user?.is_public && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/p/${user.username}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/p/${user.username}`,
                );
                toast.success("Profile link copied!");
              }}
            >
              Copy Link
            </Button>
          </div>
        )}
      </Card>

      {/* Sign Out */}
      <Card className="bg-white border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-gray-600" />
          Sign Out
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Sign out and return to the landing page.
        </p>
        <Button onClick={handleLogout} variant="outline">
          Sign Out
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-50 border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete your account and all associated data — folders,
          repositories, and settings. This cannot be undone.
        </p>
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data —
              including all folders and repository data. This action{" "}
              <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
