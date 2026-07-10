"use client";

import { useState } from "react";
import { createReportApi } from "@/lib/api/reports";

type Props = {
  accessToken: string;
};

type ReportStatus =
  | "idle"
  | "in_progress"
  | "failed";

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export default function ReportGenerator({
  accessToken,
}: Props) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] =
    useState<ReportStatus>("idle");
  const [error, setError] = useState("");

  async function generateReport() {
    if (!dateFrom || !dateTo) return;

    setError("");
    setStatus("in_progress");

    try {
      await delay(300);

      await createReportApi(
        accessToken,
        {
          dateFrom,
          dateTo,
        },
      );

      setStatus("idle");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Report generation failed",
      );
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div>
          <label
            htmlFor="dateFrom"
            className="block text-sm font-medium text-black"
          >
            Date from
          </label>
          <input
            id="dateFrom"
            className="mt-1 rounded-md border px-3 py-2 text-sm text-black"
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(e.target.value)
            }
          />
        </div>

        <div>
          <label
            htmlFor="dateTo"
            className="block text-sm font-medium text-black"
          >
            Date to
          </label>
          <input
            id="dateTo"
            className="mt-1 rounded-md border px-3 py-2 text-sm text-black"
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(e.target.value)
            }
          />
        </div>
      </div>

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={generateReport}
        disabled={
          status === "in_progress"
        }
      >
        {status === "in_progress"
          ? "Generating..."
          : status === "failed"
          ? "Retry"
          : "Generate report"}
      </button>

      {status === "in_progress" && (
        <p className="text-black">
          Report generation in progress...
        </p>
      )}

      {status === "failed" && (
        <p className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}