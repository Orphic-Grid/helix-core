import { Body, Controller, Get, Param, Post, Query, Req, ServiceUnavailableException, UseGuards, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { AuditService } from './audit.service';
import { AlertsService } from './alerts.service';
import { PatientsService } from './patients.service';
import { JwtAuthGuard, Permissions, Roles } from './jwt.guard';
import { RequestUser } from './types';

class ConsentRequestDto {
  @IsString()
  providerId!: string;

  @IsString()
  @MinLength(8)
  purpose!: string;

  @IsOptional()
  @IsNumber()
  durationHours?: number;
}

class EmergencyAccessDto {
  @IsIn(['trauma', 'cardiac', 'neurological', 'respiratory', 'unknown'])
  emergencyType!: string;

  @IsIn(['red', 'yellow', 'green', 'blue'])
  triageLevel!: string;

  @IsString()
  @MinLength(12)
  accessReason!: string;
}

class CreatePatientDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(4)
  govtId!: string;

  @IsOptional()
  @IsString()
  abhaId?: string;

  @IsNumber()
  @Min(0)
  age!: number;

  @IsString()
  gender!: string;

  @IsString()
  phone!: string;

  @IsString()
  bloodGroup!: string;

  @IsOptional()
  @IsArray()
  chronicConditions?: string[];

  @IsOptional()
  @IsArray()
  allergies?: string[];

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsString()
  providerId!: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  externalPatientId?: string;

  @IsOptional()
  @IsString()
  intakeNote?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly alertsService: AlertsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('search')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF')
  @Permissions('can_view_patient')
  async search(@Query('q') q = '', @Req() req: Request & { user: RequestUser }) {
    return this.patientsService.search(q.toString(), req.user);
  }

  @Get('recent/onboarded')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  @Permissions('can_manage_users')
  async recent(@Req() req: Request & { user: RequestUser }) {
    return this.patientsService.recentOnboarded(req.user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  @Permissions('can_manage_users')
  async create(@Body() body: CreatePatientDto, @Req() req: Request & { user: RequestUser }) {
    const patient = await this.patientsService.createApprovedPatient(body, req.user);
    await this.auditService.logEvent({
      user: req.user,
      patientId: patient.id,
      action: 'patient.admin.created_and_approved',
      ipAddress: this.getClientIp(req),
      metadata: { providerId: body.providerId, doctorName: body.doctorName },
    });
    return patient;
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT')
  async profile(@Param('id') id: string, @Req() req: Request & { user: RequestUser }) {
    // Hard guard: patients must only access their own record.
    if (req.user.role === 'PATIENT' && req.user.patientId !== id) {
      throw new ForbiddenException('Access denied to this patient record');
    }

    const profile = await this.patientsService.loadProfile(id, false, req.user);
    await this.auditService.logEvent({
      user: req.user,
      patientId: id,
      action: 'patient.profile.viewed',
      ipAddress: this.getClientIp(req),
    });
    return profile;
  }

  @Get(':id/alerts')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT')
  async alerts(@Param('id') id: string, @Req() req: Request & { user: RequestUser }) {
    // Hard guard: patients must only access their own record.
    if (req.user.role === 'PATIENT' && req.user.patientId !== id) {
      throw new ForbiddenException('Access denied to this patient record');
    }

    const profile = await this.patientsService.loadProfile(id, false, req.user);
    const results = await this.alertsService.generateAlerts(profile);

    if (!results.length) {
      throw new ServiceUnavailableException('Alert evaluation did not return results');
    }

    await this.auditService.logEvent({
      user: req.user,
      patientId: id,
      action: 'patient.alerts.generated',
      ipAddress: this.getClientIp(req),
    });
    return results;
  }

  @Post(':id/consent/request')
  @Roles('DOCTOR', 'HOSPITAL_ADMIN')
  async requestConsent(
    @Param('id') patientId: string,
    @Body() body: ConsentRequestDto,
    @Req() req: Request & { user: RequestUser }
  ) {
    const consentRequest = await this.patientsService.requestConsent(
      patientId,
      body.providerId,
      req.user.id,
      body.purpose,
      body.durationHours || 24
    );

    await this.auditService.logEvent({
      user: req.user,
      patientId,
      action: 'consent.requested',
      ipAddress: this.getClientIp(req),
      metadata: { providerId: body.providerId, purpose: body.purpose },
    });
    return {
      success: true,
      consentRequest,
      message: 'Consent request submitted successfully. Awaiting patient approval.'
    };
  }

  @Post(':id/emergency/access')
  @Permissions('can_use_emergency_mode')
  @Roles('DOCTOR', 'EMERGENCY_STAFF', 'HOSPITAL_ADMIN')
  async emergencyAccess(
    @Param('id') patientId: string,
    @Body() body: EmergencyAccessDto,
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
    const profile = await this.patientsService.loadProfile(patientId, true, req.user);

    await this.auditService.logEvent({
      user: req.user,
      patientId,
      action: 'emergency.access.activated',
      ipAddress: this.getClientIp(req),
      emergencyOverride: true,
      metadata: {
        emergencyType: body.emergencyType,
        triageLevel: body.triageLevel,
        reason: body.accessReason,
        expiresInHours: 6,
      },
    });
    return {
      success: true,
      emergencySession,
      patient: profile,
      message: 'Emergency access granted. Full patient record unlocked for 6 hours.'
    };
  }

  private getClientIp(req: Request) {
    return req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
  }
}
