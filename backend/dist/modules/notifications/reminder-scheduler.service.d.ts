import { Repository } from 'typeorm';
import { Seminar } from '../../database/entities/seminar.entity';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { SavedSeminar } from '../../database/entities/saved-seminar.entity';
export declare class ReminderSchedulerService {
    private readonly seminarRepo;
    private readonly notifRepo;
    private readonly userRepo;
    private readonly savedRepo;
    private readonly logger;
    constructor(seminarRepo: Repository<Seminar>, notifRepo: Repository<Notification>, userRepo: Repository<User>, savedRepo: Repository<SavedSeminar>);
    checkUpcomingSeminars(): Promise<void>;
    private processIntervalNotification;
}
