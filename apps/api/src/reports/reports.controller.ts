import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import type { User } from '@prisma/client';

import { CurrentUser } from '../common/decorators';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(
      user,
      dto,
    );
  }

  @Get()
  list(
    @CurrentUser() user: User,
  ) {
    return this.reportsService.list(
      user,
    );
  }

  @Get(':id')
  get(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.reportsService.getById(
      id,
      user,
    );
  }
}