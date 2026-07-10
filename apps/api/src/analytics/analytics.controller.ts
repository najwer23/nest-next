import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators';

import { AnalyticsService } from './analytics.service';
import { AnalyzeDto } from './dto/analyze.dto';
import { HistoryQueryDto } from './dto/history-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('analyze')
  analyze(@CurrentUser() user: User, @Body() dto: AnalyzeDto) {
    return this.analyticsService.analyze(user.id, dto);
  }

  @Get('users/:id')
  history(@Param('id') id: string, @Query() query: HistoryQueryDto) {
    return this.analyticsService.history(id, query.page, query.limit);
  }
}
