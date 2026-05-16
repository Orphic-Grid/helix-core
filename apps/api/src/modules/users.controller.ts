import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard, Permissions, Roles } from './jwt.guard';
import { RequestUser, UserRole } from './types';
import { UsersService } from './users.service';

class CreateUserDto {
  @IsString()
  @MinLength(3)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'EMERGENCY_STAFF', 'PATIENT'])
  role!: UserRole;

  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  department?: string;
}

class UserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  @Permissions('can_manage_users')
  list(@Req() req: Request & { user: RequestUser }) {
    return this.usersService.list(req.user);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  @Permissions('can_manage_users')
  create(@Body() body: CreateUserDto, @Req() req: Request & { user: RequestUser }) {
    return this.usersService.create(body, req.user);
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  @Permissions('can_manage_users')
  setStatus(
    @Param('id') id: string,
    @Body() body: UserStatusDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    return this.usersService.setStatus(id, body.isActive, req.user);
  }

  @Get('sessions')
  @Roles('SUPER_ADMIN', 'HOSPITAL_ADMIN')
  listSessions(@Req() req: Request & { user: RequestUser }) {
    return this.usersService.activeSessions(req.user);
  }
}
