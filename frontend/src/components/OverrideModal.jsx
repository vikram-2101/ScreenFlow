import { useState, useEffect } from "react";
import { overrideScreenshot } from "../api/screenshots";
import { fetchCategories } from "../api/categories";

export default function OverrideModal({ screenshot, onClose, onSave }) {
  const [category, setCategory] = useState(screenshot.category || '');
  const [filename, setFilename] = useState(screenshot.smart_filename || '');
  const [loading, setLoading] = useState(false);
  const [availableCats, setAvailableCats] = useState([]);

  useEffect(() => {
    fetchCategories()
      .then(data => setAvailableCats(data.map(c => c.name)))
      .catch(err => console.error("Failed to load categories for modal", err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await overrideScreenshot(screenshot.id, {
        category,
        smart_filename: filename,
      });

      onSave({
        ...screenshot,
        ...updated,
        confidence: 1.0, // user override = 100%
      });
    } catch (error) {
      console.error("Failed to save override", error);
      alert("Failed to save changes.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900">Edit Screenshot</h2>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category</label>
            <select
              className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {availableCats.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {/* Fallback if current category isn't in list yet */}
              {category && !availableCats.includes(category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Filename</label>
            <input
              className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. Tax Return 2026.png"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}