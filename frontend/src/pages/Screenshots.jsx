import React, { useEffect, useState, useMemo } from 'react';
import { fetchScreenshots, bulkDelete } from '../api/screenshots';
import client from '../api/client';
import ScreenshotCard from '../components/ScreenshotCard';
import { ChevronDown, Search, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // Filter States
  const searchQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All Screenshots';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortOrder, setSortOrder] = useState('Newest First');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Selection State (for batch actions later)
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchScreenshots().then(data => {
      setScreenshots(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Extract unique categories for the dropdown
  const categories = useMemo(() => {
    const cats = new Set(screenshots.map(s => s.category).filter(Boolean));
    return ['All Screenshots', ...Array.from(cats)];
  }, [screenshots]);

  // Derived State (Filtering and Sorting)
  const filteredAndSorted = useMemo(() => {
    let result = [...screenshots];

    // Filter by Category
    if (activeCategory !== 'All Screenshots') {
      result = result.filter(s => s.category === activeCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.smart_filename && s.smart_filename.toLowerCase().includes(q)) ||
        (s.summary && s.summary.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }

    // Sort by Date
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      if (sortOrder === 'Newest First') return dateB - dateA;
      return dateA - dateB;
    });

    return result;
  }, [screenshots, activeCategory, searchQuery, sortOrder]);

  // Pagination Logic
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleUpdate = (updated) => {
    setScreenshots(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const confirmDeleteSelected = () => {
    setShowDeleteModal(true);
  };

  const executeDeleteSelected = async () => {
    setShowDeleteModal(false);
    try {
      await bulkDelete(selectedIds);
      setScreenshots(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to delete screenshots", err);
      alert("Failed to delete screenshots");
    }
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return;
    setIsDownloading(true);
    
    for (const id of selectedIds) {
      try {
        const res = await client.get(`/screenshots/${id}/file`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        const shot = screenshots.find(s => s.id === id);
        a.download = shot?.smart_filename || `screenshot-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // Small delay to prevent browser from blocking multiple rapid downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to download ${id}`, err);
      }
    }
    
    setIsDownloading(false);
    setSelectedIds([]); // Optionally clear selection after download
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
        
        {/* Left Side: Text */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Screenshots</h1>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
              {totalItems} items
            </span>
          </div>
          <p className="text-sm text-gray-500">View, search and manage all your screenshots in one place.</p>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Category Dropdown */}
          <div className="relative group">
            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-600" />
          </div>

          {/* Date Dropdown */}
          <div className="relative group">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 cursor-pointer"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-gray-600" />
          </div>

          {/* Upload Button */}
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm shrink-0">
            <UploadCloud className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar pr-2 pb-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 animate-pulse">Loading your screenshots...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="font-medium text-gray-700 mb-1">No screenshots found</p>
            <p className="text-sm">Try adjusting your filters or upload a new one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map(shot => (
              <ScreenshotCard 
                key={shot.id} 
                screenshot={shot} 
                onUpdate={handleUpdate}
                isSelected={selectedIds.includes(shot.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-900">{totalItems === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span> items
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 rounded-md text-xs font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-gray-400 px-1 text-xs">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-6 h-6 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative group">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="appearance-none pl-2 pr-6 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 cursor-pointer"
          >
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8">
          <span className="font-semibold text-sm">{selectedIds.length} items selected</span>
          <div className="w-px h-5 bg-gray-700"></div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBulkDownload}
              disabled={isDownloading}
              className="text-sm font-medium hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Download All'}
            </button>
            <button 
              onClick={confirmDeleteSelected}
              disabled={isDownloading}
              className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Move to Trash?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to move <span className="font-semibold text-gray-800">{selectedIds.length} items</span> to the trash? You can restore them later from the Trash page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteSelected}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
