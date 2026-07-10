import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import AnalyticsForm from "../../../components/analytics/analytics-form";
import AnalysisHistory from "@/components/analytics/analysis-history";
import { getMeApi } from "@/lib/api/users";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — UserHub" };

export default async function AnalyticsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    notFound();
  }

  const user = await getMeApi(accessToken);

  return (
    <>
       <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Text Analysis
      </h1>

      <AnalyticsForm accessToken={accessToken} />

      <br />

       <AnalysisHistory
        accessToken={accessToken}
        userId={user.id}
      />
    </>
  );
}