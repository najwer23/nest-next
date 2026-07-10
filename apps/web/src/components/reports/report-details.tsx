"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getReportApi,
  type ReportDto,
} from "@/lib/api/reports";

type Props = {
  accessToken: string;
  id: string;
};

export default function ReportDetails({
  accessToken,
  id,
}: Props) {
  const [report, setReport] =
    useState<ReportDto | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function fetchReport() {
    setLoading(true);
    setError("");

    try {
      const data =
        await getReportApi(
          accessToken,
          id,
        );

      setReport(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load report",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, [accessToken, id]);

  if (loading) {
    return (
      <p className="text-black">
        Loading report...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600">
        {error}
      </p>
    );
  }

  if (!report) {
    return (
      <p className="text-black">
        Report not found.
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-md border p-4 text-black">
      <p>
        <strong>
          Report ID:
        </strong>{" "}
        {report.id}
      </p>

      <p>
        <strong>
          Date range:
        </strong>{" "}
        {new Date(report.dateFrom).toLocaleString()}
        {" - "}
        {new Date(report.dateTo).toLocaleString()}
      </p>

      <p>
        <strong>
          Empty:
        </strong>{" "}
        {report.isEmpty ? "Yes" : "No"}
      </p>

      <div className="mt-4">
        <h3 className="font-bold">
          Aggregation
        </h3>

        <p>
          <strong>
            Analysis count:
          </strong>{" "}
          {report.data.analysisCount}
        </p>

        <p>
          <strong>
            Positive:
          </strong>{" "}
          {
            report.data
              .sentimentDistribution
              .positive
          }
        </p>

        <p>
          <strong>
            Negative:
          </strong>{" "}
          {
            report.data
              .sentimentDistribution
              .negative
          }
        </p>

        <p>
          <strong>
            Neutral:
          </strong>{" "}
          {
            report.data
              .sentimentDistribution
              .neutral
          }
        </p>
      </div>

      {report.data.mostActiveUsers &&
        report.data.mostActiveUsers.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">
              Most active users
            </h3>

            <ul className="mt-2 list-disc pl-5">
              {report.data.mostActiveUsers.map(
                user => (
                  <li key={user.userId}>
                    User ID: {user.userId}
                    {" - "}
                    Analyses: {user.count}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
    </div>
  );
}