import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("../../common/response").ApiResponse<import("./auth.service").TokenPair | null>>;
    refresh(dto: RefreshTokenDto): Promise<import("../../common/response").ApiResponse<import("./auth.service").TokenPair | null>>;
    me(userId: string): Promise<import("../../common/response").ApiResponse<any>>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<import("../../common/response").ApiResponse<any>>;
}
