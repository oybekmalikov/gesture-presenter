export type FileType = 'pdf' | 'glb';

export interface StoredFile {
  id: string;
  originalName: string;
  fileName: string;
  fileType: FileType;
  size: number;
  convertedFrom?: string;
  createdAt: string;
  url: string;
  downloadUrl: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file: StoredFile;
}

export interface FilesListResponse {
  success: boolean;
  total: number;
  files: StoredFile[];
}
