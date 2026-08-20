import { LiveService } from './live.service';
import { UpdateLiveStateDto } from './dto/update-live-state.dto';
import { CreateRecordingDto } from './dto/create-recording.dto';
export declare class LiveController {
    private readonly liveService;
    constructor(liveService: LiveService);
    getActiveSessions(): Promise<import("../../common/response").ApiResponse<any>>;
    getToken(seminarId: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    generateToken(seminarId: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getSession(seminarId: string): Promise<import("../../common/response").ApiResponse<any>>;
    startLiveSession(seminarId: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    updateLiveState(seminarId: string, dto: UpdateLiveStateDto, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    endLiveSession(seminarId: string, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    addRecording(seminarId: string, dto: CreateRecordingDto, currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
}
