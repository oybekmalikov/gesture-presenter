import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(authService: AuthService, config: ConfigService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        username: string;
        role: import("../../../common/enums").Role;
        fio: string;
        departmentId: string;
        subDepartmentId: string;
    } | null>;
}
export {};
