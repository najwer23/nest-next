export interface AnalyzeDto {
  text: string;
}

export interface AnalysisDto {
  id: string;
  text: string;
  sentiment: string;
  keywords: string[];
  createdAt: string;
  userId: string;
}

const API_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw error;
  }

  return response.json() as Promise<T>;
}

export function analyzeApi(
  accessToken: string,
  text: string,
): Promise<AnalysisDto> {
  return apiFetch(
    "/analytics/analyze",
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
    accessToken,
  );
}

export interface AnalysisHistoryDto {
  items: AnalysisDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}


export function getAnalysisHistoryApi(
  accessToken: string,
  userId: string,
  page = 1,
  limit = 10,
): Promise<AnalysisHistoryDto> {
  return apiFetch(
    `/analytics/users/${userId}?page=${page}&limit=${limit}`,
    {},
    accessToken,
  );
}