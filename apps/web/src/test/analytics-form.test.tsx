import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AnalyticsForm from '../components/analytics/analytics-form';

import { analyzeApi } from '@/lib/api/analytics';
import { useAnalyticsStore } from '@/stores/analytics-store';


vi.mock('@/lib/api/analytics', () => ({
  analyzeApi: vi.fn(),
}));


vi.mock('@/stores/analytics-store', () => ({
  useAnalyticsStore: vi.fn(),
}));


describe('AnalyticsForm', () => {
  const refreshHistory = vi.fn();


  beforeEach(() => {
    vi.clearAllMocks();

    (
      useAnalyticsStore as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      (selector) =>
        selector({
          refreshHistory,
        }),
    );
  });


  it('shows analysis in progress state', async () => {
    (
      analyzeApi as unknown as ReturnType<typeof vi.fn>
    ).mockImplementation(
      () =>
        new Promise(() => {}),
    );


    render(
      <AnalyticsForm
        accessToken="token"
      />,
    );


    fireEvent.change(
      screen.getByPlaceholderText(
        'Enter text to analyze...',
      ),
      {
        target: {
          value: 'hello',
        },
      },
    );


    fireEvent.click(
      screen.getByRole(
        'button',
        {
          name: 'Analyze',
        },
      ),
    );


    expect(
      await screen.findByText(
        'Analysis in progress...',
      ),
    ).toBeInTheDocument();
  });


  it('shows result after successful analysis', async () => {
    (
      analyzeApi as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      sentiment: 'positive',
      keywords: [
        'nestjs',
      ],
      text: 'hello',
    });


    render(
      <AnalyticsForm
        accessToken="token"
      />,
    );


    fireEvent.change(
      screen.getByPlaceholderText(
        'Enter text to analyze...',
      ),
      {
        target: {
          value: 'hello',
        },
      },
    );


    fireEvent.click(
      screen.getByRole(
        'button',
        {
          name: 'Analyze',
        },
      ),
    );


    expect(
      await screen.findByText(
        'Sentiment:',
      ),
    ).toBeInTheDocument();


    expect(
      screen.getByText(
        'positive',
      ),
    ).toBeInTheDocument();


    expect(
      refreshHistory,
    ).toHaveBeenCalled();
  });


  it('shows failure and retry button', async () => {
    (
      analyzeApi as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(
      new Error(
        'Analytics failed',
      ),
    );


    render(
      <AnalyticsForm
        accessToken="token"
      />,
    );


    fireEvent.change(
      screen.getByPlaceholderText(
        'Enter text to analyze...',
      ),
      {
        target: {
          value: 'hello',
        },
      },
    );


    fireEvent.click(
      screen.getByRole(
        'button',
        {
          name: 'Analyze',
        },
      ),
    );


    expect(
      await screen.findByText(
        'Analytics failed',
      ),
    ).toBeInTheDocument();


    expect(
      screen.getByRole(
        'button',
        {
          name: 'Retry',
        },
      ),
    ).toBeInTheDocument();
  });
});