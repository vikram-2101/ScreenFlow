import { useEffect, useState, useCallback } from "react";
import { fetchScreenshots, searchScreenshots } from "../api/screenshots";
import ScreenshotCard from "../components/ScreenshotCard";
import UploadZone from "../components/UploadZone";
import { useAuth } from "../context/AuthContext";
import { Image as ImageIcon, Folder, Tag, Sparkles, Clipboard, Monitor, ChevronDown, Grid, List } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [screenshots, setScreenshots] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const loadScreenshots = useCallback(() => {
    fetchScreenshots().then(setScreenshots);
  }, []);

  useEffect(() => {
    loadScreenshots();
  }, [loadScreenshots]);

  const userName = user?.email?.split('@')[0] || 'User';
  // Capitalize first letter
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Welcome Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {formattedName}! 👋</h1>
          <p className="text-gray-500">Your screenshots, organized and easy to find.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-4 shadow-sm min-w-[140px]">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{screenshots.length}</p>
              <p className="text-xs text-gray-500 font-medium">Total Screenshots</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-4 shadow-sm min-w-[140px]">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">32</p>
              <p className="text-xs text-gray-500 font-medium">Category</p>
            </div>
          </div>
         
        </div>
      </div>

      {/* Upload and Import Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <UploadZone onUploadSuccess={loadScreenshots} />
        </div>
        
        <div className="w-full lg:w-72 shrink-0">
          <h3 className="font-bold text-gray-900 mb-4">Import from</h3>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors">
              <Clipboard className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Clipboard</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors">
              <Monitor className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Local Device</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12 2L4 16H8.5L14 6.5H18L12 2Z" fill="#FFC107"/>
                <path d="M4 16L8 23H17.5L13.5 16H4Z" fill="#1976D2"/>
                <path d="M14 6.5L8.5 16H13.5L19.5 6.5H14Z" fill="#4CAF50"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Google Drive</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0061FF">
                <path d="M12 6.5L6.5 10L12 13.5L17.5 10L12 6.5ZM6.5 10L1 6.5L6.5 3L12 6.5L6.5 10ZM12 13.5L17.5 17L23 13.5L17.5 10L12 13.5ZM6.5 17L1 13.5L6.5 10L12 13.5L6.5 17ZM12 21L6.5 17L12 13.5L17.5 17L12 21Z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Dropbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Screenshots */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Screenshots</h2>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View all</button>
          </div>

          <div className="flex items-center gap-4">
            {/* Filters */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {['All', 'Today', 'This Week', 'This Month'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === filter 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Sort & View toggles */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Newest First
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 shadow-sm"><Grid className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-900"><List className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        {screenshots.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No screenshots found. Upload one to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {screenshots.map((shot) => (
              <ScreenshotCard
                key={shot.id}
                screenshot={shot}
                onUpdate={(updated) =>
                  setScreenshots((prev) =>
                    prev.map((s) => (s.id === updated.id ? updated : s))
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}