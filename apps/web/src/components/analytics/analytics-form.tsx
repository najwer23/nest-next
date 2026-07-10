'use client';

import { useState } from "react";
import { analyzeApi, type AnalysisDto } from "@/lib/api/analytics";
import { useAnalyticsStore } from "@/stores/analytics-store";

type Props = {
  accessToken: string;
};

export default function AnalyticsForm({
  accessToken,
}: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshHistory = useAnalyticsStore(
    (state) => state.refreshHistory,
  );

  async function analyze() {
    setLoading(true);
    setError("");

    try {
      const analysis = await analyzeApi(
        accessToken,
        text,
      );

      setResult(analysis);

      refreshHistory();
      
    } catch (err: any) {
      setError(
        err?.message ?? "Analysis failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <textarea
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to analyze..."
      />

      <button
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={analyze}
        disabled={loading || !text.trim()}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && (
        <p className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          
          <p>
            <strong>Sentiment:</strong>{" "}
            {result.sentiment}
          </p>

          <p>
            <strong>Keywords:</strong>{" "}
            {result.keywords.join(", ")}
          </p>
        </div>
      )}
     
    </>
  );
}