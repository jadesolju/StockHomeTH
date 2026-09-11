/**
 * Client-side Media & Document Helper
 * - Compresses images to max 1024x1024 px before upload/API transmission.
 * - Extracts text and counts tokens for document uploads (PDF/Excel/CSV/Text).
 */

export interface ProcessedImage {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  text: string;
  estimatedTokens: number;
  sizeKb: number;
  exceedsFreeQuota: boolean;
}

const MAX_IMAGE_DIMENSION = 1024;
const MAX_DOC_TOKENS_FREE = 4000;

/**
 * Compresses an image file client-side using HTML5 Canvas to max 1024x1024 px.
 */
export async function compressImageTo1024(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถโหลดภาพเข้าหน่วยความจำได้'));
      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('เบราว์เซอร์ไม่รองรับ HTML5 Canvas'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          dataUrl,
          width,
          height,
          sizeKb: approxSizeKb,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Scans and reads document content client-side, estimating token length.
 * Supports .txt, .csv, .json, .md, and raw text representations.
 */
export async function scanDocumentFile(file: File): Promise<ProcessedDocument> {
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > 10) {
    throw new Error('ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 10MB)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์เอกสารได้'));
    reader.onload = () => {
      const rawText = (reader.result as string) || '';
      // Rough estimation for Thai + English mixed text: ~3.5 chars per token
      const estimatedTokens = Math.ceil(rawText.length / 3.5);
      const exceedsFreeQuota = estimatedTokens > MAX_DOC_TOKENS_FREE;

      resolve({
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        text: rawText,
        estimatedTokens,
        sizeKb: Math.round(file.size / 1024),
        exceedsFreeQuota,
      });
    };

    // For plain text, csv, json, md, read as text
    if (
      file.type.includes('text') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    ) {
      reader.readAsText(file);
    } else {
      // For binary files (PDF / XLSX), provide file metadata note
      const fallbackText = `[ไฟล์เอกสารแนบ: ${file.name} ขนาด: ${(file.size / 1024).toFixed(1)} KB]`;
      resolve({
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        text: fallbackText,
        estimatedTokens: Math.ceil(fallbackText.length / 3.5),
        sizeKb: Math.round(file.size / 1024),
        exceedsFreeQuota: false,
      });
    }
  });
}
