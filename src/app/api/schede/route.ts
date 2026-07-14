import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const schede = await db.scheda.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        exercises: {
          select: { id: true },
        },
      },
    });
    
    const result = schede.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationWeeks: s.durationWeeks,
      exerciseCount: s.exercises.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
    
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, durationWeeks, exercises } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }

    const scheda = await db.scheda.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        durationWeeks: Math.min(Math.max(parseInt(durationWeeks) || 4, 1), 52),
        exercises: Array.isArray(exercises) && exercises.length > 0
          ? {
              create: exercises.map((ex: any, idx: number) => ({
                name: String(ex.name || '').trim(),
                dayOfWeek: Math.min(Math.max(parseInt(ex.dayOfWeek) || 1, 1), 7),
                sets: Math.min(Math.max(parseInt(ex.sets) || 4, 1), 20),
                reps: String(ex.reps || '8-12'),
                restSec: Math.min(Math.max(parseInt(ex.restSec) || 90, 0), 600),
                notes: ex.notes?.trim() || null,
                order: idx,
              })),
            }
          : undefined,
      },
      include: { exercises: true },
    });

    return NextResponse.json(scheda);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
