import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, dayOfWeek, sets, reps, restSec, notes, order } = body;

    const updated = await db.exercise.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(dayOfWeek !== undefined && { dayOfWeek: Math.min(Math.max(parseInt(dayOfWeek) || 1, 1), 7) }),
        ...(sets !== undefined && { sets: Math.min(Math.max(parseInt(sets) || 4, 1), 20) }),
        ...(reps !== undefined && { reps: String(reps) }),
        ...(restSec !== undefined && { restSec: Math.min(Math.max(parseInt(restSec) || 90, 0), 600) }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(order !== undefined && { order: parseInt(order) || 0 }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.exercise.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
