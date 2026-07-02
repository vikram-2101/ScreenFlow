import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
