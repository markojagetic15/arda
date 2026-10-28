import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  InvalidMoveError,
  PageNotFoundError,
  ProjectNotFoundError,
  SpaceNotFoundError,
} from '../../../domain/hierarchy/hierarchy.errors.js';
import { InvalidSessionError } from '../../../domain/session/session.errors.js';
import {
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  InvalidOrExpiredResetTokenError,
  UserNotFoundError,
} from '../../../domain/user/user.errors.js';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const status = this.resolveStatus(exception);
    if (status) {
      response
        .status(status)
        .json({ statusCode: status, message: (exception as Error).message });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private resolveStatus(exception: unknown): HttpStatus | null {
    if (exception instanceof EmailAlreadyInUseError) return HttpStatus.CONFLICT;
    if (exception instanceof InvalidCredentialsError)
      return HttpStatus.UNAUTHORIZED;
    if (exception instanceof InvalidSessionError)
      return HttpStatus.UNAUTHORIZED;
    if (exception instanceof InvalidOrExpiredResetTokenError)
      return HttpStatus.BAD_REQUEST;
    if (exception instanceof UserNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof SpaceNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ProjectNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof PageNotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof InvalidMoveError) return HttpStatus.BAD_REQUEST;
    return null;
  }
}
