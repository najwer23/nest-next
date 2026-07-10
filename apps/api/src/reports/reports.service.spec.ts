import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Role } from '@prisma/client';

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
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const analyst = {
    id: 'analyst-1',
    role: Role.ANALYST,
    isActive: true,
  } as any;

  const manager = {
    id: 'manager-1',
    role: Role.MANAGER,
    isActive: true,
  } as any;

  const admin = {
    id: 'admin-1',
    role: Role.ADMIN,
    isActive: true,
  } as any;

  const inactive = {
    id: 'inactive-1',
    role: Role.ANALYST,
    isActive: false,
  } as any;

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

  it('creates report', async () => {
    prisma.analysis.findMany.mockResolvedValue([
      {
        sentiment: 'positive',
        user: {
          id: 'u1',
          isActive: true,
        },
      },
      {
        sentiment: 'negative',
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

  it('creates empty report', async () => {
    prisma.analysis.findMany.mockResolvedValue([]);

    prisma.report.create.mockResolvedValue({
      id: 'empty',
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

  it('blocks inactive users', async () => {
    await expect(
      service.list(inactive),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('manager cannot access another report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: '1',
      requestedBy: 'someone-else',
      coversOnlyInactiveUsers: false,
    });

    await expect(
      service.getById(
        '1',
        manager,
      ),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('manager cannot access inactive-only report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: '1',
      requestedBy: manager.id,
      coversOnlyInactiveUsers: true,
    });

    await expect(
      service.getById(
        '1',
        manager,
      ),
    ).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('admin can access any report', async () => {
    prisma.report.findUnique.mockResolvedValue({
      id: '1',
      requestedBy: 'someone',
      coversOnlyInactiveUsers: true,
    });

    await expect(
      service.getById(
        '1',
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
        '1',
        admin,
      ),
    ).rejects.toThrow(
      NotFoundException,
    );
  });
});