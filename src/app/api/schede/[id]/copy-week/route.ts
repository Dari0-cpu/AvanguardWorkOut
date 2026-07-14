import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/schede/[id]/copy-week
// Body: { fromWeek: N, toWeek: M }
// Copia tutti i carichi della settimana fromWeek nella settimana toWeek
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const fromWeek = parseInt(body.fromWeek);
    const toWeek = parseInt(body.toWeek);

    if (!fromWeek || !toWeek || fromWeek === toWeek) {
      return NextResponse.json({ error: 'fromWeek e toWeek richiesti e devono essere diversi' }, { status: 400 });
    }

    // Prendi tutti gli esercizi della scheda
    const exercises = await db.exercise.findMany({ where: { schedaId: id } });

    let copied = 0;
    for (const ex of exercises) {
      const sourceLoads = await db.load.findMany({
        where: { exerciseId: ex.id, weekNumber: fromWeek },
      });

      for (const load of sourceLoads) {
        await db.load.upsert({
          where: {
            exerciseId_weekNumber_setNumber: {
              exerciseId: ex.id,
              weekNumber: toWeek,
              setNumber: load.setNumber,
            },
          },
          create: {
            exerciseId: ex.id,
            weekNumber: toWeek,
            setNumber: load.setNumber,
            weight: load.weight,
            shouldIncrease: load.shouldIncrease,
            completed: false, // reset completed nella nuova settimana
            notes: load.notes,
          },
          update: {
            weight: load.weight,
            shouldIncrease: load.shouldIncrease,
            notes: load.notes,
          },
        });
        copied++;
      }
    }

    return NextResponse.json({ ok: true, copied, fromWeek, toWeek });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
