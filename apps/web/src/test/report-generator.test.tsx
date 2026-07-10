import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import ReportGenerator from "@/components/reports/report-generator";

import {
  createReportApi,
} from "@/lib/api/reports";

vi.mock("@/lib/api/reports", () => ({
  createReportApi: vi.fn(),
}));

const mockedCreateReportApi =
  vi.mocked(createReportApi);

describe("ReportGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inputs and button", () => {
    render(
      <ReportGenerator
        accessToken="token"
      />,
    );

    expect(
      screen.getByLabelText(
        "Date from",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(
        "Date to",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Generate report",
      }),
    ).toBeInTheDocument();
  });

  it("does not call api when dates are empty", () => {
    render(
      <ReportGenerator
        accessToken="token"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate report",
      }),
    );

    expect(
      mockedCreateReportApi,
    ).not.toHaveBeenCalled();
  });

  it("creates report", async () => {
    mockedCreateReportApi.mockResolvedValue(
      {} as never,
    );

    render(
      <ReportGenerator
        accessToken="token"
      />,
    );

    fireEvent.change(
      screen.getByLabelText(
        "Date from",
      ),
      {
        target: {
          value: "2026-01-01",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Date to",
      ),
      {
        target: {
          value: "2026-01-10",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate report",
      }),
    );

    await waitFor(() =>
      expect(
        mockedCreateReportApi,
      ).toHaveBeenCalledWith(
        "token",
        {
          dateFrom: "2026-01-01",
          dateTo: "2026-01-10",
        },
      ),
    );

    expect(
      screen.getByRole("button", {
        name: "Generate report",
      }),
    ).toBeInTheDocument();
  });

  it("shows error when api fails", async () => {
    mockedCreateReportApi.mockRejectedValue(
      new Error(
        "Report generation failed",
      ),
    );

    render(
      <ReportGenerator
        accessToken="token"
      />,
    );

    fireEvent.change(
      screen.getByLabelText(
        "Date from",
      ),
      {
        target: {
          value: "2026-01-01",
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        "Date to",
      ),
      {
        target: {
          value: "2026-01-10",
        },
      },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generate report",
      }),
    );

    expect(
      await screen.findByText(
        "Report generation failed",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Retry",
      }),
    ).toBeInTheDocument();
  });
});