import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Folder, Search, Lock, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { openAuthModal } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 gap-10 lg:gap-16">
        {/* Left Content */}
        <div className="flex-1 space-y-6 sm:space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start w-full">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Screenshot Organizer
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Organize Screenshots. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
              Automatically.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed px-4 sm:px-0">
            ScreenFlow AI uses smart AI to rename, categorize and organize your screenshots so you can find anything, instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 w-full px-4 sm:px-0">
            <Link 
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm text-center"
            >
              Try Demo
            </Link>
          </div>
        </div>

        {/* Right Mockup */}
        <div className="w-full lg:flex-1 max-w-2xl relative mt-8 lg:mt-0 px-4 sm:px-0">
          {/* Background decorative blob */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-blue-100 rounded-3xl transform rotate-3 scale-105 opacity-50 blur-xl"></div>
          
          {/* Mockup Container (Iframe) */}
          <iframe 
            src="/screenflow_mobile_demo.html" 
            className="relative w-full rounded-[20px] shadow-2xl border-0 z-10 h-[600px] block sm:hidden" 
            title="ScreenFlow AI Mobile Animation"
          />
          <iframe 
            src="/animate.html" 
            className="relative w-full rounded-[20px] shadow-2xl border-0 z-10 hidden sm:block sm:h-[480px] md:h-[520px]" 
            title="ScreenFlow AI Animation"
          />
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-16 sm:py-24 relative overflow-hidden">
        {/* Soft bottom wave/blob for aesthetics */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-indigo-50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10 sm:mb-12">Why use ScreenFlow AI?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Auto Rename</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI analyzes your screenshots and gives them meaningful names.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Organization</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Screenshots are automatically categorized and tagged.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Search</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Find any screenshot in seconds with powerful search.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
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
