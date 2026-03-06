'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Upload, FileText, Folder, MoreVertical, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function FilesPage() {
  const [files] = useState([
    { id: 1, name: 'Design System', type: 'folder', size: '-', modified: '2 hours ago', shared: true },
    { id: 2, name: 'Project Brief.pdf', type: 'file', size: '2.4 MB', modified: '5 hours ago', shared: true },
    { id: 3, name: 'Marketing Assets', type: 'folder', size: '-', modified: '1 day ago', shared: false },
    { id: 4, name: 'Budget Plan.xlsx', type: 'file', size: '850 KB', modified: '2 days ago', shared: false },
    { id: 5, name: 'Team Guidelines.doc', type: 'file', size: '1.2 MB', modified: '3 days ago', shared: true },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <p className="text-gray-600 mt-1">Organize and manage all your files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {/* Files List */}
      <Card className="bg-white border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {/* Header */}
          <div className="px-6 py-3 bg-gray-50 flex items-center gap-4 text-sm font-medium text-gray-600">
            <span className="flex-1">Name</span>
            <span className="w-24">Size</span>
            <span className="w-32">Modified</span>
            <span className="w-16">Shared</span>
            <span className="w-10"></span>
          </div>

          {/* Files */}
          {files.map((file) => (
            <div
              key={file.id}
              className="px-6 py-4 hover:bg-gray-50 transition flex items-center gap-4 group"
            >
              <div className="flex items-center gap-3 flex-1">
                {file.type === 'folder' ? (
                  <Folder className="w-5 h-5 text-blue-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-600" />
                )}
                <span className="text-gray-900 font-medium">{file.name}</span>
              </div>
              <span className="w-24 text-gray-600 text-sm">{file.size}</span>
              <span className="w-32 text-gray-600 text-sm">{file.modified}</span>
              <span className="w-16">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  {file.shared ? 'Shared' : 'Private'}
                </span>
              </span>
              <button className="w-10 h-10 rounded hover:bg-gray-200 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
