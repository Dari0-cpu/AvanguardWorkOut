import { NextRequest, NextResponse } from 'next/server';
import { extractSchedaFromImage } from '@/lib/z-ai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }

    // Validazione tipo file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo file non supportato: ${file.type}. Formati: PNG, JPG, WEBP, SVG, GIF` },
        { status: 400 }
      );
    }

    // Dimensione max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const extracted = await extractSchedaFromImage(base64, file.type);

    return NextResponse.json({
      success: true,
      scheda: extracted,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (e) {
    console.error('Extract error:', e);
    return NextResponse.json(
      { error: (e as Error).message || 'Errore durante estrazione AI' },
      { status: 500 }
    );
  }
}
