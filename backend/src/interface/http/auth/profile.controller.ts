import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { GetProfileUseCase } from '../../../application/user/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../../application/user/use-cases/update-profile.use-case.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
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
}
