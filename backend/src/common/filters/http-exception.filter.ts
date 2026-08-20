import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { MESSAGES, I18nMessage } from '../response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: I18nMessage = MESSAGES.SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, any>;
        if (res.message && typeof res.message === 'object' && res.message.uz) {
          message = res.message as I18nMessage;
        } else if (typeof res.message === 'string') {
          message = { uz: res.message, ru: res.message };
        } else if (Array.isArray(res.message)) {
          const joined = (res.message as unknown[]).map(String).join('; ');
          message = { uz: joined, ru: joined };
        }
      } else if (typeof exResponse === 'string') {
        message = { uz: exResponse, ru: exResponse };
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
      message = { uz: exception.message, ru: exception.message };
    }

    response.status(status).json({
      status: false,
      message,
      data: null,
    });
  }
}
