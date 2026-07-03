import React, { useState, useEffect } from 'react';
import { Plus, Folder, ChevronLeft, ChevronRight, ChevronDown, Trash2, MoreHorizontal } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchCategories, createCategory, deleteCategory } from '../api/categories';
import client from '../api/client';

// Helper to assign a random-ish color based on the category name
const getColorTheme = (name) => {
  const colors = [
    'text-purple-500 bg-purple-50', 'text-blue-500 bg-blue-50',
    'text-green-500 bg-green-50', 'text-orange-500 bg-orange-50',
    'text-indigo-500 bg-indigo-50', 'text-yellow-500 bg-yellow-50',
    'text-pink-500 bg-pink-50', 'text-teal-500 bg-teal-50',
    'text-red-500 bg-red-50', 'text-sky-500 bg-sky-50',
    'text-violet-500 bg-violet-50', 'text-rose-500 bg-rose-50'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ThumbnailImage = ({ id }) => {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    if (!id) return;
    let objectUrl = null;
    client.get(`/screenshots/${id}/file`, { responseType: 'blob' })
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setImgUrl(objectUrl);
      })
      .catch(err => console.error("Failed to load thumbnail", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return imgUrl ? (
    <img src={imgUrl} className="w-full h-full object-cover" alt="Thumbnail" />
  ) : (
    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
  );
};

const CategoryCard = ({ category, onDeleteRequest }) => {
  const colorTheme = getColorTheme(category.name);
  const dateStr = new Date(category.created_at).toLocaleDateString();
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/screenshots?category=${encodeURIComponent(category.name)}`)}
      className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
    >
      {/* Thumbnails Section */}
      <div className="relative h-32 rounded-xl bg-gray-50 mb-4 overflow-hidden flex gap-1 p-1 shrink-0">
        <div className="flex-1 rounded-lg bg-gray-100 overflow-hidden">
          {category.thumbnails && category.thumbnails[0] && <ThumbnailImage id={category.thumbnails[0]} />}
        </div>
        <div className="flex-1 rounded-lg bg-gray-200 overflow-hidden">
          {category.thumbnails && category.thumbnails[1] && <ThumbnailImage id={category.thumbnails[1]} />}
        </div>
       
        
        {/* Count Badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm border border-gray-100/50">
          +{category.count}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3 px-1 pb-1 mt-auto">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorTheme}`}>
          <Folder className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm truncate">{category.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{category.count} screenshots</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Created {dateStr}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Placeholder for future edit functionality
            }}
            className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md transition-colors hover:bg-gray-100"
            title="Edit Category"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(category);
            }}
            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md transition-colors hover:bg-red-50"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Category() {
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get('q') || '').toLowerCase();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catToDelete, setCatToDelete] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error("Failed to create category", error);
      alert("Failed to create category");
    }
  };

  const executeDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      await deleteCategory(catToDelete.id);
      setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
      setCatToDelete(null);
    } catch (error) {
      console.error("Failed to delete category", error);
      alert("Failed to delete category");
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Page Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        
        {/* Left Side: Title & Subtitle */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
              {filteredCategories.length} categories
            </span>
          </div>
          <p className="text-sm text-gray-500">Organize your screenshots into collections.</p>
        </div>

        {/* Right Side: Actions (New Category) */}
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar pr-2 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <CategoryCard key={category.id} category={category} onDeleteRequest={(cat) => setCatToDelete(cat)} />
              ))
            ) : (
              <div className="col-span-full h-40 flex items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="font-medium text-gray-700">No categories found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredCategories.length === 0 ? 0 : 1}</span> to <span className="font-medium text-gray-900">{Math.min(12, filteredCategories.length)}</span> of <span className="font-medium text-gray-900">{filteredCategories.length}</span> categories
        </div>

        <div className="flex items-center gap-1.5">
          <button disabled className="p-1 rounded-md border border-gray-200 text-gray-300 bg-gray-50 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-0.5">
            <button className="w-6 h-6 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-sm">1</button>
          </div>

          <button disabled className="p-1 rounded-md border border-gray-200 text-gray-300 bg-gray-50 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative group">
          <select className="appearance-none pl-2 pr-6 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 cursor-pointer">
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Create New Category</h2>
            <p className="text-sm text-gray-500 mb-6">Enter a name for your new collection.</p>
            
            <form onSubmit={handleCreateCategory}>
              <input
                type="text"
                autoFocus
                placeholder="e.g., Tax Documents 2026"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {catToDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Category</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{catToDelete.name}"</span>? 
              Screenshots inside will become uncategorized.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteCategory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
