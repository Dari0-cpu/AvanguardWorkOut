import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/loads?exerciseId=xxx&weekNumber=N  -> lista load di un esercizio per una settimana
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const exerciseId = url.searchParams.get('exerciseId');
    const weekNumber = url.searchParams.get('weekNumber');

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });
    }

    const where: any = { exerciseId };
    if (weekNumber) where.weekNumber = parseInt(weekNumber);

    const loads = await db.load.findMany({ where });
    return NextResponse.json(loads);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST: upsert di un load (cerca per exerciseId+weekNumber+setNumber, aggiorna o crea)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { exerciseId, weekNumber, setNumber, weight, shouldIncrease, completed, notes } = body;

    if (!exerciseId) {
      return NextResponse.json({ error: 'exerciseId required' }, { status: 400 });
    }

    const load = await db.load.upsert({
      where: {
        exerciseId_weekNumber_setNumber: {
          exerciseId,
          weekNumber: parseInt(weekNumber) || 1,
          setNumber: parseInt(setNumber) || 1,
        },
      },
      create: {
        exerciseId,
        weekNumber: parseInt(weekNumber) || 1,
        setNumber: parseInt(setNumber) || 1,
        weight: String(weight ?? ''),
        shouldIncrease: Boolean(shouldIncrease),
        completed: Boolean(completed),
        notes: notes?.trim() || null,
      },
      update: {
        ...(weight !== undefined && { weight: String(weight) }),
        ...(shouldIncrease !== undefined && { shouldIncrease: Boolean(shouldIncrease) }),
        ...(completed !== undefined && { completed: Boolean(completed) }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });
    return NextResponse.json(load);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
