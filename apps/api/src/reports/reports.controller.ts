import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '@prisma/client';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService, RequestUser } from './reports.service';

type AuthRequest = Request & {
  user: {
    id: string;
    role: Role;
    isActive: boolean;
  };
};

function toRequestUser(user: AuthRequest['user']): RequestUser {
  return {
    id: user.id,
    role: user.role,
    isActive: user.isActive,
  };
}

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(
      toRequestUser(req.user),
      dto,
    );
  }

  @Get()
  list(
    @Req() req: AuthRequest,
  ) {
    return this.reportsService.list(
      toRequestUser(req.user),
    );
  }

  @Get(':id')
  get(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.reportsService.getById(
      id,
      toRequestUser(req.user),
    );
  }
}