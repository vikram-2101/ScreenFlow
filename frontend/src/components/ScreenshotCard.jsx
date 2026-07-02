import { useState, useEffect } from "react";
import OverrideModal from "./OverrideModal";
import client from "../api/client";
import { MoreHorizontal, Download } from "lucide-react";

export default function ScreenshotCard({ screenshot, onUpdate, isSelected, onToggleSelect }) {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    client.get(`/screenshots/${screenshot.id}/file`, { responseType: 'blob' })
      .then(res => {
        objectUrl = URL.createObjectURL(res.data);
        setImgUrl(objectUrl);
      })
      .catch(err => console.error("Failed to load thumbnail", err));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [screenshot.id]);

  // Determine Category Color
  const getCategoryStyle = (cat) => {
    const category = (cat || '').toLowerCase();
    if (category === 'finance') return 'bg-blue-50 text-blue-600';
    if (category === 'work' || category === 'planning') return 'bg-green-50 text-green-600';
    if (category === 'ui/ux' || category === 'design') return 'bg-purple-50 text-purple-600';
    return 'bg-gray-100 text-gray-600';
  };

  // Format timestamp nicely
  const timeAgo = screenshot.created_at ? new Date(screenshot.created_at).toLocaleDateString() : 'Just now';

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = screenshot.smart_filename || "screenshot.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col">
      {/* Top Left Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <input 
          type="checkbox" 
          checked={isSelected || false}
          onChange={() => onToggleSelect && onToggleSelect(screenshot.id)}
          className={`w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
        />
      </div>

      {/* Image Thumbnail */}
      <div className="flex justify-center bg-[#F9F9FC] rounded-xl overflow-hidden mb-4 relative" style={{ height: "180px" }}>
        {imgUrl ? (
          <img src={imgUrl} alt={screenshot.smart_filename} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-sm animate-pulse">Loading image...</div>
        )}
      </div>

      {/* Card Info */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-gray-900 text-sm truncate" title={screenshot.smart_filename}>
          {screenshot.smart_filename}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={handleDownload}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-md p-1.5 transition-colors shadow-sm"
            title="Download Screenshot"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setOpen(true)}
              className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md p-1.5 transition-colors"
              title="Edit Category"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer (Category & Time) */}
      <div className="flex items-center justify-between mt-auto">
        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${getCategoryStyle(screenshot.category)}`}>
          {screenshot.category || 'Uncategorized'}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {timeAgo}
        </span>
      </div>

      {open && (
        <OverrideModal
          screenshot={screenshot}
          onClose={() => setOpen(false)}
          onSave={(updated) => {
            onUpdate(updated);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}