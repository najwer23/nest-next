export type ReportDto = {
  id: string;
  dateFrom: string;
  dateTo: string;
  isEmpty: boolean;
  createdAt: string;
  data: {
    analysisCount: number;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    mostActiveUsers?: {
      userId: string;
      count: number;
    }[];
  };
};


const API_URL =
  process.env.API_URL ??
  "http://localhost:3001/api/v1";


async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken
      ? {
          Authorization:
            `Bearer ${accessToken}`,
        }
      : {}),
    ...options.headers,
  };


  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      },
    );


  if (!response.ok) {
    throw await response
      .json()
      .catch(() => ({
        message:
          "Request failed",
      }));
  }


  return response.json();
}


export function createReportApi(
  accessToken: string,
  payload: {
    dateFrom: string;
    dateTo: string;
  },
) {
  return apiFetch<ReportDto>(
    "/reports",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}


export function getReportApi(
  accessToken: string,
  id: string,
) {
  return apiFetch<ReportDto>(
    `/reports/${id}`,
    {},
    accessToken,
  );
}


export function getReportsApi(
  accessToken: string,
) {
  return apiFetch<ReportDto[]>(
    "/reports",
    {},
    accessToken,
  );
}