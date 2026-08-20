import { Seminar } from './seminar.entity';
export declare class Tag {
    id: string;
    name: string;
    createdAt: Date;
    seminars: Seminar[];
}
