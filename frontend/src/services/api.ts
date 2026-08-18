import { StoredFile } from '../types/file';

const API_BASE = '';

export const ApiService = {
  /**
   * Fetch all files from backend
   */
  async getFiles(): Promise<StoredFile[]> {
    const res = await fetch(`${API_BASE}/api/files`);
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
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/upload`, {
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
    const res = await fetch(`${API_BASE}/api/files/${id}`, {
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
    return `${API_BASE}/api/files/${id}/download`;
  },

  /**
   * Check backend health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
