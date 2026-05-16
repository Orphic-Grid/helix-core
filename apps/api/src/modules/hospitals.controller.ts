import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard, Roles } from './jwt.guard';
import { RequestUser } from './types';

@UseGuards(JwtAuthGuard)
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  list(@Req() req: Request & { user: RequestUser }) {
    return this.hospitalsService.list(req.user);
  }

  @Get('overview')
  @Roles('SUPER_ADMIN')
  overview() {
    return this.hospitalsService.platformOverview();
  }
}
