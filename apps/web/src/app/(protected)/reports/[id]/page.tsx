import {
  cookies,
} from "next/headers";

import ReportDetails from "@/components/reports/report-details";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Report — UserHub" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();

  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    notFound();
  }

  return (
    <main>
      <h1 className="text-xl font-bold text-black">
        Report details
      </h1>

      <ReportDetails
        accessToken={accessToken}
        id={id}
      />
    </main>
  );
}