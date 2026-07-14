'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Loader2, FileImage, Sparkles, Plus, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { DAYS_FULL } from '@/types/workout';

interface NewSchedaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

interface DraftExercise {
  name: string;
  dayOfWeek: number;
  sets: number;
  reps: string;
  restSec: number;
  notes?: string;
}

export function NewSchedaModal({ open, onClose, onCreated }: NewSchedaModalProps) {
  const [tab, setTab] = useState<'manual' | 'extract'>('manual');

  // Manual mode state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('4');
  const [exercises, setExercises] = useState<DraftExercise[]>([
    { name: '', dayOfWeek: 1, sets: 4, reps: '8-12', restSec: 90, notes: '' },
  ]);
  const [saving, setSaving] = useState(false);

  // Extract mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const resetState = () => {
    setName('');
    setDescription('');
    setDurationWeeks('4');
    setExercises([{ name: '', dayOfWeek: 1, sets: 4, reps: '8-12', restSec: 90, notes: '' }]);
    setSelectedFile(null);
    setPreview(null);
    setExtractedData(null);
    setTab('manual');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', dayOfWeek: 1, sets: 4, reps: '8-12', restSec: 90, notes: '' }]);
  };

  const removeExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, patch: Partial<DraftExercise>) => {
    setExercises(exercises.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  };

  const handleSaveManual = async () => {
    if (!name.trim()) {
      toast.error('Inserisci il nome della scheda');
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      toast.error('Aggiungi almeno un esercizio con nome');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/schede', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          durationWeeks: parseInt(durationWeeks) || 4,
          exercises: validExercises,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Errore');
      const created = await res.json();
      toast.success(`Scheda "${created.name}" creata con ${created.exercises.length} esercizi`);
      handleClose();
      onCreated(created.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un\'immagine (PNG, JPG, WEBP, SVG)');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setExtractedData(null);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      toast.error('Carica prima un\'immagine');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Estrazione fallita');
      }

      const data = await res.json();
      setExtractedData(data.scheda);
      
      // Pre-compila i campi della scheda
      if (data.scheda.name) setName(data.scheda.name);
      if (data.scheda.description) setDescription(data.scheda.description);
      if (data.scheda.durationWeeks) setDurationWeeks(String(data.scheda.durationWeeks));
      if (Array.isArray(data.scheda.exercises)) {
        setExercises(data.scheda.exercises.map((ex: any) => ({
          name: ex.name || '',
          dayOfWeek: ex.dayOfWeek || 1,
          sets: ex.sets || 4,
          reps: ex.reps || '8-12',
          restSec: ex.restSec || 90,
          notes: ex.notes || '',
        })));
      }
      toast.success(`Estratti ${data.scheda.exercises?.length || 0} esercizi! Rivedi e salva.`);
      setTab('manual');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Nuova Scheda
          </DialogTitle>
          <DialogDescription>
            Crea una scheda manualmente oppure estrai i dati da un'immagine (foto, screenshot, SVG)
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'manual' | 'extract')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-1.5">
              <Plus className="h-4 w-4" />Manuale
            </TabsTrigger>
            <TabsTrigger value="extract" className="gap-1.5">
              <Wand2 className="h-4 w-4" />Estrai da immagine
            </TabsTrigger>
          </TabsList>

          {/* EXTRACT TAB */}
          <TabsContent value="extract" className="flex-1 overflow-y-auto mt-2">
            <div className="space-y-3">
              {!preview ? (
                <label
                  className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Click per caricare</span> o trascina qui
                    </p>
                    <p className="text-xs text-muted-foreground/70">PNG, JPG, WEBP, SVG, GIF (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border bg-muted/30 max-h-64 flex items-center justify-center">
                    <img src={preview} alt="Preview" className="max-h-64 w-auto object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => { setPreview(null); setSelectedFile(null); setExtractedData(null); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileImage className="h-3.5 w-3.5" />
                    {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024).toFixed(1)} KB)
                  </div>
                  <Button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="w-full gap-2"
                  >
                    {extracting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Estrazione AI in corso...</>
                    ) : (
                      <><Wand2 className="h-4 w-4" />Estrai esercizi con AI</>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground/70 text-center">
                    L'AI analizzerà l'immagine ed estrarrà nome scheda, durata, esercizi, serie, ripetizioni e recuperi.
                    Potrai rivedere e modificare tutto prima di salvare.
                  </p>
                </div>
              )}

              {extractedData && (
                <div className="rounded-md border bg-primary/5 p-3">
                  <div className="text-xs font-semibold mb-1">Anteprima estrazione:</div>
                  <pre className="text-[10px] text-muted-foreground overflow-x-auto max-h-32">
                    {JSON.stringify(extractedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>

          {/* MANUAL TAB */}
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label htmlFor="scheda-name">Nome scheda *</Label>
                <Input
                  id="scheda-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Push/Pull/Legs 4 sett."
                />
              </div>
              <div>
                <Label htmlFor="scheda-weeks">Durata (settimane)</Label>
                <Input
                  id="scheda-weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="scheda-desc">Descrizione (opzionale)</Label>
                <Textarea
                  id="scheda-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Obiettivo, periodo, note generali..."
                  className="min-h-[50px] text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Esercizi</h4>
                <Badge variant="secondary" className="text-[10px]">{exercises.length}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={addExercise} className="gap-1">
                <Plus className="h-3.5 w-3.5" />Aggiungi
              </Button>
            </div>

            <ScrollArea className="max-h-[40vh] pr-2">
              <div className="space-y-2">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="rounded-md border p-2 space-y-2 bg-card">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-5 text-center text-muted-foreground">{idx + 1}</span>
                      <Input
                        value={ex.name}
                        onChange={(e) => updateExercise(idx, { name: e.target.value })}
                        placeholder="Nome esercizio (es. Panca piana)"
                        className="h-8 flex-1 text-sm"
                      />
                      <select
                        value={ex.dayOfWeek}
                        onChange={(e) => updateExercise(idx, { dayOfWeek: parseInt(e.target.value) })}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {DAYS_FULL.map((d, i) => (
                          <option key={i} value={i + 1}>{d.slice(0, 3)}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeExercise(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-7">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Serie</Label>
                        <Input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(idx, { sets: parseInt(e.target.value) || 4 })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Ripetizioni</Label>
                        <Input
                          value={ex.reps}
                          onChange={(e) => updateExercise(idx, { reps: e.target.value })}
                          placeholder="8-12"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Recupero (s)</Label>
                        <Input
                          type="number"
                          value={ex.restSec}
                          onChange={(e) => updateExercise(idx, { restSec: parseInt(e.target.value) || 90 })}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Annulla</Button>
          {tab === 'manual' && (
            <Button onClick={handleSaveManual} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crea scheda
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
