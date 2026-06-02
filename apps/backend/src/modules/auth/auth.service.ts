import { Injectable, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const birthDate = this.parseBirthDate(dto.birthDate);
    if (!this.isAdult(birthDate)) {
      throw new BadRequestException('Debes ser mayor de edad para registrarte');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = this.hashToken(verificationToken);
    const verificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await this.prisma.$transaction(async (tx) => {
      // Create User with empty Wallet
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          birthDate,
          email: dto.email,
          passwordHash,
          role: dto.role,
          isEmailVerified: false,
          emailVerificationTokenHash: verificationTokenHash,
          emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
          wallet: {
            create: {
              balance: 0.00,
            },
          },
        },
      });

      // If Tarot Reader, create profile
      if (dto.role === UserRole.TAROT_READER) {
        await tx.tarotReader.create({
          data: {
            userId: user.id,
            displayName: dto.displayName || 'Nuevo Tarotista',
            bio: dto.bio || 'Sin biografía disponible.',
            ratePerMinute: 2.00, // Default rate
          },
        });
      }

      // Record Audit trail
      await tx.auditTrail.create({
        data: {
          action: 'USER_REGISTERED',
          actorId: user.id,
          metadata: { email: dto.email, role: dto.role },
        },
      });

      return user;
    });

    const verificationUrl = this.buildVerificationUrl(verificationToken);
    this.logger.log(`Usuario registrado pendiente de confirmacion: ${user.email}. Enviando correo.`);
    await this.mailService.sendEmailConfirmation(user.email, verificationUrl);
    this.logger.log(`Flujo de correo de confirmacion finalizado para ${user.email}`);

    const response: Record<string, unknown> = {
      message: 'Registro creado. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.',
    };

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      response.verificationUrl = verificationUrl;
    }

    return response;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status === 'DELETED') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida. Contacta soporte.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Debes confirmar tu correo electrónico antes de iniciar sesión.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(this.prisma, user.id, tokens.refreshToken);

    // Audit logs
    await this.prisma.auditTrail.create({
      data: {
        action: 'USER_LOGIN',
        actorId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async confirmEmail(token: string) {
    const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:5173');

    if (!token) {
      return { url: `${clientUrl}/login?verified=invalid` };
    }

    const tokenHash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { url: `${clientUrl}/login?verified=invalid` };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    await this.prisma.auditTrail.create({
      data: {
        action: 'USER_EMAIL_VERIFIED',
        actorId: user.id,
      },
    });

    return { url: `${clientUrl}/login?verified=success` };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Acceso denegado');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Token de actualización inválido');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(this.prisma, user.id, tokens.refreshToken);

    return tokens;
  }

  // --- Helpers ---

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshTokenHash(tx: any, userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await tx.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private buildVerificationUrl(token: string) {
    const apiUrl = this.configService.get<string>('API_URL', `http://localhost:${this.configService.get<number>('PORT', 4000)}`);
    return `${apiUrl}/auth/confirm-email?token=${token}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseBirthDate(value: string) {
    const birthDate = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('Debe ingresar una fecha de nacimiento válida');
    }

    return birthDate;
  }

  private isAdult(birthDate: Date) {
    const today = new Date();
    const minimumBirthDate = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()));
    return birthDate <= minimumBirthDate;
  }
}
