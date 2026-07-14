'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, MoreVertical, Plus, Trash2, Clock, Repeat, Pencil } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LoadRow } from './LoadRow';
import type { Exercise, Load } from '@/types/workout';
import { dayLabel, dayLabelFull, DAY_COLORS } from '@/types/workout';

interface ExerciseCardProps {
  exercise: Exercise;
  weekNumber: number;
  onUpdateExercise: (patch: Partial<Exercise>) => Promise<void>;
  onDeleteExercise: () => Promise<void>;
  onUpsertLoad: (setNumber: number, patch: Partial<Load>) => Promise<void>;
  onMove: (direction: 'up' | 'down') => Promise<void>;
}

export function ExerciseCard({
  exercise,
  weekNumber,
  onUpdateExercise,
  onDeleteExercise,
  onUpsertLoad,
  onMove,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: exercise.name,
    sets: String(exercise.sets),
    reps: exercise.reps,
    restSec: String(exercise.restSec),
    notes: exercise.notes ?? '',
    dayOfWeek: String(exercise.dayOfWeek),
  });

  const loads = exercise.loads ?? [];
  const loadsForWeek = loads.filter((l) => l.weekNumber === weekNumber);
  const completedCount = loadsForWeek.filter((l) => l.completed).length;
  const flaggedCount = loadsForWeek.filter((l) => l.shouldIncrease).length;

  const saveEdit = async () => {
    await onUpdateExercise({
      name: draft.name.trim() || exercise.name,
      sets: Math.min(Math.max(parseInt(draft.sets) || 4, 1), 20),
      reps: draft.reps,
      restSec: Math.min(Math.max(parseInt(draft.restSec) || 90, 0), 600),
      notes: draft.notes.trim() || null,
      dayOfWeek: Math.min(Math.max(parseInt(draft.dayOfWeek) || 1, 1), 7),
    });
    setEditing(false);
  };

  return (
    <Card className={cn(
      'overflow-hidden border-l-4',
      DAY_COLORS[exercise.dayOfWeek]?.split(' ').find(c => c.startsWith('border-')) 
        ? `border-l-${DAY_COLORS[exercise.dayOfWeek].match(/border-(\w+-\d+)/)?.[1]}`
        : 'border-l-primary'
    )}>
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{exercise.name}</span>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', DAY_COLORS[exercise.dayOfWeek])}>
                {dayLabel(exercise.dayOfWeek)}
              </Badge>
              {flaggedCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary">
                  {flaggedCount} ↑
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />{exercise.sets}×{exercise.reps}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{exercise.restSec}s
              </span>
              {completedCount > 0 && (
                <span className="text-emerald-500 font-medium">{completedCount}/{exercise.sets} ✓</span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(!editing)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />Modifica
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove('up')}>
              <ChevronUp className="h-3.5 w-3.5 mr-2" />Sposta su
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove('down')}>
              <ChevronDown className="h-3.5 w-3.5 mr-2" />Sposta giù
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDeleteExercise} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {editing && (
        <CardContent className="py-3 px-4 border-t bg-muted/30 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Nome esercizio</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Giorno</Label>
              <select
                value={draft.dayOfWeek}
                onChange={(e) => setDraft({ ...draft, dayOfWeek: e.target.value })}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {[1,2,3,4,5,6,7].map(d => (
                  <option key={d} value={d}>{dayLabelFull(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Serie</Label>
              <Input
                type="number"
                value={draft.sets}
                onChange={(e) => setDraft({ ...draft, sets: e.target.value })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Ripetizioni</Label>
              <Input
                value={draft.reps}
                onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
                placeholder="8-12"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Recupero (sec)</Label>
              <Input
                type="number"
                value={draft.restSec}
                onChange={(e) => setDraft({ ...draft, restSec: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Note</Label>
              <Textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Tecnica, tempo, cedimento..."
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Annulla</Button>
            <Button size="sm" onClick={saveEdit}>Salva</Button>
          </div>
        </CardContent>
      )}

      {expanded && !editing && (
        <CardContent className="py-2 px-2 space-y-0">
          <div className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            <span className="flex-1">Set</span>
            <span className="flex-[3]">Carico</span>
            <span className="w-8 text-center">↑</span>
            <span className="w-8 text-center">✓</span>
          </div>
          {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => {
            const load = loadsForWeek.find((l) => l.setNumber === setNum);
            return (
              <LoadRow
                key={setNum}
                setNumber={setNum}
                weight={load?.weight ?? ''}
                shouldIncrease={load?.shouldIncrease ?? false}
                completed={load?.completed ?? false}
                exerciseId={exercise.id}
                weekNumber={weekNumber}
                onChange={(patch) => onUpsertLoad(setNum, patch)}
              />
            );
          })}
          {exercise.notes && (
            <div className="text-xs text-muted-foreground italic px-2 py-1.5 mt-1 border-t">
              📝 {exercise.notes}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
