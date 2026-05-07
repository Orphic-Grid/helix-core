import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { RequestUser } from './types';
import { assertRole, JwtAuthGuard } from './jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async list(@Req() req: Request & { user: RequestUser }) {
    assertRole(req.user, ['admin']);
    return this.auditService.listRecent();
  }
}
