import { useState } from "react";
import { overrideScreenshot } from "../api/screenshots";

const CATEGORIES = ["Document", "Receipt", "Travel", "Message", "Other"];

export default function OverrideModal({ screenshot, onClose, onSave }) {
  const [category, setCategory] = useState(screenshot.category);
  const [filename, setFilename] = useState(screenshot.smart_filename);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    const updated = await overrideScreenshot(screenshot.id, {
      category,
      smart_filename: filename,
    });

    onSave({
      ...screenshot,
      ...updated,
      confidence: 1.0, // user override = 100%
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96 space-y-4">
        <h2 className="text-lg font-semibold">Edit Screenshot</h2>

        <div>
          <label className="text-sm">Category</label>
          <select
            className="w-full border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm">Filename</label>
          <input
            className="w-full border p-2 rounded"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}