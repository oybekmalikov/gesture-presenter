export type FileType = 'pdf' | 'glb';

export interface StoredFile {
  id: string;
  originalName: string;
  fileName: string;
  fileType: FileType;
  size: number;
  convertedFrom?: 'pptx' | 'step' | 'stp' | string;
  createdAt: string;
  url: string;
  downloadUrl: string;
}

export type ViewModule = 
  | 'dashboard'
  | 'presentation'
  | 'model3d'
  | 'files'
  | 'gesture'
  | 'archive'
  | 'settings';
