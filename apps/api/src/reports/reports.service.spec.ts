import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  Role,
  type User,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let module: TestingModule;

  const prisma = {
    analysis: {
      findMany: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };


  const analyst: Pick<
    User,
    'id' | 'role' | 'isActive'
  > = {
    id: 'analyst-1',
    role: Role.ANALYST,
    isActive: true,
  };


  const manager: Pick<
    User,
    'id' | 'role' | 'isActive'
  > = {
    id: 'manager-1',
    role: Role.MANAGER,
    isActive: true,
  };


  const admin: Pick<
    User,
    'id' | 'role' | 'isActive'
  > = {
    id: 'admin-1',
    role: Role.ADMIN,
    isActive: true,
  };


  const inactive: Pick<
    User,
    'id' | 'role' | 'isActive'
  > = {
    id: 'inactive-1',
    role: Role.ANALYST,
    isActive: false,
  };


  beforeEach(async () => {
    jest.clearAllMocks();

    module =
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


  afterEach(async () => {
    await module.close();
  });


  it('creates report', async () => {
    prisma.analysis.findMany.mockResolvedValue([
      {
        sentiment: 'positive',
        status: 'SUCCESS',
        user: {
          id: 'u1',
          isActive: true,
        },
      },
      {
        sentiment: 'negative',
        status: 'SUCCESS',
        user: {
          id: 'u2',
          isActive: true,
        },
      },
    ]);


    prisma.report.create.mockResolvedValue({
      id: 'report-1',
    });


    const result =
      await service.create(
        analyst,
        {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-10',
        },
      );


    expect(
      prisma.report.create,
    ).toHaveBeenCalled();


    expect(result.id).toBe(
      'report-1',
    );
  });


  it('excludes FAILED analyses from report aggregations', async () => {
    prisma.analysis.findMany.mockResolvedValue([
      {
        sentiment: 'positive',
        status: 'SUCCESS',
        user: {
          id: 'u1',
          isActive: true,
        },
      },
    ]);


    prisma.report.create.mockResolvedValue({
      id: 'report-1',
    });


    await service.create(
      analyst,
      {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-10',
      },
    );


    expect(
      prisma.analysis.findMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'SUCCESS',
        }),
      }),
    );


    expect(
      prisma.report.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        data: {
          analysisCount: 1,
          sentimentDistribution: {
            positive: 1,
            negative: 0,
            neutral: 0,
          },
          mostActiveUsers: [
            {
              userId: 'u1',
              count: 1,
            },
          ],
        },
      }),
    });
  });


  it('creates empty report when no analyses exist', async () => {
    prisma.analysis.findMany.mockResolvedValue([]);

    prisma.report.create.mockResolvedValue({
      id: 'empty-report',
    });


    await service.create(
      analyst,
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


  it('blocks inactive users from reports', async () => {
    await expect(
      service.list(inactive),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });


  it('manager cannot access another user report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      requestedBy: 'another-user',
      coversOnlyInactiveUsers: false,
    });


    await expect(
      service.getById(
        'report-1',
        manager,
      ),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });


  it('manager cannot access inactive-only reports', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      requestedBy: manager.id,
      coversOnlyInactiveUsers: true,
    });


    await expect(
      service.getById(
        'report-1',
        manager,
      ),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });


  it('admin can access any report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: 'report-1',
      requestedBy: 'another-user',
      coversOnlyInactiveUsers: true,
      data: {
        analysisCount: 10,
        sentimentDistribution: {
          positive: 5,
          negative: 3,
          neutral: 2,
        },
        mostActiveUsers: [],
      },
    });


    await expect(
      service.getById(
        'report-1',
        admin,
      ),
    ).resolves.toBeDefined();
  });


  it('throws when report does not exist', async () => {
    prisma.report.findUnique.mockResolvedValue(
      null,
    );


    await expect(
      service.getById(
        'report-1',
        admin,
      ),
    ).rejects.toThrow(
      NotFoundException,
    );
  });
});