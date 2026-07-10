import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const prisma = {
    analysis: {
      findMany: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ReportsService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
        ],
      }).compile();

    service =
      module.get<ReportsService>(
        ReportsService,
      );
  });


  it('creates report excluding failed analyses', async () => {
    prisma.analysis.findMany.mockResolvedValue([
      {
        sentiment: 'positive',
        status: 'SUCCESS',
      },
      {
        sentiment: 'negative',
        status: 'SUCCESS',
      },
    ]);

    prisma.report.create.mockResolvedValue({
      id: 'report-1',
    });


    const result =
      await service.create(
        'user-1',
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-10',
        },
      );


    expect(
      prisma.report.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isEmpty: false,
        data: {
          analysisCount: 2,
          sentimentDistribution: {
            positive: 1,
            negative: 1,
            neutral: 0,
          },
        },
      }),
    });


    expect(result.id).toBe(
      'report-1',
    );
  });


  it('creates empty report when no data exists', async () => {
    prisma.analysis.findMany.mockResolvedValue([]);

    prisma.report.create.mockResolvedValue({
      id: 'empty-report',
    });


    await service.create(
      'user-1',
      {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-10',
      },
    );


    expect(
      prisma.report.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        isEmpty: true,
      }),
    });
  });
});