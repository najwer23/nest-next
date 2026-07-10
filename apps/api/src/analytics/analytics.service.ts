import { Injectable } from '@nestjs/common';

import { createHash } from 'crypto';

import { DomainException } from '../common/exceptions/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDto } from './dto/analyze.dto';

type ExternalAnalysisResponse = {
  sentiment: string;
  keywords: string[];
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private hashText(text: string): string {
    return createHash('sha256').update(text.trim()).digest('hex');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private unavailableError(message: string): DomainException {
    return new DomainException(
      'ANALYTICS_PROVIDER_UNAVAILABLE',
      message,
      503,
    );
  }

  private validateExternalResponse(data: unknown): ExternalAnalysisResponse {
    if (
      typeof data !== 'object' ||
      data === null ||
      !('sentiment' in data) ||
      !('keywords' in data)
    ) {
      throw this.unavailableError(
        'Invalid analytics provider response',
      );
    }

    const { sentiment, keywords } = data;

    if (
      typeof sentiment !== 'string' ||
      !Array.isArray(keywords) ||
      !keywords.every(
        (keyword): keyword is string => typeof keyword === 'string',
      )
    ) {
      throw this.unavailableError(
        'Invalid analytics provider response',
      );
    }

    return {
      sentiment,
      keywords,
    };
  }

  private async callAnalyticsProvider(text: string): Promise<ExternalAnalysisResponse> {
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch('http://localhost:3002/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error('Provider returned error');
        }

        const data: unknown = await response.json();
        return this.validateExternalResponse(data);
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof DomainException) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw this.unavailableError('Analytics provider unavailable');
        }

        await this.delay(300 * (attempt + 1));
      }
    }

    throw this.unavailableError('Analytics provider unavailable');
  }

  async analyze(userId: string, dto: AnalyzeDto) {
    const textHash = this.hashText(dto.text);

    const existing = await this.prisma.analysis.findFirst({
      where: {
        userId,
        textHash,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    if (existing) {
      return existing;
    }

    try {
      const result = await this.callAnalyticsProvider(dto.text);

      return this.prisma.analysis.create({
        data: {
          userId,
          text: dto.text,
          textHash,
          sentiment: result.sentiment,
          keywords: result.keywords,
          status: 'SUCCESS',
        },
      });
    } catch (error) {
      await this.prisma.analysis.create({
        data: {
          userId,
          text: dto.text,
          textHash,
          status: 'FAILED',
        },
      });

      throw error;
    }
  }

  async history(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.analysis.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.analysis.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}