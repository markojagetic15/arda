import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegisterUserUseCase } from '../../../application/auth/use-cases/register-user.use-case.js';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case.js';
import { IssueSessionUseCase } from '../../../application/auth/use-cases/issue-session.use-case.js';
import { RefreshSessionUseCase } from '../../../application/auth/use-cases/refresh-session.use-case.js';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case.js';
import { RequestPasswordResetUseCase } from '../../../application/auth/use-cases/request-password-reset.use-case.js';
import { ResetPasswordUseCase } from '../../../application/auth/use-cases/reset-password.use-case.js';
import { GetProfileUseCase } from '../../../application/user/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../../application/user/use-cases/update-profile.use-case.js';
import { Mailer } from '../../../application/auth/ports/mailer.js';
import { TokenService } from '../../../application/auth/ports/token.service.js';
import { PasswordHasher } from '../../../domain/shared/ports/password-hasher.port.js';
import { SessionRepository } from '../../../domain/session/session.repository.js';
import { UserRepository } from '../../../domain/user/user.repository.js';
import { ConsoleMailer } from '../../../infrastructure/mail/console-mailer.js';
import { SessionEntity } from '../../../infrastructure/persistence/session.entity.js';
import { TypeOrmSessionRepository } from '../../../infrastructure/persistence/session.repository.js';
import { UserEntity } from '../../../infrastructure/persistence/user.entity.js';
import { TypeOrmUserRepository } from '../../../infrastructure/persistence/user.repository.js';
import { BcryptPasswordHasher } from '../../../infrastructure/security/bcrypt-password-hasher.js';
import { JwtTokenService } from '../../../infrastructure/security/jwt-token.service.js';
import { AuthController } from './auth.controller.js';
import { ProfileController } from './profile.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SessionEntity]),
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    { provide: UserRepository, useClass: TypeOrmUserRepository },
    { provide: SessionRepository, useClass: TypeOrmSessionRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenService, useClass: JwtTokenService },
    { provide: Mailer, useClass: ConsoleMailer },
    JwtStrategy,
    IssueSessionUseCase,
    RegisterUserUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
  ],
  exports: [TokenService, UserRepository],
})
export class AuthModule {}
