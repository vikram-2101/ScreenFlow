import React from 'react';
import { Search, Sun, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

export default function TopNav() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (e) => {
    const val = e.target.value;
    
    if (location.pathname === '/category' || location.pathname === '/screenshots' || location.pathname === '/trash') {
      setSearchParams(prev => {
        if (val) prev.set('q', val);
        else prev.delete('q');
        return prev;
      });
    } else if (val.trim() !== '') {
      navigate(`/screenshots?q=${encodeURIComponent(val)}`);
    }
  };

  return (
    <header className="h-20 border-b border-gray-100 bg-white sticky top-0 z-40 px-8 flex items-center justify-between font-sans">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 sm:text-sm transition-all shadow-sm"
            placeholder="Search screenshots..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm border border-gray-200 rounded px-1.5 py-0.5 bg-white font-medium">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right Icons & Profile */}
      <div className="flex items-center gap-4 ml-8">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <Sun className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">3</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold overflow-hidden shadow-inner">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-bold text-gray-700 hidden sm:block">
            {user?.email?.split('@')[0] || 'User'}
          </span>
        </button>
      </div>
    </header>
  );
}
