import { Plus, Folder, GitBranch } from "lucide-react";

interface DashboardStatsProps {
  totalFolders: number;
  totalRepos: number;
  onCreateFolder: () => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Folder;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-gray-900">
          {value.toLocaleString()}
        </p>
      </div>
      <div className="hidden size-10 items-center justify-center rounded-lg bg-blue-50 min-[400px]:flex">
        <Icon className="size-5 text-blue-600" />
      </div>
    </div>
  );
}

export default function DashboardStats({
  totalFolders,
  totalRepos,
  onCreateFolder,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard label="Folders" value={totalFolders} icon={Folder} />
      <StatCard label="Repositories" value={totalRepos} icon={GitBranch} />
      <button
        type="button"
        onClick={onCreateFolder}
        className="group col-span-2 flex items-center gap-4 rounded-xl sm:col-span-1 border border-dashed border-gray-300 bg-white p-5 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98]"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Plus className="size-5" />
        </span>
        <span>
          <span className="block font-medium text-gray-900">New folder</span>
          <span className="block text-sm text-gray-500">Group related repositories</span>
        </span>
      </button>
    </div>
  );
}
