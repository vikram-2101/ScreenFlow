import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Folder, Search, X, Eye, EyeOff } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalView, setAuthModalView, login, signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (authModalView === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder for Google OAuth
    console.log("Google Login clicked");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-sans">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side (Graphics & Features) */}
        <div className="hidden lg:flex flex-col w-1/2 p-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-white relative">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              ScreenFlow <span className="text-indigo-600">AI</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium w-fit mb-6">
            <Sparkles className="w-3 h-3" />
            AI-Powered Screenshot Organizer
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
            Organize. Find.<br/>
            <span className="text-indigo-600">Focus.</span>
          </h2>
          
          <p className="text-sm text-gray-600 leading-relaxed mb-8 max-w-sm">
            ScreenFlow AI automatically names, categorizes and organizes your screenshots so you can find anything, instantly.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">AI Auto Rename</h4>
                <p className="text-xs text-gray-500 mt-1">Smart names for your screenshots</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Smart Organization</h4>
                <p className="text-xs text-gray-500 mt-1">Automatic folders and tags</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Instant Search</h4>
                <p className="text-xs text-gray-500 mt-1">Find anything in seconds</p>
              </div>
            </div>
          </div>
          
          {/* Abstract Folder Illustration */}
          <div className="absolute bottom-0 right-0 w-64 h-64 translate-x-12 translate-y-12 opacity-80 pointer-events-none">
             <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-2xl transform rotate-12 shadow-2xl relative">
                <div className="absolute inset-2 bg-white/20 backdrop-blur-md rounded-xl transform -rotate-6"></div>
                <div className="absolute inset-4 bg-white/40 backdrop-blur-lg rounded-lg transform -rotate-12 border border-white/50"></div>
                <div className="absolute bottom-4 right-4 bg-white/30 px-3 py-1 rounded font-bold text-white text-xs backdrop-blur-md">AI</div>
             </div>
          </div>
        </div>

        {/* Right Side (Auth Form) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8 mt-2">
            <button 
              className={`flex-1 pb-4 text-sm font-semibold transition-colors ${authModalView === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => { setAuthModalView('login'); setError(''); }}
            >
              Log in
            </button>
            <button 
              className={`flex-1 pb-4 text-sm font-semibold transition-colors ${authModalView === 'signup' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              onClick={() => { setAuthModalView('signup'); setError(''); }}
            >
              Sign up
            </button>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {authModalView === 'login' ? 'Welcome back! 👋' : 'Create an account 🚀'}
          </h3>
          <p className="text-sm text-gray-500 mb-8">
            {authModalView === 'login' ? 'Log in to your account to continue' : 'Sign up to start organizing your screenshots'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
            
            <div>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authModalView === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                  <span className="text-sm text-gray-700 font-medium">Remember me</span>
                </label>
                <button type="button" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70 mt-2"
            >
              {isLoading ? 'Processing...' : (authModalView === 'login' ? 'Log in' : 'Sign up')}
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative bg-white px-4 text-xs text-gray-400 uppercase tracking-wider font-medium">
              or continue with
            </span>
          </div>

          <div className="mt-8">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            {authModalView === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setAuthModalView(authModalView === 'login' ? 'signup' : 'login')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {authModalView === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
