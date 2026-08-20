import { Repository } from 'typeorm';
import { SeminarFile } from '../../database/entities/seminar-file.entity';
export declare class FileCleanupSchedulerService {
    private readonly fileRepo;
    private readonly logger;
    constructor(fileRepo: Repository<SeminarFile>);
    purgeExpiredFiles(): Promise<void>;
    runManualCleanupCycle(): Promise<{
        purgedCount: number;
        filesPurged: string[];
    }>;
}
