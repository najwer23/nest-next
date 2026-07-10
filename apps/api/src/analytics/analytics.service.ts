import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyzeDto } from './dto/analyze.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(userId: string, dto: AnalyzeDto) {
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

    console.log("id: " + userId)
    console.log(result)

    return this.prisma.analysis.create({
      data: {
        userId,
        text: dto.text,
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