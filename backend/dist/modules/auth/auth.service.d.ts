import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';
import { ApiResponse } from '../../common/response';
export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly config;
    constructor(userRepo: Repository<User>, jwtService: JwtService, config: ConfigService);
    login(username: string, password: string): Promise<ApiResponse<TokenPair | null>>;
    refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair | null>>;
    getProfile(userId: string): Promise<ApiResponse>;
    changePassword(userId: string, oldPass: string, newPass: string): Promise<ApiResponse>;
    validateUser(payload: JwtPayload): Promise<User | null>;
    private generateTokens;
}
