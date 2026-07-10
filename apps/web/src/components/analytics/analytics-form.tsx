"use client";

import { useState } from "react";

import {
  analyzeApi,
  type AnalysisDto,
} from "@/lib/api/analytics";

import { useAnalyticsStore } from "@/stores/analytics-store";

type Props = {
  accessToken: string;
};

type AnalysisStatus =
  | "idle"
  | "in_progress"
  | "failed"
  | "success";

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export default function AnalyticsForm({
  accessToken,
}: Props) {
  const [text, setText] =
    useState("");

  const [result, setResult] =
    useState<AnalysisDto | null>(null);

  const [status, setStatus] =
    useState<AnalysisStatus>("idle");

  const [error, setError] =
    useState("");

  const refreshHistory =
    useAnalyticsStore(
      (state) => state.refreshHistory,
    );

  async function analyze() {
    if (!text.trim()) return;

    setError("");
    setResult(null);
    setStatus("in_progress");

    try {
      await delay(300);

      const analysis =
        await analyzeApi(
          accessToken,
          text,
        );

      setResult(analysis);
      setStatus("success");

      refreshHistory();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed",
      );

      setStatus("failed");
    }
  }

  return (
    <div className="space-y-4">

      <textarea
        className="mt-1 block w-full rounded-md border px-3 py-2 text-sm text-black"
        rows={6}
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        placeholder="Enter text to analyze..."
      />

      <button
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={analyze}
        disabled={
          status === "in_progress" ||
          !text.trim()
        }
      >
        {status === "in_progress"
          ? "Analyzing..."
          : status === "failed"
          ? "Retry"
          : "Analyze"}
      </button>

      {status === "in_progress" && (
        <p className="mt-4 text-black">
          Analysis in progress...
        </p>
      )}

      {status === "failed" && (
        <div className="mt-4">
          <p className="text-red-600">
            {error}
          </p>
        </div>
      )}

      {status === "success" &&
        result && (
          <div className="mt-5 rounded-md border p-4 text-black">
            <p>
              <strong>
                Sentiment:
              </strong>{" "}
              {result.sentiment}
            </p>

            <p>
              <strong>
                Keywords:
              </strong>{" "}
              {result.keywords?.join(", ")}
            </p>

            <p className="mt-2">
              <strong>
                Text:
              </strong>{" "}
              {result.text}
            </p>

          </div>
        )}

    </div>
  );
}