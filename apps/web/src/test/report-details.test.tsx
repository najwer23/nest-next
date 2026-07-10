import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  getReportApi,
  type ReportDto,
} from "@/lib/api/reports";
import ReportDetails from "@/components/reports/report-details";

vi.mock("@/lib/api/reports", () => ({
  getReportApi: vi.fn(),
}));

const mockedGetReportApi =
  vi.mocked(getReportApi);

const report: ReportDto = {
  id: "report-1",
  createdAt: "2026-01-05T12:00:00.000Z",
  dateFrom: "2026-01-01T00:00:00.000Z",
  dateTo: "2026-01-10T23:59:59.999Z",
  isEmpty: false,
  data: {
    analysisCount: 5,
    sentimentDistribution: {
      positive: 3,
      negative: 1,
      neutral: 1,
    },
    mostActiveUsers: [
      {
        userId: "user-1",
        count: 3,
      },
    ],
  },
};

describe("ReportDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    mockedGetReportApi.mockReturnValue(
      new Promise(() => {}),
    );

    render(
      <ReportDetails
        accessToken="token"
        id="report-1"
      />,
    );

    expect(
      screen.getByText(
        "Loading report...",
      ),
    ).toBeInTheDocument();
  });

  it("renders report details", async () => {
    mockedGetReportApi.mockResolvedValue(
      report,
    );

    render(
      <ReportDetails
        accessToken="token"
        id="report-1"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          /Report ID:/,
        ),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByText(
        "Analysis count:",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("5"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Most active users",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /User ID: user-1/,
      ),
    ).toBeInTheDocument();
  });

  it("shows error message", async () => {
    mockedGetReportApi.mockRejectedValue(
      new Error(
        "Failed to load report",
      ),
    );

    render(
      <ReportDetails
        accessToken="token"
        id="report-1"
      />,
    );

    expect(
      await screen.findByText(
        "Failed to load report",
      ),
    ).toBeInTheDocument();
  });

  it("does not show most active users when empty", async () => {
    mockedGetReportApi.mockResolvedValue({
      ...report,
      data: {
        ...report.data,
        mostActiveUsers: [],
      },
    });

    render(
      <ReportDetails
        accessToken="token"
        id="report-1"
      />,
    );

    await screen.findByText(
      "Analysis count:",
    );

    expect(
      screen.queryByText(
        "Most active users",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows report not found when api returns null", async () => {
    mockedGetReportApi.mockResolvedValue(
      null as unknown as ReportDto,
    );

    render(
      <ReportDetails
        accessToken="token"
        id="report-1"
      />,
    );

    expect(
      await screen.findByText(
        "Report not found.",
      ),
    ).toBeInTheDocument();
  });
});