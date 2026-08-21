import { User } from './auth';

export enum SeminarStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FileAccess {
  PUBLIC = 'public',
  READABLE = 'readable',
  PRIVATE = 'private',
}

export interface Tag {
  id: string;
  name: string;
  count?: number;
}

export interface SeminarFile {
  id: string;
  seminarId: string;
  originalName: string;
  storedName: string;
  fileType: 'pdf' | '3d' | 'presentation' | 'image' | 'video' | 'other' | string;
  mimeType?: string;
  size: number;
  storagePath: string;
  convertedFrom?: string;
  sortOrder: number;
  markedForDeletionAt?: string;
  deletionScheduledDate?: string;
  deletionReason?: string;
  createdAt: string;
  canView?: boolean;
  canDownload?: boolean;
  remainingDays?: number;
}

export interface Seminar {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  author?: User;
  targetUserId?: string;
  targetUser?: User;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  status: SeminarStatus;
  fileAccess: FileAccess;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  isLive: boolean;
  isRecorded: boolean;
  coverImageUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  files?: SeminarFile[];
  tags?: Tag[];
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  savedAt?: string;
}

export interface CommentItem {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    fio: string;
    username: string;
    lavozim?: string;
    avatarUrl?: string;
  } | null;
  replies: CommentItem[];
}

export interface QuerySeminarParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  departmentId?: string;
  status?: SeminarStatus;
  fileAccess?: FileAccess;
  tab?: 'all' | 'scheduled' | 'live' | 'completed' | 'my' | 'department';
  sortBy?: 'latest' | 'popular' | 'views';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
