import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Folder, Search, Lock, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { openAuthModal } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-6 py-16 gap-12">
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Screenshot Organizer
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Organize Screenshots. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Automatically.
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
            ScreenFlow AI uses smart AI to rename, categorize and organize your screenshots so you can find anything, instantly.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button 
              onClick={() => openAuthModal('signup')} 
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
            >
              Try Demo
            </button>
            <button 
              onClick={() => openAuthModal('signup')} 
              className="px-8 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
            >
              Sign Up Free
            </button>
            <button className="px-6 py-3.5 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Mockup */}
        <div className="flex-1 w-full max-w-2xl relative">
          {/* Background decorative blob */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-blue-100 rounded-3xl transform rotate-3 scale-105 opacity-50 blur-xl"></div>
          
          {/* Mockup Container */}
          <div className="relative bg-white/60 backdrop-blur-sm border border-white/40 p-4 rounded-2xl shadow-2xl">
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-inner flex">
               {/* Sidebar placeholder */}
               <div className="w-48 bg-white border-r border-gray-100 p-4 space-y-4 hidden md:block">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold mb-8">
                    <div className="w-6 h-6 bg-indigo-600 rounded-md"></div>
                    ScreenFlow
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 bg-indigo-50 rounded text-indigo-600 text-sm flex items-center px-3 font-medium">Dashboard</div>
                    <div className="h-8 hover:bg-gray-50 rounded text-gray-600 text-sm flex items-center px-3">Screenshots</div>
                    <div className="h-8 hover:bg-gray-50 rounded text-gray-600 text-sm flex items-center px-3">Albums</div>
                  </div>
               </div>
               {/* Main content placeholder */}
               <div className="flex-1 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">All Screenshots</h3>
                    <div className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium">Upload</div>
                  </div>
                  {/* Grid */}
                  <div className="grid grid-cols-2 gap-4">
                     {[1, 2, 3, 4].map(i => (
                       <div key={i} className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                         <div className="w-full h-24 bg-gray-100 rounded mb-2"></div>
                         <div className="h-3 w-3/4 bg-gray-200 rounded mb-1"></div>
                         <div className="h-2 w-1/4 bg-indigo-200 rounded"></div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24 relative overflow-hidden">
        {/* Soft bottom wave/blob for aesthetics */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-indigo-50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why use ScreenFlow AI?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Auto Rename</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI analyzes your screenshots and gives them meaningful names.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Organization</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Screenshots are automatically categorized and tagged.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Search</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Find any screenshot in seconds with powerful search.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your data is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
