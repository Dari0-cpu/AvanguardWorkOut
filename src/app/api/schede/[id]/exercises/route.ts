import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Aggiungi esercizio a una scheda
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, dayOfWeek, sets, reps, restSec, notes } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nome esercizio obbligatorio' }, { status: 400 });
    }

    // Calcola order massimo
    const maxOrder = await db.exercise.aggregate({
      where: { schedaId: id },
      _max: { order: true },
    });

    const exercise = await db.exercise.create({
      data: {
        schedaId: id,
        name: name.trim(),
        dayOfWeek: Math.min(Math.max(parseInt(dayOfWeek) || 1, 1), 7),
        sets: Math.min(Math.max(parseInt(sets) || 4, 1), 20),
        reps: String(reps || '8-12'),
        restSec: Math.min(Math.max(parseInt(restSec) || 90, 0), 600),
        notes: notes?.trim() || null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    return NextResponse.json(exercise);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
