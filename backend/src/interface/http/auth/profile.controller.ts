import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ChangePasswordUseCase } from '../../../application/user/use-cases/change-password.use-case.js';
import { hashOpaqueToken } from '../../../domain/shared/crypto.js';
import { SendEmailVerificationUseCase } from '../../../application/user/use-cases/send-email-verification.use-case.js';
import { GetProfileUseCase } from '../../../application/user/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../../application/user/use-cases/update-profile.use-case.js';
import { REFRESH_TOKEN_COOKIE } from './auth.constants.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './types/authenticated-user.js';
import { toUserResponse } from './user-response.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly sendEmailVerification: SendEmailVerificationUseCase,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.getProfileUseCase.execute({
      userId: user.userId,
    });
    return toUserResponse(profile);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.updateProfileUseCase.execute({
      userId: user.userId,
      name: dto.name,
    });
    return toUserResponse(profile);
  }

  @Post('me/verify-email')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.getProfileUseCase.execute({
      userId: user.userId,
    });
    await this.sendEmailVerification.execute(profile);
    return { success: true };
  }

  /** Signs out every other session; the one making this request stays signed in. */
  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const cookies = req.cookies as
      Record<string, string | undefined> | undefined;
    const refreshToken = cookies?.[REFRESH_TOKEN_COOKIE];
    await this.changePasswordUseCase.execute({
      userId: user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      keepRefreshTokenHash: refreshToken ? hashOpaqueToken(refreshToken) : null,
    });
    return { success: true };
  }
}
