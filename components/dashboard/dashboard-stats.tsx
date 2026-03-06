import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Folder, GitBranch } from "lucide-react";

interface DashboardStatsProps {
  totalFolders: number;
  totalRepos: number;
  onCreateFolder: () => void;
}

export default function DashboardStats({
  totalFolders,
  totalRepos,
  onCreateFolder,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Create Folder Card */}
      <Card className="bg-white border-gray-200 p-4 py-2 relative">
        <button onClick={onCreateFolder} className="w-full text-left">
          <div className="space-y-3">
            <Plus className="w-8 h-8 text-blue-500 mt-1" />
            <p className="text-gray-600 text-sm font-medium">Create Folder</p>
          </div>
        </button>
      </Card>

      {/* Total Folders Card */}
      <Card className="bg-white border-gray-200 p-4 py-2 relative">
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">{totalFolders}</p>
          <p className="text-gray-600 text-sm font-medium">Total Folders</p>
        </div>
        <div className="absolute top-4 right-4">
          <Folder className="w-6 h-6 text-blue-500" />
        </div>
      </Card>

      {/* Total Repos Card */}
      <Card className="bg-white border-gray-200 p-4 py-2 relative">
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">{totalRepos}</p>
          <p className="text-gray-600 text-sm font-medium">
            Total Repositories
          </p>
        </div>
        <div className="absolute top-4 right-4">
          <GitBranch className="w-6 h-6 text-blue-500" />
        </div>
      </Card>
    </div>
  );
}
