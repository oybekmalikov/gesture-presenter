import { Seminar, Tag } from './seminar';

export interface GuestDashboardData {
  role: 'GUEST';
  summary: {
    publicSeminarsCount: number;
    liveSeminarsCount: number;
  };
  topTrending: Seminar[];
  popularTags: Tag[];
}

export interface UserDashboardData {
  role: 'user';
  kpi: {
    mySeminarsCount: number;
    myLikesReceived: number;
    mySavedCount: number;
  };
  assignedForMe: Seminar[];
  liveSeminars: Seminar[];
  departmentRecent: Seminar[];
}

export interface HeadDepartmentDashboardData {
  role: 'head_department';
  department: {
    id: string;
    name: string;
    code: string;
    subDepartmentsCount: number;
    activeUsersCount: number;
  } | null;
  seminarsByStatus: {
    draft: number;
    scheduled: number;
    live: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  topSpeakers: {
    userId: string;
    fio: string;
    lavozim?: string;
    avatarUrl?: string;
    seminarsCount: number;
    totalViews: number;
  }[];
  monthlyTrend: {
    month: string;
    count: number;
  }[];
  recentSeminars: Seminar[];
}

export interface AdminDashboardData {
  role: 'admin' | 'superadmin';
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalDepartments: number;
    totalSeminars: number;
    liveSeminars: number;
    scheduledSeminars: number;
    totalStorageMB: number;
  };
  charts: {
    departmentActivityBarChart: {
      id: string;
      name: string;
      code: string;
      seminarsCount: number;
    }[];
    monthlySeminarGrowthLineChart: {
      month: string;
      total: number;
      completed: number;
    }[];
    storageBreakdownPieChart: {
      fileType: string;
      count: number;
      totalBytes: number;
      totalMB: number;
    }[];
    popularTagsCloud: {
      name: string;
      count: number;
    }[];
  };
}

export interface SuperadminDashboardData extends AdminDashboardData {
  role: 'superadmin';
  audit: {
    totalLogsCount: number;
    recentLogs: {
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      ipAddress: string;
      user: {
        id: string;
        fio: string;
        username: string;
        role: string;
      } | null;
      createdAt: string;
    }[];
  };
}

export type DashboardResponseData =
  | GuestDashboardData
  | UserDashboardData
  | HeadDepartmentDashboardData
  | AdminDashboardData
  | SuperadminDashboardData;
