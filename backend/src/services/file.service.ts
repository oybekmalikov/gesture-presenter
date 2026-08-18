import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StoredFile } from '../types/index.js';

export class FileService {
  private static pdfDir = path.resolve(process.env.STORAGE_PDF_DIR || './public/pdf');
  private static glbDir = path.resolve(process.env.STORAGE_GLB_DIR || './public/glb');
  private static tempDir = path.resolve(process.env.TEMP_DIR || './public/temp');
  private static metaFile = path.resolve('./public/metadata.json');
  private static frontendModelsDir = path.resolve(
    process.env.FRONTEND_MODELS_DIR || '../frontend/public/models'
  );
  private static frontendModelsDirAlt = path.resolve(
    process.env.FRONTEND_MODELS_DIR_ALT || '../frontend/models'
  );
  static async init() {
    await fs.mkdir(this.pdfDir, { recursive: true });
    await fs.mkdir(this.glbDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.frontendModelsDir, { recursive: true });
    await fs.mkdir(this.frontendModelsDirAlt, { recursive: true });
    if (!fsSync.existsSync(this.metaFile)) {
      await fs.writeFile(this.metaFile, JSON.stringify([], null, 2));
    }
  }
  private static async readMetadata(): Promise<StoredFile[]> {
    try {
      if (!fsSync.existsSync(this.metaFile)) return [];
      const content = await fs.readFile(this.metaFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  private static async writeMetadata(files: StoredFile[]): Promise<void> {
    await fs.writeFile(this.metaFile, JSON.stringify(files, null, 2), 'utf-8');
  }
  static async getAllFiles(): Promise<StoredFile[]> {
    await this.init();
    const metadata = await this.readMetadata();
    const metaMap = new Map<string, StoredFile>(metadata.map((f) => [f.fileName, f]));
    const existingFiles: StoredFile[] = [];
    try {
      const pdfFiles = await fs.readdir(this.pdfDir);
      for (const fileName of pdfFiles) {
        if (!fileName.endsWith('.pdf')) continue;
        const filePath = path.join(this.pdfDir, fileName);
        const stats = await fs.stat(filePath);
        const existing = metaMap.get(fileName);

        const fileRecord: StoredFile = {
          id: existing?.id || uuidv4(),
          originalName: existing?.originalName || fileName,
          fileName,
          fileType: 'pdf',
          size: stats.size,
          convertedFrom: existing?.convertedFrom,
          createdAt: existing?.createdAt || stats.birthtime.toISOString(),
          url: `/files/pdf/${fileName}`,
          downloadUrl: `/api/files/${existing?.id || fileName}/download`,
        };
        existingFiles.push(fileRecord);
      }
    } catch (e) {
      console.error('Error scanning PDF dir:', e);
    }
    try {
      const glbFiles = await fs.readdir(this.glbDir);
      for (const fileName of glbFiles) {
        if (!fileName.endsWith('.glb')) continue;
        const filePath = path.join(this.glbDir, fileName);
        const stats = await fs.stat(filePath);
        const existing = metaMap.get(fileName);

        const fileRecord: StoredFile = {
          id: existing?.id || uuidv4(),
          originalName: existing?.originalName || fileName,
          fileName,
          fileType: 'glb',
          size: stats.size,
          convertedFrom: existing?.convertedFrom,
          createdAt: existing?.createdAt || stats.birthtime.toISOString(),
          url: `/files/glb/${fileName}`,
          downloadUrl: `/api/files/${existing?.id || fileName}/download`,
        };
        existingFiles.push(fileRecord);
        await this.syncGlbToFrontend(fileName);
      }
    } catch (e) {
      console.error('Error scanning GLB dir:', e);
    }
    existingFiles.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    await this.writeMetadata(existingFiles);
    return existingFiles;
  }
  static async getFileById(id: string): Promise<StoredFile | null> {
    const files = await this.getAllFiles();
    return files.find((f) => f.id === id || f.fileName === id) || null;
  }
  static getPhysicalPath(file: StoredFile): string {
    if (file.fileType === 'pdf') {
      return path.join(this.pdfDir, file.fileName);
    } else {
      return path.join(this.glbDir, file.fileName);
    }
  }

  static async syncGlbToFrontend(fileName: string) {
    try {
      const srcGlb = path.join(this.glbDir, fileName);
      if (!fsSync.existsSync(srcGlb)) return;

      const target1 = path.join(this.frontendModelsDir, fileName);
      const target2 = path.join(this.frontendModelsDirAlt, fileName);

      await fs.copyFile(srcGlb, target1).catch(() => { });
      await fs.copyFile(srcGlb, target2).catch(() => { });
    } catch (err) {
      console.warn(`[FileService] Sync GLB to frontend warning for ${fileName}:`, err);
    }
  }


  static async registerFile(
    fileName: string,
    originalName: string,
    fileType: 'pdf' | 'glb',
    convertedFrom?: string
  ): Promise<StoredFile> {
    const id = uuidv4();
    const filePath = fileType === 'pdf' ? path.join(this.pdfDir, fileName) : path.join(this.glbDir, fileName);
    const stats = await fs.stat(filePath);

    const record: StoredFile = {
      id,
      originalName,
      fileName,
      fileType,
      size: stats.size,
      convertedFrom,
      createdAt: new Date().toISOString(),
      url: `/files/${fileType}/${fileName}`,
      downloadUrl: `/api/files/${id}/download`,
    };

    if (fileType === 'glb') {
      await this.syncGlbToFrontend(fileName);
    }

    const files = await this.readMetadata();
    const updated = files.filter((f) => f.fileName !== fileName);
    updated.unshift(record);
    await this.writeMetadata(updated);

    return record;
  }

  static async deleteFile(id: string): Promise<boolean> {
    const file = await this.getFileById(id);
    if (!file) return false;

    const physicalPath = this.getPhysicalPath(file);
    if (fsSync.existsSync(physicalPath)) {
      await fs.unlink(physicalPath).catch(() => { });
    }

    if (file.fileType === 'glb') {
      const target1 = path.join(this.frontendModelsDir, file.fileName);
      const target2 = path.join(this.frontendModelsDirAlt, file.fileName);
      if (fsSync.existsSync(target1)) await fs.unlink(target1).catch(() => { });
      if (fsSync.existsSync(target2)) await fs.unlink(target2).catch(() => { });
    }

    const files = await this.readMetadata();
    const updated = files.filter((f) => f.id !== file.id && f.fileName !== file.fileName);
    await this.writeMetadata(updated);

    return true;
  }

  static verifyRootPassword(password: string): boolean {
    const rootPassword = process.env.ROOT_PASSWORD || '0000';
    return Boolean(password) && password === rootPassword;
  }
}
