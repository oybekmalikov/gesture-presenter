import { Seminar } from './seminar.entity';
export declare class SeminarFile {
    id: string;
    seminarId: string;
    seminar: Seminar;
    originalName: string;
    storedName: string;
    fileType: string;
    mimeType: string;
    size: number;
    storagePath: string;
    convertedFrom: string;
    sortOrder: number;
    markedForDeletionAt: Date;
    deletionScheduledDate: Date;
    deletionReason: string;
    markedByUserId: string;
    createdAt: Date;
}
