import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { CreateReportDto } from './dto/create-report.dto';

export type RequestUser = {
  id: string;
  role: Role;
  isActive: boolean;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private assertActive(user: RequestUser) {
    if (!user.isActive) {
      throw new ForbiddenException(
        'Inactive user',
      );
    }
  }

  private scopeFilter(user: RequestUser) {
    if (user.role === Role.ADMIN) {
      return {};
    }

    return {
      requestedBy: user.id,
    };
  }

  private assertCanView(
    user: RequestUser,
    report: any,
  ) {
    this.assertActive(user);

    if (user.role === Role.ADMIN) {
      return;
    }

    if (report.requestedBy !== user.id) {
      throw new ForbiddenException(
        'You cannot access this report',
      );
    }

    if (
      user.role === Role.MANAGER &&
      report.coversOnlyInactiveUsers
    ) {
      throw new ForbiddenException(
        'Manager cannot access inactive-only reports',
      );
    }
  }

  private shapeForRole(
    user: RequestUser,
    report: any,
  ) {
    if (user.role !== Role.ANALYST) {
      return report;
    }

    return {
      id: report.id,
      createdAt: report.createdAt,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      isEmpty: report.isEmpty,
      data: {
        analysisCount: report.data.analysisCount,
        sentimentDistribution:
          report.data.sentimentDistribution,
      },
    };
  }

  async create(
    user: RequestUser,
    dto: CreateReportDto,
  ) {
    this.assertActive(user);

    const dateFrom = new Date(dto.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date(dto.dateTo);
    dateTo.setHours(23, 59, 59, 999);

    if (
      Number.isNaN(dateFrom.getTime()) ||
      Number.isNaN(dateTo.getTime())
    ) {
      throw new ForbiddenException(
        'Invalid dates',
      );
    }

    const analyses =
      await this.prisma.analysis.findMany({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
          status: 'SUCCESS',
        },
        include: {
          user: {
            select: {
              id: true,
              isActive: true,
            },
          },
        },
      });

    const sentimentDistribution = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    const activity = new Map<string, number>();
    const users = new Map<string, boolean>();

    for (const analysis of analyses) {
      const sentiment =
        analysis.sentiment as keyof typeof sentimentDistribution;

      if (sentiment in sentimentDistribution) {
        sentimentDistribution[sentiment]++;
      }

      users.set(
        analysis.user.id,
        analysis.user.isActive,
      );

      activity.set(
        analysis.user.id,
        (activity.get(analysis.user.id) ?? 0) + 1,
      );
    }

    const coversOnlyInactiveUsers =
      users.size > 0 &&
      [...users.values()].every(
        active => !active,
      );

    const mostActiveUsers =
      [...activity.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({
          userId,
          count,
        }));

    return this.prisma.report.create({
      data: {
        requestedBy: user.id,
        dateFrom,
        dateTo,
        isEmpty: analyses.length === 0,
        coversOnlyInactiveUsers,
        data: {
          analysisCount: analyses.length,
          sentimentDistribution,
          mostActiveUsers,
        },
        status: 'COMPLETED',
      },
    });
  }

  async list(user: RequestUser) {
    this.assertActive(user);

    const reports =
      await this.prisma.report.findMany({
        where: {
          ...this.scopeFilter(user),
          ...(user.role === Role.MANAGER
            ? {
                coversOnlyInactiveUsers: false,
              }
            : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

    return reports.map(report =>
      this.shapeForRole(
        user,
        report,
      ),
    );
  }

  async getById(
    id: string,
    user: RequestUser,
  ) {
    this.assertActive(user);

    const report =
      await this.prisma.report.findUnique({
        where: {
          id,
        },
      });

    if (!report) {
      throw new NotFoundException(
        'Report not found',
      );
    }

    this.assertCanView(
      user,
      report,
    );

    return this.shapeForRole(
      user,
      report,
    );
  }
}