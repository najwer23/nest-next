import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'crypto';

import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

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

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AnalyticsService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
        ],
      }).compile();

    service = module.get<AnalyticsService>(
      AnalyticsService,
    );
  });


  describe('idempotency', () => {
    it('uses SHA-256 hash of trimmed text', async () => {
      prisma.analysis.findFirst.mockResolvedValue({
        id: 'analysis-1',
      });

      await service.analyze('user-1', {
        text: ' hello world ',
      });

      expect(
        prisma.analysis.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          textHash:
            createHash('sha256')
              .update('hello world')
              .digest('hex'),
          createdAt: expect.any(Object),
        },
      });
    });


    it('returns existing analysis and skips provider call', async () => {
      const existing = {
        id: 'analysis-1',
        status: 'SUCCESS',
      };

      prisma.analysis.findFirst.mockResolvedValue(
        existing,
      );

      const fetchSpy =
        jest.spyOn(global, 'fetch');


      const result =
        await service.analyze(
          'user-1',
          {
            text: 'hello',
          },
        );


      expect(result).toEqual(existing);
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });


  describe('provider success', () => {
    it('creates successful analysis', async () => {
      prisma.analysis.findFirst.mockResolvedValue(
        null,
      );


      global.fetch =
        jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            sentiment: 'positive',
            keywords: [
              'nestjs',
              'jest',
            ],
          }),
        }) as jest.Mock;


      prisma.analysis.create.mockResolvedValue({
        id: '1',
        status: 'SUCCESS',
      });


      const result =
        await service.analyze(
          'user-1',
          {
            text: 'hello',
          },
        );


      expect(
        prisma.analysis.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          sentiment: 'positive',
          keywords: [
            'nestjs',
            'jest',
          ],
          status: 'SUCCESS',
        }),
      });


      expect(result.status).toBe(
        'SUCCESS',
      );
    });
  });


  describe('provider validation', () => {
    it('rejects invalid provider response without sentiment', async () => {
      prisma.analysis.findFirst.mockResolvedValue(
        null,
      );


      global.fetch =
        jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            keywords: [
              'nestjs',
            ],
          }),
        }) as jest.Mock;


      prisma.analysis.create.mockResolvedValue(
        {},
      );


      await expect(
        service.analyze(
          'user-1',
          {
            text: 'hello',
          },
        ),
      ).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });


  describe('provider failures', () => {
    it('retries provider three times and saves FAILED status', async () => {
      prisma.analysis.findFirst.mockResolvedValue(
        null,
      );


      global.fetch =
        jest.fn().mockRejectedValue(
          new Error('network error'),
        );


      prisma.analysis.create.mockResolvedValue(
        {},
      );


      await expect(
        service.analyze(
          'user-1',
          {
            text: 'hello',
          },
        ),
      ).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );


      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(3);


      expect(
        prisma.analysis.create,
      ).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          status: 'FAILED',
        }),
      });
    });


    it('succeeds after retry', async () => {
      prisma.analysis.findFirst.mockResolvedValue(
        null,
      );


      global.fetch =
        jest.fn()
          .mockRejectedValueOnce(
            new Error('timeout'),
          )
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              sentiment: 'positive',
              keywords: [
                'nestjs',
              ],
            }),
          });


      prisma.analysis.create.mockResolvedValue({
        status: 'SUCCESS',
      });


      const result =
        await service.analyze(
          'user-1',
          {
            text: 'hello',
          },
        );


      expect(
        global.fetch,
      ).toHaveBeenCalledTimes(2);


      expect(result.status).toBe(
        'SUCCESS',
      );
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


      const result =
        await service.history(
          'user-1',
        );


      expect(result.items).toEqual([
        {
          id: 'analysis-1',
        },
      ]);


      expect(
        result.meta.total,
      ).toBe(1);


      expect(
        result.meta.pages,
      ).toBe(1);
    });
  });
});