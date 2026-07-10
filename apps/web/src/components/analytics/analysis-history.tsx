'use client';

import { useEffect, useState } from "react";
import {
  getAnalysisHistoryApi,
  type AnalysisDto,
} from "@/lib/api/analytics";

import { useAnalyticsStore } from "@/stores/analytics-store";

type Props = {
  accessToken: string;
  userId: string;
};

export default function AnalysisHistory({
  accessToken,
  userId,
}: Props) {
  const [items, setItems] = useState<AnalysisDto[]>([]);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshKey = useAnalyticsStore(
    (state) => state.refreshKey,
  );


  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getAnalysisHistoryApi(
          accessToken,
          userId,
          page,
          limit,
        );

        setItems(result.items);
        setPages(result.meta.pages);
        setTotal(result.meta.total);

      } catch {
        setError("Failed to load history");

      } finally {
        setLoading(false);
      }
    }

    load();
  }, [
    accessToken,
    userId,
    page,
    limit,
    refreshKey
  ]);

  useEffect(() => {
    setPage(1);
  }, [refreshKey]);


  if (loading) {
    return (
      <p className="mt-5 text-black">
        Loading analyses...
      </p>
    );
  }


  if (error) {
    return (
      <p className="text-black border border-black rounded p-3">
        {error}
      </p>
    );
  }


  if (!items.length) {
    return (
      <p className="text-black">
        No analyses found.
      </p>
    );
  }


  return (
    <div className="space-y-4 text-black">

      <div className="mt-5 border border-black rounded p-3">
        Total analyses: {total}
      </div>


      {items.map((item) => (
        <div
          key={item.id}
          className="border border-black rounded p-4 bg-white"
        >
          <p>
            <strong>Sentiment:</strong>{" "}
            {item.sentiment}
          </p>

          <p>
            <strong>Keywords:</strong>{" "}
            {item.keywords?.join(", ")}
          </p>

          <p className="text-sm text-black">
            <strong>Text:</strong>{" "}
            {item.text}
          </p>

          <p className="text-sm text-black">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      ))}


      <div className="flex items-center gap-4">

        <button
          disabled={page === 1}
          onClick={() =>
            setPage((current) => current - 1)
          }
          className="border border-black px-3 py-1 rounded text-black disabled:opacity-50"
        >
          Previous
        </button>


        <span className="text-black">
          Page {page} of {pages}
        </span>


        <button
          disabled={page === pages}
          onClick={() =>
            setPage((current) => current + 1)
          }
          className="border border-black px-3 py-1 rounded text-black disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}