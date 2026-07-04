import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react'; // If we add dark mode later, placeholders for now

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#FDFDFD]/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
            <img src="/logo.png" alt="ScreenFlow AI Logo" className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain drop-shadow-sm" />
            <span className="font-extrabold text-xl sm:text-2xl lg:text-[1.75rem] tracking-tight text-gray-900 whitespace-nowrap">
              ScreenFlow <span className="text-indigo-600">AI</span>
            </span>
          </Link>
        </div>

        {/* Center: Public Links (Only visible on Landing or if not authenticated) */}
        {(!isAuthenticated || isLanding) && (
          <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </div>
        )}

        {/* Center: Private Links (Only visible when authenticated and NOT on landing) */}
        {(isAuthenticated && !isLanding) && (
          <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
            <Link to="/dashboard" className={`hover:text-indigo-600 transition-colors ${location.pathname === '/dashboard' ? 'text-indigo-600' : ''}`}>Dashboard</Link>
            <Link to="/analytics" className={`hover:text-indigo-600 transition-colors ${location.pathname === '/analytics' ? 'text-indigo-600' : ''}`}>Analytics</Link>
          </div>
        )}

        {/* Right: Auth / Theme */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
            <Sun className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3 sm:gap-4 ml-1 sm:ml-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.email}</span>
              <button 
                onClick={logout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2">
              <button 
                onClick={() => openAuthModal('login')}
                className="hidden sm:block px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Log in
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
