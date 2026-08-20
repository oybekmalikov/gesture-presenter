import { DataSource } from 'typeorm';
export declare class HealthController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    check(): {
        status: string;
        timestamp: string;
        database: string;
        uptime: number;
    };
}
