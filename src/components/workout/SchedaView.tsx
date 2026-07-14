'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, MoreVertical, Trash2, Pencil,
  Copy, Download, Loader2, Target, TrendingUp, CheckCircle2, Clock
} from 'lucide-react';
import type { Scheda, Exercise, Load } from '@/types/workout';
import { DAYS, DAYS_FULL, dayLabelFull, DAY_COLORS } from '@/types/workout';
import { ExerciseCard } from './ExerciseCard';

interface SchedaViewProps {
  scheda: Scheda;
  onBack: () => void;
  onChanged: () => void;
}

export function SchedaView({ scheda, onBack, onChanged }: SchedaViewProps) {
  const [weekNumber, setWeekNumber] = useState(1);
  const [exercises, setExercises] = useState<Exercise[]>(scheda.exercises ?? []);
  const [loading, setLoading] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  const [metaDraft, setMetaDraft] = useState({
    name: scheda.name,
    description: scheda.description ?? '',
    durationWeeks: String(scheda.durationWeeks),
  });

  const [newEx, setNewEx] = useState({
    name: '', dayOfWeek: 1, sets: 4, reps: '8-12', restSec: 90, notes: '',
  });

  useEffect(() => {
    setExercises(scheda.exercises ?? []);
    setMetaDraft({
      name: scheda.name,
      description: scheda.description ?? '',
      durationWeeks: String(scheda.durationWeeks),
    });
  }, [scheda]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schede/${scheda.id}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data.exercises ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [scheda.id]);

  // Statistiche
  const stats = {
    total: exercises.reduce((acc, e) => acc + e.sets, 0),
    completed: exercises.reduce((acc, e) => {
      const weekLoads = (e.loads ?? []).filter(l => l.weekNumber === weekNumber && l.completed);
      return acc + weekLoads.length;
    }, 0),
    flagged: exercises.reduce((acc, e) => {
      const weekLoads = (e.loads ?? []).filter(l => l.weekNumber === weekNumber && l.shouldIncrease);
      return acc + weekLoads.length;
    }, 0),
  };

  const exerciseByDay = (day: number) => exercises.filter(e => e.dayOfWeek === day).sort((a, b) => a.order - b.order);

  const handleUpdateExercise = async (id: string, patch: Partial<Exercise>) => {
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Errore aggiornamento');
      setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore eliminazione');
      setExercises(prev => prev.filter(e => e.id !== id));
      toast.success('Esercizio eliminato');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleMoveExercise = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...exercises].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(e => e.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    // Swap orders
    await Promise.all([
      fetch(`/api/exercises/${a.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: b.order })
      }),
      fetch(`/api/exercises/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: a.order })
      }),
    ]);
    await reload();
  };

  const handleUpsertLoad = async (exerciseId: string, setNumber: number, patch: Partial<Load>) => {
    // Optimistic update
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const loads = e.loads ?? [];
      const existingIdx = loads.findIndex(l => l.setNumber === setNumber && l.weekNumber === weekNumber);
      let newLoads;
      if (existingIdx >= 0) {
        newLoads = loads.map((l, i) => i === existingIdx ? { ...l, ...patch } : l);
      } else {
        newLoads = [...loads, {
          id: `temp-${Date.now()}`,
          exerciseId,
          weekNumber,
          setNumber,
          weight: patch.weight ?? '',
          shouldIncrease: patch.shouldIncrease ?? false,
          completed: patch.completed ?? false,
          notes: patch.notes ?? null,
        }];
      }
      return { ...e, loads: newLoads };
    }));

    try {
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          weekNumber,
          setNumber,
          ...patch,
        }),
      });
      if (!res.ok) throw new Error('Errore salvataggio carico');
      const saved = await res.json();
      // Aggiorna con l'oggetto reale dal server (per avere id corretti)
      setExercises(prev => prev.map(e => {
        if (e.id !== exerciseId) return e;
        const loads = e.loads ?? [];
        const existingIdx = loads.findIndex(l => l.setNumber === setNumber && l.weekNumber === weekNumber && !l.id.startsWith('temp-'));
        let newLoads;
        if (existingIdx >= 0) {
          newLoads = loads.map((l, i) => i === existingIdx ? { ...l, ...saved } : l);
        } else {
          // Sostituisci il temp con quello reale
          newLoads = [...loads.filter(l => !(l.setNumber === setNumber && l.weekNumber === weekNumber && l.id.startsWith('temp-'))), saved];
        }
        return { ...e, loads: newLoads };
      }));
    } catch (e) {
      toast.error((e as Error).message);
      await reload();
    }
  };

  const handleCopyWeek = async (fromWeek: number, toWeek: number) => {
    try {
      const res = await fetch(`/api/schede/${scheda.id}/copy-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromWeek, toWeek }),
      });
      if (!res.ok) throw new Error('Errore copia');
      const data = await res.json();
      toast.success(`Copiati ${data.copied} carichi dalla sett.${fromWeek} alla sett.${toWeek}`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleSaveMeta = async () => {
    try {
      const res = await fetch(`/api/schede/${scheda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metaDraft.name.trim(),
          description: metaDraft.description.trim() || null,
          durationWeeks: parseInt(metaDraft.durationWeeks) || 4,
        }),
      });
      if (!res.ok) throw new Error('Errore salvataggio');
      toast.success('Scheda aggiornata');
      setEditingMeta(false);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDeleteScheda = async () => {
    try {
      const res = await fetch(`/api/schede/${scheda.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Errore eliminazione');
      toast.success('Scheda eliminata');
      setConfirmDelete(false);
      onBack();
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleAddExercise = async () => {
    if (!newEx.name.trim()) {
      toast.error('Nome esercizio obbligatorio');
      return;
    }
    try {
      const res = await fetch(`/api/schede/${scheda.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx),
      });
      if (!res.ok) throw new Error('Errore aggiunta');
      const created = await res.json();
      setExercises(prev => [...prev, { ...created, loads: [] }]);
      setNewEx({ name: '', dayOfWeek: 1, sets: 4, reps: '8-12', restSec: 90, notes: '' });
      setAddExerciseOpen(false);
      toast.success(`Esercizio "${created.name}" aggiunto`);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const exportJSON = () => {
    const data = JSON.stringify({ ...scheda, exercises }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scheda.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Scheda esportata');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-4 py-3 flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-0.5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate flex items-center gap-2">
                {scheda.name}
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {scheda.durationWeeks} sett.
                </Badge>
              </h2>
              {scheda.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{scheda.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="text-muted-foreground">
                  <Target className="inline h-3 w-3 mr-1" />
                  {exercises.length} esercizi
                </span>
                <span className="text-emerald-500">
                  <CheckCircle2 className="inline h-3 w-3 mr-1" />
                  {stats.completed}/{stats.total} completati
                </span>
                <span className="text-primary">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {stats.flagged} da aumentare
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="default" onClick={() => setAddExerciseOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />Esercizio
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingMeta(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />Modifica scheda
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportJSON}>
                  <Download className="h-3.5 w-3.5 mr-2" />Esporta JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (weekNumber > 1) handleCopyWeek(weekNumber - 1, weekNumber);
                  }}
                  disabled={weekNumber <= 1}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />Copia carichi da sett. {weekNumber - 1}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />Elimina scheda
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Week selector */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekNumber(Math.max(1, weekNumber - 1))}
              disabled={weekNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 overflow-x-auto">
              <Tabs value={String(weekNumber)} onValueChange={(v) => setWeekNumber(parseInt(v))}>
                <TabsList className="h-8">
                  {Array.from({ length: scheda.durationWeeks }, (_, i) => i + 1).map(w => (
                    <TabsTrigger key={w} value={String(w)} className="text-xs px-3 h-6">
                      Sett. {w}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setWeekNumber(Math.min(scheda.durationWeeks, weekNumber + 1))}
              disabled={weekNumber >= scheda.durationWeeks}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body: days grid */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {exercises.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <Target className="h-10 w-10 text-muted-foreground/40" />
                <div>
                  <p className="font-semibold">Nessun esercizio</p>
                  <p className="text-sm text-muted-foreground">Aggiungi il primo esercizio per iniziare</p>
                </div>
                <Button onClick={() => setAddExerciseOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />Aggiungi esercizio
                </Button>
              </CardContent>
            </Card>
          ) : (
            DAYS.map((dayLabel, idx) => {
              const dayNum = idx + 1;
              const dayExercises = exerciseByDay(dayNum);
              if (dayExercises.length === 0) return null;
              const dayCompleted = dayExercises.reduce((acc, e) => {
                return acc + (e.loads ?? []).filter(l => l.weekNumber === weekNumber && l.completed).length;
              }, 0);
              const dayTotal = dayExercises.reduce((acc, e) => acc + e.sets, 0);
              return (
                <div key={dayNum} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-1.5 z-10">
                    <Badge variant="outline" className={DAY_COLORS[dayNum]}>
                      {dayLabelFull(dayNum)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {dayExercises.length} esercizi · {dayCompleted}/{dayTotal} completati
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {dayExercises.map(ex => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        weekNumber={weekNumber}
                        onUpdateExercise={(patch) => handleUpdateExercise(ex.id, patch)}
                        onDeleteExercise={() => handleDeleteExercise(ex.id)}
                        onUpsertLoad={(setNum, patch) => handleUpsertLoad(ex.id, setNum, patch)}
                        onMove={(dir) => handleMoveExercise(ex.id, dir)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Add exercise modal */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo esercizio</DialogTitle>
            <DialogDescription>Aggiungi un esercizio alla scheda "{scheda.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={newEx.name}
                onChange={(e) => setNewEx({ ...newEx, name: e.target.value })}
                placeholder="es. Panca piana"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giorno</Label>
                <select
                  value={newEx.dayOfWeek}
                  onChange={(e) => setNewEx({ ...newEx, dayOfWeek: parseInt(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {DAYS_FULL.map((d, i) => (
                    <option key={i} value={i + 1}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Serie</Label>
                <Input
                  type="number"
                  value={newEx.sets}
                  onChange={(e) => setNewEx({ ...newEx, sets: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div>
                <Label>Ripetizioni</Label>
                <Input
                  value={newEx.reps}
                  onChange={(e) => setNewEx({ ...newEx, reps: e.target.value })}
                  placeholder="8-12"
                />
              </div>
              <div>
                <Label>Recupero (s)</Label>
                <Input
                  type="number"
                  value={newEx.restSec}
                  onChange={(e) => setNewEx({ ...newEx, restSec: parseInt(e.target.value) || 90 })}
                />
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea
                value={newEx.notes}
                onChange={(e) => setNewEx({ ...newEx, notes: e.target.value })}
                placeholder="Tecnica, tempo, cedimento..."
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddExerciseOpen(false)}>Annulla</Button>
            <Button onClick={handleAddExercise} className="gap-1.5">
              <Plus className="h-4 w-4" />Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit meta modal */}
      <Dialog open={editingMeta} onOpenChange={setEditingMeta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica scheda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={metaDraft.name} onChange={(e) => setMetaDraft({ ...metaDraft, name: e.target.value })} />
            </div>
            <div>
              <Label>Durata (settimane)</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={metaDraft.durationWeeks}
                onChange={(e) => setMetaDraft({ ...metaDraft, durationWeeks: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={metaDraft.description}
                onChange={(e) => setMetaDraft({ ...metaDraft, description: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMeta(false)}>Annulla</Button>
            <Button onClick={handleSaveMeta}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina scheda?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{scheda.name}" con tutti i {exercises.length} esercizi e i relativi carichi.
              L'operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteScheda} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
