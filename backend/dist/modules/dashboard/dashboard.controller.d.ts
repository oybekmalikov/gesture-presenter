import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMainDashboard(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getGuestDashboard(): Promise<import("../../common/response").ApiResponse<any>>;
    getUserDashboard(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getDepartmentDashboard(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getAdminDashboard(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
    getSuperadminDashboard(currentUser: any): Promise<import("../../common/response").ApiResponse<any>>;
}
