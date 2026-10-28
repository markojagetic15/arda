import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SharingService } from '../../../application/access/sharing.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ChangeRoleDto } from './dto/change-role.dto.js';
import { InviteDto } from './dto/invite.dto.js';
import { MemberParamsDto, ScopeParamsDto } from './dto/scope-params.dto.js';

/** Sharing for one space, project or page: `/sharing/:type/:id`. */
@Controller('sharing')
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Get(':type/:id')
  get(@CurrentUser() user: AuthenticatedUser, @Param() params: ScopeParamsDto) {
    return this.sharing.getSharing(user.userId, params);
  }

  @Post(':type/:id/invite')
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ScopeParamsDto,
    @Body() dto: InviteDto,
  ) {
    return this.sharing.invite(user.userId, params, dto);
  }

  @Patch(':type/:id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  changeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MemberParamsDto,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.sharing.changeRole(
      user.userId,
      { type: params.type, id: params.id },
      params.userId,
      dto.role,
    );
  }

  @Delete(':type/:id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: MemberParamsDto,
  ) {
    return this.sharing.removeMember(
      user.userId,
      { type: params.type, id: params.id },
      params.userId,
    );
  }

  @Delete('invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.sharing.revokeInvitation(user.userId, invitationId);
  }
}
