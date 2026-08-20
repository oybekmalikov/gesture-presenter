import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateSubDepartmentDto } from './dto/create-sub-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { SetDepartmentHeadDto } from './dto/set-department-head.dto';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    getOrgTree(): Promise<import("../../common/response").ApiResponse<any>>;
    findAllDepartments(): Promise<import("../../common/response").ApiResponse<any>>;
    getDepartmentStats(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    findOneDepartment(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    createDepartment(dto: CreateDepartmentDto): Promise<import("../../common/response").ApiResponse<any>>;
    updateDepartment(id: string, dto: Partial<CreateDepartmentDto>): Promise<import("../../common/response").ApiResponse<any>>;
    setDepartmentHead(id: string, dto: SetDepartmentHeadDto): Promise<import("../../common/response").ApiResponse<any>>;
    removeDepartment(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    findAllSubDepartments(departmentId?: string): Promise<import("../../common/response").ApiResponse<any>>;
    createSubDepartment(dto: CreateSubDepartmentDto): Promise<import("../../common/response").ApiResponse<any>>;
    updateSubDepartment(id: string, dto: Partial<CreateSubDepartmentDto>): Promise<import("../../common/response").ApiResponse<any>>;
    removeSubDepartment(id: string): Promise<import("../../common/response").ApiResponse<any>>;
    findAllPositions(): Promise<import("../../common/response").ApiResponse<any>>;
    createPosition(dto: CreatePositionDto): Promise<import("../../common/response").ApiResponse<any>>;
    updatePosition(id: string, dto: Partial<CreatePositionDto>): Promise<import("../../common/response").ApiResponse<any>>;
    removePosition(id: string): Promise<import("../../common/response").ApiResponse<any>>;
}
