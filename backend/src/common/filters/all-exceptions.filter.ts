import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

// CLAUDE.md section 41: "Never show raw technical errors." Every service
// throws `InternalServerErrorException(error.message)` when a Supabase/
// Postgres call fails, which — left alone — puts the raw DB error straight
// into the HTTP response body (an information-disclosure bug, not just a UX
// one). Rather than editing every one of those ~35 call sites, this filter
// rewrites *only* InternalServerErrorException's message to a safe generic
// one centrally, while logging the real error server-side. Every other
// HttpException (BadRequestException, NotFoundException, ForbiddenException,
// ServiceUnavailableException, etc.) already carries a deliberately-authored
// safe Uzbek message and passes through untouched.
const GENERIC_MESSAGE =
  "Serverda xatolik yuz berdi. Birozdan so'ng qaytadan urinib ko'ring.";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      if (exception instanceof InternalServerErrorException) {
        this.logger.error(exception.message);
        response
          .status(status)
          .json({ statusCode: status, message: GENERIC_MESSAGE });
        return;
      }

      response.status(status).json(exception.getResponse());
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: GENERIC_MESSAGE,
    });
  }
}
