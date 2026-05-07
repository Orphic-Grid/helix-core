import { Body, Controller, Get, Param, Post, Query, Req, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { AlertsService } from './alerts.service';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from './jwt.guard';
import { RequestUser } from './types';

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly alertsService: AlertsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('search')
  async search(@Query('q') q = '') {
    return this.patientsService.search(q.toString());
  }

  @Get(':id')
  async profile(@Param('id') id: string, @Req() req: Request & { user: RequestUser }) {
    const profile = await this.patientsService.loadProfile(id);
    await this.auditService.logEvent(req.user.id, id, 'patient_profile_viewed');
    return profile;
  }

  @Get(':id/alerts')
  async alerts(@Param('id') id: string, @Req() req: Request & { user: RequestUser }) {
    const profile = await this.patientsService.loadProfile(id);
    const results = await this.alertsService.generateAlerts(profile);

    if (!results.length) {
      throw new ServiceUnavailableException('Alert evaluation did not return results');
    }

    await this.auditService.logEvent(req.user.id, id, 'patient_alerts_generated');
    return results;
  }

  @Post(':id/consent/request')
  async requestConsent(
    @Param('id') patientId: string,
    @Body() body: { providerId: string; purpose: string; durationHours?: number },
    @Req() req: Request & { user: RequestUser }
  ) {
    const consentRequest = await this.patientsService.requestConsent(
      patientId,
      body.providerId,
      req.user.id,
      body.purpose,
      body.durationHours || 24
    );

    await this.auditService.logEvent(req.user.id, patientId, 'consent_requested');
    return {
      success: true,
      consentRequest,
      message: 'Consent request submitted successfully. Awaiting patient approval.'
    };
  }

  @Post(':id/emergency/access')
  async emergencyAccess(
    @Param('id') patientId: string,
    @Body() body: { emergencyType: string; triageLevel: string; accessReason?: string },
    @Req() req: Request & { user: RequestUser }
  ) {
    const emergencySession = await this.patientsService.createEmergencySession(
      patientId,
      req.user.id,
      body.emergencyType,
      body.triageLevel,
      body.accessReason
    );

    // Load full patient profile including records from all providers
    const profile = await this.patientsService.loadProfile(patientId, true);

    await this.auditService.logEvent(req.user.id, patientId, 'emergency_access_activated');
    return {
      success: true,
      emergencySession,
      patient: profile,
      message: 'Emergency access granted. Full patient record unlocked for 6 hours.'
    };
  }
}
