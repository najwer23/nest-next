import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDto } from './dto/analyze.dto';
import { createHash } from 'crypto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private hashText(text: string): string {
    return createHash("sha256")
      .update(text.trim())
      .digest("hex");
  }

  async analyze(userId: string, dto: AnalyzeDto) {
    const textHash = this.hashText(dto.text);

    const existing =
      await this.prisma.analysis.findFirst({
        where: {
          userId,
          textHash,
          createdAt: {
            gte: new Date(
              Date.now() - 5 * 60 * 1000,
            ),
          },
        },
      });

      console.log(existing)

    if (existing) {
      return existing;
    }

    const response = await fetch('http://localhost:3002/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: dto.text }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException();
    }

    const result = await response.json();

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

    const [items, total] =
      await this.prisma.$transaction([
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