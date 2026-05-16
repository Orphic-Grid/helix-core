import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditController } from './audit.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AlertsService } from './alerts.service';
import { DatabaseService } from './database.service';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('JWT_SECRET', 'local-dev-change-me'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController, PatientsController, AuditController, UsersController, HospitalsController],
  providers: [DatabaseService, AuthService, PatientsService, AlertsService, AuditService, UsersService, HospitalsService],
})
export class AppModule {}
