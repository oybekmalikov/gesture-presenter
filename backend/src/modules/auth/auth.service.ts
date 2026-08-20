import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/entities/user.entity';
import {
  MESSAGES,
  ApiResponse,
  successResponse,
  errorResponse,
} from '../../common/response';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<ApiResponse<TokenPair | null>> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      return errorResponse(MESSAGES.LOGIN_FAILED);
    }

    if (!user.isActive) {
      return errorResponse(MESSAGES.USER_INACTIVE);
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return errorResponse(MESSAGES.LOGIN_FAILED);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user);
    const { passwordHash: _, ...profile } = user;
    return successResponse({ ...tokens, user: profile }, MESSAGES.LOGIN_SUCCESS);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<TokenPair | null>> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>(
          'JWT_SECRET',
          'okmk_jwt_secret_dev_2026',
        ),
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        return errorResponse(MESSAGES.UNAUTHORIZED);
      }

      const tokens = await this.generateTokens(user);
      return successResponse(tokens, MESSAGES.TOKEN_REFRESHED);
    } catch {
      return errorResponse(MESSAGES.TOKEN_EXPIRED);
    }
  }

  async getProfile(userId: string): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        department: true,
        subDepartment: true,
        position: true,
      },
    });

    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    const { passwordHash, ...profile } = user;
    return successResponse(profile, MESSAGES.FETCHED);
  }

  async changePassword(
    userId: string,
    oldPass: string,
    newPass: string,
  ): Promise<ApiResponse> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return errorResponse(MESSAGES.USER_NOT_FOUND);
    }

    const match = await bcrypt.compare(oldPass, user.passwordHash);
    if (!match) {
      return errorResponse({
        uz: "Eski parol noto'g'ri",
        ru: 'Старый пароль неверен',
      });
    }

    user.passwordHash = await bcrypt.hash(newPass, 12);
    await this.userRepo.save(user);

    return successResponse(null, MESSAGES.UPDATED);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const secret = this.config.get<string>(
      'JWT_SECRET',
      'okmk_jwt_secret_dev_2026',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
