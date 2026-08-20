import { LiveSessionStatus } from '../../common/enums';
import { Seminar } from './seminar.entity';
export declare class LiveSession {
    id: string;
    seminarId: string;
    seminar: Seminar;
    roomId: string;
    status: LiveSessionStatus;
    participantCount: number;
    peakViewerCount: number;
    currentFileId: string;
    currentSlideIndex: number;
    startedAt: Date;
    endedAt: Date;
    createdAt: Date;
    recordings: any[];
}
