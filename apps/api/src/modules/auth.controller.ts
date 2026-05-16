import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from './jwt.guard';
import { RequestUser } from './types';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const session = await this.authService.login(body.email, body.password, this.getClientContext(req));
      await this.auditService.logEvent({
        user: session.user,
        action: 'auth.login.success',
        ipAddress: this.getClientIp(req),
        metadata: { userAgent: req.headers['user-agent'] ?? 'unknown' },
      });
      this.setRefreshCookie(res, session.refreshToken);

      return {
        accessToken: session.accessToken,
        user: session.user,
      };
    } catch (error) {
      await this.auditService.logEvent({
        action: 'auth.login.failed',
        ipAddress: this.getClientIp(req),
        metadata: { email: body.email.toLowerCase(), reason: 'invalid_credentials' },
      });
      throw error;
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getCookie(req.headers.cookie, this.authService.refreshCookieName);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const session = await this.authService.refreshSession(refreshToken, this.getClientContext(req));
    this.setRefreshCookie(res, session.refreshToken);
    await this.auditService.logEvent({
      user: session.user,
      action: 'auth.refresh.rotated',
      ipAddress: this.getClientIp(req),
    });
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getCookie(req.headers.cookie, this.authService.refreshCookieName);
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    res.cookie(this.authService.refreshCookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 0,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: RequestUser }) {
    return req.user;
  }

  private getCookie(header: string | undefined, name: string) {
    if (!header) return undefined;
    return header
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split('=')[1];
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(this.authService.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private getClientContext(req: Request) {
    return {
      ipAddress: this.getClientIp(req),
      deviceInfo: req.headers['user-agent']?.toString() ?? 'unknown',
    };
  }

  private getClientIp(req: Request) {
    return req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown';
  }
}
