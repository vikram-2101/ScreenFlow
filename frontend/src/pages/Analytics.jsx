import { useEffect, useState } from "react";
import { fetchClassificationAnalytics } from "../api/analytics";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchClassificationAnalytics().then(setData);
  }, []);

  if (!data) return <div className="p-6">Loading analytics…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric title="Total Screenshots" value={data.total} />
        <Metric title="Low Confidence" value={`${data.low_confidence_rate * 100}%`} />
        <Metric title="Corrections" value={`${data.correction_rate * 100}%`} />
        <Metric title="LLM Fallback" value={`${data.llm_fallback_rate * 100}%`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">By Category</h2>
        <div className="space-y-1">
          {Object.entries(data.by_category).map(([cat, count]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span>{cat}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}