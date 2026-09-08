import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, getObjectFromR2 } from '@/lib/services/cloudflareR2Service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key query parameter is required' }, { status: 400 });
    }

    const object = await getObjectFromR2(key);

    if (!object) {
      return NextResponse.json({ success: false, error: 'Object not found in R2' }, { status: 404 });
    }

    return new Response(new Uint8Array(object.buffer), {
      status: 200,
      headers: {
        'Content-Type': object.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[R2 GET Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get('userId') as string | null || req.headers.get('x-user-id');

    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication is required to upload files.' },
        { status: 401 }
      );
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG, WEBP, and GIF images are allowed' }, { status: 400 });
    }

    // Max 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file name to prevent directory traversal
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const result = await uploadToR2(buffer, safeFileName, file.type);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      size: file.size,
      type: file.type,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Upload API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Server error during upload' },
      { status: 500 }
    );
  }
}
