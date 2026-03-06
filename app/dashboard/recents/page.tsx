'use client';

import { Card } from '@/components/ui/card';
import { FileText, Clock, User } from 'lucide-react';

export default function RecentsPage() {
  const recentActivity = [
    {
      id: 1,
      type: 'file_modified',
      user: 'You',
      action: 'Modified',
      item: 'Design System.pdf',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'file_shared',
      user: 'Sarah',
      action: 'Shared',
      item: 'Project Brief.docx',
      time: '5 hours ago',
    },
    {
      id: 3,
      type: 'folder_created',
      user: 'You',
      action: 'Created',
      item: 'Marketing Assets',
      time: '1 day ago',
    },
    {
      id: 4,
      type: 'file_uploaded',
      user: 'Mike',
      action: 'Uploaded',
      item: 'Budget 2026.xlsx',
      time: '2 days ago',
    },
    {
      id: 5,
      type: 'comment_added',
      user: 'Emma',
      action: 'Commented on',
      item: 'Team Guidelines.doc',
      time: '3 days ago',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recent Activity</h1>
        <p className="text-gray-600 mt-1">See what's happening in your workspaces</p>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {recentActivity.map((activity) => (
          <Card
            key={activity.id}
            className="bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition p-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{activity.user}</span>
                  <span className="text-gray-600">{activity.action}</span>
                  <span className="font-medium text-blue-600">{activity.item}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {activity.time}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
