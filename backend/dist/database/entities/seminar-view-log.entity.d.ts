import { User } from './user.entity';
import { Seminar } from './seminar.entity';
export declare class SeminarViewLog {
    id: string;
    seminarId: string;
    seminar: Seminar;
    userId: string;
    user: User;
    ipAddress: string;
    userAgent: string;
    viewedAt: Date;
}
