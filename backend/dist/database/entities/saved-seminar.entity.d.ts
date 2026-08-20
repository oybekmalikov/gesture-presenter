import { User } from './user.entity';
import { Seminar } from './seminar.entity';
export declare class SavedSeminar {
    id: string;
    userId: string;
    user: User;
    seminarId: string;
    seminar: Seminar;
    createdAt: Date;
}
