import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';

import { DomainException } from '../common/exceptions/domain.exception';
import { PrismaService } from '../prisma/prisma.service';

import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const prisma = {
    analysis: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  describe('idempotency', () => {
    it('uses SHA-256 hash of trimmed text', async () => {
      prisma.analysis.findFirst.mockResolvedValue({
        id: 'analysis-1',
      });

      await service.analyze('user-1', {
        text: ' hello world ',
      });

      expect(prisma.analysis.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          textHash: createHash('sha256').update('hello world').digest('hex'),
          createdAt: expect.any(Object),
        },
      });
    });

    it('returns existing analysis and skips provider call', async () => {
      const existing = {
        id: 'analysis-1',
        status: 'SUCCESS',
      };

      prisma.analysis.findFirst.mockResolvedValue(existing);

      const fetchSpy = jest.spyOn(global, 'fetch');

      const result = await service.analyze('user-1', {
        text: 'hello',
      });

      expect(result).toEqual(existing);
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('provider success', () => {
    it('creates successful analysis', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sentiment: 'positive',
          keywords: ['nestjs', 'jest'],
        }),
      }) as jest.Mock;

      prisma.analysis.create.mockResolvedValue({
        id: '1',
        status: 'SUCCESS',
      });

      const result = await service.analyze('user-1', {
        text: 'hello',
      });

      expect(prisma.analysis.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          sentiment: 'positive',
          keywords: ['nestjs', 'jest'],
          status: 'SUCCESS',
        }),
      });

      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('provider validation', () => {
    it('rejects partial provider response without sentiment', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          keywords: ['nestjs'],
        }),
      }) as jest.Mock;

      prisma.analysis.create.mockResolvedValue({});

      await expect(
        service.analyze('user-1', {
          text: '__partial__',
        }),
      ).rejects.toBeInstanceOf(DomainException);

      expect(prisma.analysis.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      });
    });
  });

  describe('provider failures', () => {
    it('retries provider three times and saves FAILED status', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

      prisma.analysis.create.mockResolvedValue({});

      await expect(
        service.analyze('user-1', {
          text: 'hello',
        }),
      ).rejects.toBeInstanceOf(DomainException);

      expect(global.fetch).toHaveBeenCalledTimes(3);

      expect(prisma.analysis.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          status: 'FAILED',
        }),
      });
    });

    it('succeeds after retry', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sentiment: 'positive',
            keywords: ['nestjs'],
          }),
        });

      prisma.analysis.create.mockResolvedValue({
        status: 'SUCCESS',
      });

      const result = await service.analyze('user-1', {
        text: 'hello',
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('SUCCESS');
    });

    it('handles HTTP 500 response from provider', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      prisma.analysis.create.mockResolvedValue({});

      await expect(
        service.analyze('user-1', {
          text: '__error_500__',
        }),
      ).rejects.toBeInstanceOf(DomainException);

      expect(global.fetch).toHaveBeenCalledTimes(3);

      expect(prisma.analysis.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      });
    });

    it('handles HTTP 503 response from provider', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      prisma.analysis.create.mockResolvedValue({});

      await expect(
        service.analyze('user-1', {
          text: '__error_503__',
        }),
      ).rejects.toBeInstanceOf(DomainException);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('handles timeout and returns domain error', async () => {
      prisma.analysis.findFirst.mockResolvedValue(null);

      global.fetch = jest.fn().mockRejectedValue(new Error('AbortError'));

      prisma.analysis.create.mockResolvedValue({});

      await expect(
        service.analyze('user-1', {
          text: '__timeout__',
        }),
      ).rejects.toBeInstanceOf(DomainException);

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('history', () => {
    it('returns paginated history', async () => {
      prisma.$transaction.mockResolvedValue([
        [
          {
            id: 'analysis-1',
          },
        ],
        1,
      ]);

      const result = await service.history('user-1');

      expect(result.items).toEqual([
        {
          id: 'analysis-1',
        },
      ]);

      expect(result.meta.total).toBe(1);
      expect(result.meta.pages).toBe(1);
    });
  });
});