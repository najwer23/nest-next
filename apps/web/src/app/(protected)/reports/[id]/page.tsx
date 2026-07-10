import {
  cookies,
} from "next/headers";

import ReportDetails from "@/components/reports/report-details";

export default async function ReportPage({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const token =
    (await cookies())
      .get("accessToken")
      ?.value;

  return (
    <main>
      <h1 className="text-xl font-bold text-black">
        Report details
      </h1>

      <ReportDetails
        accessToken={
          token ?? ""
        }
        id={
          params.id
        }
      />
    </main>
  );
}