import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        if (res.error && res.error.code) {
          code = res.error.code;
          message = res.error.message || message;
          details = res.error.details || [];
        } else if (res.message) {
          message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          code = res.error || 'BAD_REQUEST';
          details = Array.isArray(res.message) ? res.message : [];
        }
      } else if (typeof res === 'string') {
        message = res;
      }
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    });
  }
}