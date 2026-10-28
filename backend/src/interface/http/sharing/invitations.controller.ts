import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SharingService } from '../../../application/access/sharing.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly sharing: SharingService) {}

  /** Public: what the invite link is for, shown before signing in. */
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.sharing.previewInvitation(token);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.sharing.acceptInvitation(user.userId, dto.token);
  }
}
