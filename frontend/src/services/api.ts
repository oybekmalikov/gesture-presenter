import { StoredFile } from '../types/file';

/**
 * Dynamically compute base path (works for both root '/' and subpath '/presenter/')
 */
export function getBasePrefix(): string {
  const p = window.location.pathname;
  if (p.startsWith('/presenter')) return '/presenter';
  return '';
}

export const ApiService = {
  /**
   * Fetch all files from backend
   */
  async getFiles(): Promise<StoredFile[]> {
    const base = getBasePrefix();
    const res = await fetch(`${base}/api/files`);
    if (!res.ok) {
      throw new Error(`Fayllarni olishda xatolik: ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  },

  /**
   * Upload and convert file
   */
  async uploadFile(file: File): Promise<{ success: boolean; message: string; file?: StoredFile }> {
    const base = getBasePrefix();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${base}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Yuklashda xatolik yuz berdi');
    }

    return data;
  },

  /**
   * Delete file with root password
   */
  async deleteFile(id: string, password: string): Promise<{ success: boolean; message: string }> {
    const base = getBasePrefix();
    const res = await fetch(`${base}/api/files/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'O\'chirishda xatolik yuz berdi');
    }

    return data;
  },

  /**
   * Get direct download link
   */
  getDownloadUrl(id: string): string {
    const base = getBasePrefix();
    return `${base}/api/files/${id}/download`;
  },

  /**
   * Resolve file URL for presentation or 3D viewer
   */
  resolveFileUrl(relativeUrl: string): string {
    const base = getBasePrefix();
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://') || relativeUrl.startsWith('blob:')) {
      return relativeUrl;
    }
    if (relativeUrl.startsWith('/')) {
      return `${base}${relativeUrl}`;
    }
    return `${base}/${relativeUrl}`;
  },

  /**
   * Check backend health
   */
  async checkHealth(): Promise<boolean> {
    const base = getBasePrefix();
    try {
      const res = await fetch(`${base}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
