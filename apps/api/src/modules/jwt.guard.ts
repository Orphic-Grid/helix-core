import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PermissionClaims, RequestUser, UserRole } from './types';

type JwtPayload = {
  sub: string;
  email: string;
  fullName: string;
  role: UserRole;
  hospitalId: string | null;
  department: string | null;
  patientId?: string | null;
  permissions: PermissionClaims;
};

export const ROLES_KEY = 'helix:roles';
export const PERMISSIONS_KEY = 'helix:permissions';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...permissions: Array<keyof PermissionClaims>) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      hospitalId: payload.hospitalId,
      department: payload.department,
      patientId: payload.patientId ?? null,
      permissions: payload.permissions,
    };
    this.assertRouteAccess(context, request.user);
    return true;
  }

  private assertRouteAccess(context: ExecutionContext, user: RequestUser) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    const permissions = this.reflector.getAllAndOverride<Array<keyof PermissionClaims>>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const missingPermission = permissions?.find((permission) => !user.permissions[permission]);
    if (missingPermission) {
      throw new ForbiddenException(`Missing permission: ${missingPermission}`);
    }
  }
}

export function assertRole(user: RequestUser, roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new ForbiddenException('Insufficient role');
  }
}

export function assertPermission(user: RequestUser, permission: keyof PermissionClaims) {
  if (!user.permissions[permission]) {
    throw new ForbiddenException(`Missing permission: ${permission}`);
  }
}
