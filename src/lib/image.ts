// Compresses an image File to a JPEG data URL no larger than `maxDim` on its
// long edge. Keeps uploads small so saves are fast and never exceed request
// limits — this is what makes products persist reliably even on slow mobile.
export function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const API_BASE = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

// Uploads a data URL to Supabase Storage and returns the public URL. Falls back
// to the original data URL if the upload fails, so the admin never loses a photo.
export async function uploadImage(dataUrl: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    if (!res.ok) return dataUrl;
    const json = await res.json();
    return json.url || dataUrl;
  } catch {
    return dataUrl;
  }
}

// Compress + upload a File, returning a hosted URL (or a data URL fallback).
export async function processAndUploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  return uploadImage(compressed);
}
