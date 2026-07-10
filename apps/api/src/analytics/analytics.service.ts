import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDto } from './dto/analyze.dto';


type ExternalAnalysisResponse = {
  sentiment: string;
  keywords: string[];
};


@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private hashText(text: string): string {
    return createHash('sha256')
      .update(text.trim())
      .digest('hex');
  }

  private validateExternalResponse(
    data: any,
  ): ExternalAnalysisResponse {
    if (
      !data ||
      typeof data.sentiment !== 'string' ||
      !Array.isArray(data.keywords) ||
      !data.keywords.every(
        (keyword: unknown) => typeof keyword === 'string',
      )
    ) {
      throw new ServiceUnavailableException(
        'Invalid analytics provider response',
      );
    }

    return {
      sentiment: data.sentiment,
      keywords: data.keywords,
    };
  }

  async analyze(
    userId: string,
    dto: AnalyzeDto,
  ) {
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

    const response = await fetch(
      'http://localhost:3002/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: dto.text,
        }),
      },
    );

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Analytics provider unavailable',
      );
    }

    const rawResult = await response.json();

    const result = this.validateExternalResponse(rawResult);

    return this.prisma.analysis.create({
      data: {
        userId,
        text: dto.text,
        textHash,
        sentiment: result.sentiment,
        keywords: result.keywords,
      },
    });
  }

  async history(
    userId: string,
    page = 1,
    limit = 10,
  ) {
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