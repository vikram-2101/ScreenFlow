import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon } from 'lucide-react'; // If we add dark mode later, placeholders for now

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
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
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
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
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <Sun className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

          {isAuthenticated ? (
            <div className="flex items-center gap-4 ml-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.email}</span>
              <button 
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <button 
                onClick={() => openAuthModal('login')}
                className="px-5 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button 
                onClick={() => openAuthModal('signup')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-lg transition-colors cursor-pointer"
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
