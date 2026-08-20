import { SeminarStatus, FileAccess } from '../../../common/enums';
export declare enum SeminarTabType {
    ALL = "all",
    SCHEDULED = "scheduled",
    LIVE = "live",
    COMPLETED = "completed",
    MY = "my",
    DEPARTMENT = "department"
}
export declare enum SeminarSortBy {
    LATEST = "latest",
    POPULAR = "popular",
    VIEWS = "views"
}
export declare class QuerySeminarDto {
    tab?: SeminarTabType;
    search?: string;
    tag?: string;
    departmentId?: string;
    status?: SeminarStatus;
    fileAccess?: FileAccess;
    sortBy?: SeminarSortBy;
    page?: number;
    limit?: number;
}
