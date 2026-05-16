import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { RequestUser } from './types';
import { JwtAuthGuard, Roles } from './jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  async list(@Req() req: Request & { user: RequestUser }) {
    return this.auditService.listRecent(req.user);
  }
}
