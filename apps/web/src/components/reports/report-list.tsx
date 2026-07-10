"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getReportsApi,
  type ReportDto,
} from "@/lib/api/reports";

type Props = {
  accessToken: string;
};

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

function formatDate(dateString?: string) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(date);
}

export default function ReportsList({
  accessToken,
}: Props) {
  const router = useRouter();

  const [reports, setReports] =
    useState<ReportDto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function fetchReports() {
    setLoading(true);
    setError("");

    try {
      await delay(300);

      const data =
        await getReportsApi(
          accessToken,
        );

      setReports(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reports",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [accessToken]);

  return (
    <div className="mt-5 space-y-4">
      <hr />

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={fetchReports}
        disabled={loading}
      >
        {loading
          ? "Refreshing..."
          : "Refresh reports"}
      </button>

      {error && (
        <p className="text-red-600">
          {error}
        </p>
      )}

      {!loading &&
        reports.length === 0 && (
          <p className="text-black">
            No reports found.
          </p>
        )}

      {reports.map((report) => (
        <button
          key={report.id}
          className="block w-full rounded-md border p-4 text-left text-black"
          onClick={() =>
            router.push(
              `/reports/${report.id}`,
            )
          }
        >
          <p>
            <strong>
              Created at:
            </strong>{" "}
            {formatDate(
              report.createdAt,
            )}
          </p>

          <p>
            <strong>
              Date range:
            </strong>{" "}
            {formatDate(
              report.dateFrom,
            )}
            {" - "}
            {formatDate(
              report.dateTo,
            )}
          </p>

          <p>
            <strong>
              Analyses:
            </strong>{" "}
            {report.data.analysisCount}
          </p>

          <p>
            <strong>
              Empty:
            </strong>{" "}
            {report.isEmpty
              ? "Yes"
              : "No"}
          </p>
        </button>
      ))}
    </div>
  );
}