import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Access token is missing or expired', details: [] },
        timestamp: new Date().toISOString(),
      });
    }
    return user;
  }
}