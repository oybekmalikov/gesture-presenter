import { LiveSession } from './live-session.entity';
export declare class Recording {
    id: string;
    liveSessionId: string;
    liveSession: LiveSession;
    filePath: string;
    size: number;
    durationSeconds: number;
    createdAt: Date;
}
