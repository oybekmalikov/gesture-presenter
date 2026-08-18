import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ConverterService } from '../services/converter.service.js';
import { FileService } from '../services/file.service.js';

const router = Router();

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tempDir = path.resolve(process.env.TEMP_DIR || './public/temp');
    if (!fsSync.existsSync(tempDir)) {
      fsSync.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `upload_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}

router.get('/files', async (_req: Request, res: Response): Promise<void> => {
  try {
    const files = await FileService.getAllFiles();
    res.json({
      success: true,
      total: files.length,
      files,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Fayllarni yuklashda xatolik yuz berdi: ' + error.message,
    });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Fayl tanlanmadi.',
    });
    return;
  }

  const file = req.file;
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);
  const sanitizedBase = sanitizeFileName(baseName);
  const tempPath = file.path;

  const PDF_MAX_SIZE = 50 * 1024 * 1024;
  const MODEL_MAX_SIZE = 100 * 1024 * 1024;

  try {
    if (['.pdf', '.pptx'].includes(ext)) {
      if (file.size > PDF_MAX_SIZE) {
        await fs.unlink(tempPath).catch(() => { });
        res.status(400).json({
          success: false,
          message: `File hajmi 50 MB dan oshmasligi kerak`,
        });
        return;
      }
    } else if (['.step', '.stp', '.glb'].includes(ext)) {
      if (file.size > MODEL_MAX_SIZE) {
        await fs.unlink(tempPath).catch(() => { });
        res.status(400).json({
          success: false,
          message: `3D model fayllar hajmi 100 MB dan oshmasligi kerak`,
        });
        return;
      }
    } else {
      await fs.unlink(tempPath).catch(() => { });
      res.status(400).json({
        success: false,
        message: `Faqat .pdf, .pptx, .stp, .step, .glb fayllar qabul qilinadi.`,
      });
      return;
    }

    const uniqueId = uuidv4().substring(0, 8);
    const pdfDir = path.resolve(process.env.STORAGE_PDF_DIR || './public/pdf');
    const glbDir = path.resolve(process.env.STORAGE_GLB_DIR || './public/glb');

    if (ext === '.pdf') {
      const finalFileName = `${sanitizedBase}_${uniqueId}.pdf`;
      const finalPath = path.join(pdfDir, finalFileName);
      await fs.rename(tempPath, finalPath);

      const record = await FileService.registerFile(finalFileName, originalName, 'pdf');
      res.json({
        success: true,
        message: 'PDF fayl muvaffaqiyatli saqlandi.',
        file: record,
      });
      return;
    }

    if (ext === '.pptx') {
      const finalFileName = `${sanitizedBase}_${uniqueId}.pdf`;
      const finalPath = path.join(pdfDir, finalFileName);

      console.log(`[Upload] Converting PPTX ${originalName} to PDF: ${finalPath}`);
      await ConverterService.convertPptxToPdf(tempPath, finalPath);

      await fs.unlink(tempPath).catch(() => { });

      const record = await FileService.registerFile(finalFileName, `${baseName}.pdf`, 'pdf', 'pptx');
      res.json({
        success: true,
        message: 'File muvaffaqiyatli saqlandi.',
        file: record,
      });
      return;
    }

    if (ext === '.step' || ext === '.stp') {
      const finalFileName = `${sanitizedBase}_${uniqueId}.glb`;
      const finalPath = path.join(glbDir, finalFileName);
      await ConverterService.convertStepToGlb(tempPath, finalPath, baseName);
      await fs.unlink(tempPath).catch(() => { });
      const record = await FileService.registerFile(
        finalFileName,
        `${baseName}.glb`,
        'glb',
        ext.replace('.', '')
      );
      res.json({
        success: true,
        message: 'Model muvaffaqiyatli saqlandi.',
        file: record,
      });
      return;
    }

    if (ext === '.glb') {
      const finalFileName = `${sanitizedBase}_${uniqueId}.glb`;
      const finalPath = path.join(glbDir, finalFileName);
      await fs.rename(tempPath, finalPath);

      const record = await FileService.registerFile(finalFileName, originalName, 'glb');
      res.json({
        success: true,
        message: 'Model muvaffaqiyatli saqlandi.',
        file: record,
      });
      return;
    }
  } catch (error: any) {
    await fs.unlink(tempPath).catch(() => { });
    res.status(500).json({
      success: false,
      message: 'Faylni qayta ishlashda xatolik yuz berdi: ' + error.message,
    });
  }
});

router.get('/files/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = await FileService.getFileById(fileId);
    if (!file) {
      res.status(404).json({
        success: false,
        message: 'Fayl topilmadi.',
      });
      return;
    }

    const physicalPath = FileService.getPhysicalPath(file);
    if (!fsSync.existsSync(physicalPath)) {
      res.status(404).json({
        success: false,
        message: 'Fayl diskda mavjud emas.',
      });
      return;
    }

    res.download(physicalPath, file.originalName);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Faylni yuklab olishda xatolik: ' + error.message,
    });
  }
});

router.delete('/files/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const password =
      req.body?.password ||
      (req.headers['x-root-password'] as string) ||
      (req.query.password as string);

    if (!password || !FileService.verifyRootPassword(password)) {
      res.status(401).json({
        success: false,
        message: 'Root parol noto\'g\'ri kiritildi',
      });
      return;
    }

    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = await FileService.deleteFile(fileId);
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Fayl topilmadi.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Fayl muvaffaqiyatli o\'chirildi.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Faylni o\'chirishda xatolik: ' + error.message,
    });
  }
});

router.post('/verify-password', (req: Request, res: Response): void => {
  const { password } = req.body;
  const isValid = FileService.verifyRootPassword(password);
  res.json({
    success: true,
    valid: isValid,
  });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    name: 'Presentation Platform API',
  });
});

export default router;
