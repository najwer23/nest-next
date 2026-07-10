import ReportGenerator from "@/components/reports/report-generator";
import ReportList from "@/components/reports/report-list";
import type { Metadata } from "next";

import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Reports — UserHub" };

export default async function ReportsPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    notFound();
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Reports
      </h1>

      <ReportGenerator
        accessToken={accessToken}
      />

       <ReportList
        accessToken={accessToken}
      />
    </>
  );
}