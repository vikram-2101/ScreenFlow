import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Image as ImageIcon, Folder, Tag, Trash2, Search, Copy, Settings, Sparkles, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const primaryLinks = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Screenshots', path: '/screenshots', icon: ImageIcon },
    { name: 'Category', path: '/category', icon: Tag },
    { name: 'Trash', path: '/trash', icon: Trash2 },
  ];

  const secondaryLinks = [
    // { name: 'Smart Search', path: '/search', icon: Search },
    // { name: 'Duplicates', path: '/duplicates', icon: Copy },
    // { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const renderLinks = (links) => (
    <ul className="space-y-1">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <li key={link.name}>
            <Link
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <link.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {link.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className="w-64 border-r border-gray-100 bg-white h-screen sticky top-0 flex flex-col font-sans shrink-0">
      {/* Logo */}
      <div className="h-20 flex items-center px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="ScreenFlow AI Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
          <span className="font-extrabold text-xl tracking-tight text-gray-900">
            ScreenFlow <span className="text-indigo-600">AI</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 no-scrollbar">
        {/* Primary Links */}
        <div>
          {renderLinks(primaryLinks)}
        </div>

        {/* Separator */}
        <div className="h-px bg-gray-100 mx-2"></div>

        {/* Secondary Links */}
        <div>
          {renderLinks(secondaryLinks)}
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="p-4 space-y-4">
        {/* Storage Widget */}
        {/* <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="mb-2">
            <h4 className="text-sm font-bold text-gray-900">Storage</h4>
            <p className="text-xs text-gray-500 mt-1">2.4 GB of 10 GB used</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '24%' }}></div>
          </div>
          <button className="w-full flex items-center justify-between text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            Upgrade Plan
            <ChevronRight className="w-4 h-4" />
          </button>
        </div> */}

        {/* Promo Widget */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Save time.</p>
            <p className="text-xs text-gray-600 mt-0.5">Let AI organize for you.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
