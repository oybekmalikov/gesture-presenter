import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  LoginResponse,
  User,
  Seminar,
  QuerySeminarParams,
  PaginatedResult,
  DashboardResponseData,
  CommentItem,
  Tag,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('okmk_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('okmk_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post<ApiResponse<LoginResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );
          if (res.data?.success && res.data.data?.accessToken) {
            localStorage.setItem(
              'okmk_access_token',
              res.data.data.accessToken,
            );
            if (res.data.data.refreshToken) {
              localStorage.setItem(
                'okmk_refresh_token',
                res.data.data.refreshToken,
              );
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          // Token refresh failed -> clear tokens
          localStorage.removeItem('okmk_access_token');
          localStorage.removeItem('okmk_refresh_token');
          localStorage.removeItem('okmk_user');
        }
      }
    }
    return Promise.reject(error);
  },
);

// ==================== AUTH SERVICE ====================
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      username,
      password,
    });
    return res.data.data;
  },
  me: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    const res = await apiClient.post<ApiResponse>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('okmk_access_token');
    localStorage.removeItem('okmk_refresh_token');
    localStorage.removeItem('okmk_user');
  },
};

// ==================== DASHBOARD SERVICE ====================
export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponseData> => {
    const res = await apiClient.get<ApiResponse<DashboardResponseData>>('/dashboard');
    return res.data.data;
  },
  getGuestDashboard: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/guest');
    return res.data.data;
  },
  getUserDashboard: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/user');
    return res.data.data;
  },
  getDepartmentDashboard: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/department');
    return res.data.data;
  },
  getAdminDashboard: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/admin');
    return res.data.data;
  },
  getSuperadminDashboard: async (): Promise<any> => {
    const res = await apiClient.get<ApiResponse<any>>('/dashboard/superadmin');
    return res.data.data;
  },
};

// ==================== SEMINARS SERVICE ====================
export const seminarsApi = {
  findAll: async (
    params?: QuerySeminarParams,
  ): Promise<PaginatedResult<Seminar>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Seminar>>>(
      '/seminars',
      { params },
    );
    return res.data.data;
  },
  findOne: async (id: string): Promise<Seminar> => {
    const res = await apiClient.get<ApiResponse<Seminar>>(`/seminars/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<Seminar> => {
    const res = await apiClient.post<ApiResponse<Seminar>>('/seminars', data);
    return res.data.data;
  },
  update: async (id: string, data: any): Promise<Seminar> => {
    const res = await apiClient.put<ApiResponse<Seminar>>(
      `/seminars/${id}`,
      data,
    );
    return res.data.data;
  },
  updateStatus: async (id: string, status: string): Promise<Seminar> => {
    const res = await apiClient.patch<ApiResponse<Seminar>>(
      `/seminars/${id}/status`,
      { status },
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/seminars/${id}`);
    return res.data;
  },
  toggleBookmark: async (
    id: string,
  ): Promise<{ isSaved: boolean; seminarId: string }> => {
    const res = await apiClient.post<
      ApiResponse<{ isSaved: boolean; seminarId: string }>
    >(`/seminars/${id}/bookmark`);
    return res.data.data;
  },
  getBookmarks: async (
    page = 1,
    limit = 12,
  ): Promise<PaginatedResult<Seminar>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Seminar>>>(
      '/seminars/bookmarks',
      { params: { page, limit } },
    );
    return res.data.data;
  },
  getPopularTags: async (): Promise<Tag[]> => {
    const res = await apiClient.get<ApiResponse<Tag[]>>(
      '/seminars/tags/popular',
    );
    return res.data.data;
  },
  getTargetSeminars: async (
    page = 1,
    limit = 12,
  ): Promise<PaginatedResult<Seminar>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Seminar>>>(
      '/seminars/assigned/for-me',
      { params: { page, limit } },
    );
    return res.data.data;
  },
};

// ==================== FILES SERVICE ====================
export const filesApi = {
  uploadFile: async (seminarId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse>(
      `/files/upload/${seminarId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return res.data.data;
  },
  uploadMultiple: async (seminarId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await apiClient.post<ApiResponse>(
      `/files/upload/${seminarId}/multiple`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return res.data.data;
  },
  remove: async (fileId: string) => {
    const res = await apiClient.delete<ApiResponse>(`/files/${fileId}`);
    return res.data;
  },
  reorderFiles: async (seminarId: string, fileIds: string[]) => {
    const res = await apiClient.patch<ApiResponse>(
      `/seminars/${seminarId}/files/reorder`,
      { fileIds },
    );
    return res.data.data;
  },
  getCleanupCandidates: async () => {
    const res = await apiClient.get<ApiResponse>(
      '/files/admin/cleanup-candidates',
    );
    return res.data.data;
  },
  getPendingCleanup: async () => {
    const res = await apiClient.get<ApiResponse>(
      '/files/admin/pending-cleanup',
    );
    return res.data.data;
  },
  markCleanup: async (
    fileIds: string[],
    retentionDays: number,
    reason?: string,
  ) => {
    const res = await apiClient.post<ApiResponse>('/files/admin/mark-cleanup', {
      fileIds,
      retentionDays,
      reason,
    });
    return res.data.data;
  },
  cancelCleanup: async (fileIds: string[]) => {
    const res = await apiClient.post<ApiResponse>(
      '/files/admin/cancel-cleanup',
      { fileIds },
    );
    return res.data.data;
  },
  forceDelete: async (fileId: string) => {
    const res = await apiClient.delete<ApiResponse>(
      `/files/admin/force-delete/${fileId}`,
    );
    return res.data;
  },
  getViewUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/view`,
  getDownloadUrl: (fileId: string) =>
    `${API_BASE_URL}/files/${fileId}/download`,
};

// ==================== INTERACTIONS SERVICE ====================
export const interactionsApi = {
  toggleLike: async (
    seminarId: string,
  ): Promise<{ liked: boolean; likesCount: number }> => {
    const res = await apiClient.post<
      ApiResponse<{ liked: boolean; likesCount: number }>
    >(`/interactions/seminars/${seminarId}/like`);
    return res.data.data;
  },
  getComments: async (seminarId: string): Promise<CommentItem[]> => {
    const res = await apiClient.get<ApiResponse<CommentItem[]>>(
      `/interactions/seminars/${seminarId}/comments`,
    );
    return res.data.data;
  },
  addComment: async (
    seminarId: string,
    content: string,
    parentId?: string,
  ): Promise<CommentItem> => {
    const res = await apiClient.post<ApiResponse<CommentItem>>(
      `/interactions/seminars/${seminarId}/comments`,
      { content, parentId },
    );
    return res.data.data;
  },
  removeComment: async (commentId: string) => {
    const res = await apiClient.delete<ApiResponse>(
      `/interactions/comments/${commentId}`,
    );
    return res.data;
  },
};

// ==================== USERS & PROFILE SERVICE ====================
export const usersApi = {
  getMyProfile: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/users/profile/me');
    return res.data.data;
  },
  updateMyProfile: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(
      '/users/profile/me',
      data,
    );
    return res.data.data;
  },
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post<ApiResponse<User>>(
      '/users/profile/avatar',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return res.data.data;
  },
  deleteAvatar: async (): Promise<User> => {
    const res = await apiClient.delete<ApiResponse<User>>(
      '/users/profile/avatar',
    );
    return res.data.data;
  },
  getMyTeam: async (params?: any): Promise<PaginatedResult<User>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<User>>>(
      '/users/department/my-team',
      { params },
    );
    return res.data.data;
  },
  findAll: async (params?: any): Promise<PaginatedResult<User>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<User>>>(
      '/users',
      { params },
    );
    return res.data.data;
  },
  findOne: async (id: string): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },
  update: async (id: string, data: any): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/users/${id}`);
    return res.data;
  },
  toggleActive: async (id: string): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/toggle-active`,
    );
    return res.data.data;
  },
  bulkImport: async (users: any[]) => {
    const res = await apiClient.post<ApiResponse>('/users/bulk-import', {
      users,
    });
    return res.data.data;
  },
};

// ==================== DEPARTMENTS SERVICE ====================
export const departmentsApi = {
  getOrgTree: async () => {
    const res = await apiClient.get<ApiResponse>('/departments/tree');
    return res.data.data;
  },
  findAll: async () => {
    const res = await apiClient.get<ApiResponse>('/departments');
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post<ApiResponse>('/departments', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put<ApiResponse>(`/departments/${id}`, data);
    return res.data.data;
  },
  setHead: async (id: string, userId: string) => {
    const res = await apiClient.patch<ApiResponse>(
      `/departments/${id}/head`,
      { userId },
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/departments/${id}`);
    return res.data;
  },
  getSubDepartments: async (departmentId?: string) => {
    const res = await apiClient.get<ApiResponse>('/departments/sub/list', {
      params: { departmentId },
    });
    return res.data.data;
  },
  getPositions: async () => {
    const res = await apiClient.get<ApiResponse>('/departments/positions/list');
    return res.data.data;
  },
};

// ==================== LIVE STREAMING SERVICE ====================
export const liveApi = {
  getActiveSessions: async () => {
    const res = await apiClient.get<ApiResponse>('/live/active');
    return res.data.data;
  },
  getSession: async (seminarId: string) => {
    const res = await apiClient.get<ApiResponse>(`/live/${seminarId}`);
    return res.data.data;
  },
  getToken: async (seminarId: string) => {
    const res = await apiClient.get<ApiResponse>(`/live/${seminarId}/token`);
    return res.data.data;
  },
  startSession: async (seminarId: string) => {
    const res = await apiClient.post<ApiResponse>(`/live/${seminarId}/start`);
    return res.data.data;
  },
  endSession: async (seminarId: string) => {
    const res = await apiClient.post<ApiResponse>(`/live/${seminarId}/end`);
    return res.data.data;
  },
  updateState: async (seminarId: string, state: any) => {
    const res = await apiClient.patch<ApiResponse>(
      `/live/${seminarId}/state`,
      state,
    );
    return res.data.data;
  },
  addRecording: async (seminarId: string, recording: any) => {
    const res = await apiClient.post<ApiResponse>(
      `/live/${seminarId}/recordings`,
      recording,
    );
    return res.data.data;
  },
};

// ==================== NOTIFICATIONS SERVICE ====================
export const notificationsApi = {
  getAll: async (page = 1, limit = 20, unreadOnly = false) => {
    const res = await apiClient.get<ApiResponse>('/notifications', {
      params: { page, limit, unreadOnly },
    });
    return res.data.data;
  },
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
      '/notifications/unread-count',
    );
    return res.data.data;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse>(`/notifications/${id}/read`);
    return res.data.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch<ApiResponse>('/notifications/read-all');
    return res.data.data;
  },
  clearRead: async () => {
    const res = await apiClient.delete<ApiResponse>(
      '/notifications/clear-read',
    );
    return res.data.data;
  },
  remove: async (id: string) => {
    const res = await apiClient.delete<ApiResponse>(`/notifications/${id}`);
    return res.data;
  },
};

// ==================== AUDIT SERVICE (SUPERADMIN) ====================
export const auditApi = {
  findAll: async (page = 1, limit = 50, action?: string, entityType?: string) => {
    const res = await apiClient.get<ApiResponse>('/audit', {
      params: { page, limit, action, entityType },
    });
    return res.data.data;
  },
};

// ==================== AI ASSISTANT SERVICE ====================
export const aiApi = {
  getTemplates: async () => {
    const res = await apiClient.get<ApiResponse>('/ai/templates');
    return res.data.data;
  },
  generateOutline: async (data: {
    topic: string;
    targetAudience?: string;
    slideCount?: number;
    language?: string;
    additionalNotes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse>('/ai/outline', data);
    return res.data.data;
  },
  generateSlides: async (data: {
    topic: string;
    slideCount?: number;
    outline?: string[];
    style?: string;
    language?: string;
  }) => {
    const res = await apiClient.post<ApiResponse>('/ai/slides', data);
    return res.data.data;
  },
  generateMeta: async (data: {
    title: string;
    content?: string;
    language?: string;
  }) => {
    const res = await apiClient.post<ApiResponse>('/ai/meta', data);
    return res.data.data;
  },
  askAssistant: async (data: { prompt: string; context?: string }) => {
    const res = await apiClient.post<ApiResponse>('/ai/chat', data);
    return res.data.data;
  },
};

// ==================== LEGACY COMPATIBILITY ====================
export const ApiService = {
  uploadFile: async (file: File, seminarId = 'general') => {
    return filesApi.uploadFile(seminarId, file);
  },
  listFiles: async () => {
    return [];
  },
  deleteFile: async (fileId: string) => {
    return filesApi.remove(fileId);
  },
  getDownloadUrl: (fileId: string) => filesApi.getDownloadUrl(fileId),
  getViewUrl: (fileId: string) => filesApi.getViewUrl(fileId),
};

