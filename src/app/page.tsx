'use client';

import { useEffect, useState, useCallback } from 'react';
import { SchedaList } from '@/components/workout/SchedaList';
import { SchedaView } from '@/components/workout/SchedaView';
import { NewSchedaModal } from '@/components/workout/NewSchedaModal';
import { Button } from '@/components/ui/button';
import { Dumbbell, Sparkles, TrendingUp, Calendar, Target } from 'lucide-react';
import type { SchedaListItem, Scheda } from '@/types/workout';
import { toast } from 'sonner';

export default function Home() {
  const [schede, setSchede] = useState<SchedaListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedScheda, setSelectedScheda] = useState<Scheda | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingScheda, setLoadingScheda] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/schede');
      if (res.ok) {
        const data = await res.json();
        setSchede(data);
      }
    } catch (e) {
      toast.error('Errore caricamento schede');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadScheda = useCallback(async (id: string) => {
    setLoadingScheda(true);
    try {
      const res = await fetch(`/api/schede/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedScheda(data);
      } else {
        toast.error('Scheda non trovata');
        setSelectedId(null);
      }
    } catch (e) {
      toast.error('Errore caricamento scheda');
    } finally {
      setLoadingScheda(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) {
      loadScheda(selectedId);
    } else {
      setSelectedScheda(null);
    }
  }, [selectedId, loadScheda]);

  const handleCreated = (id: string) => {
    setSelectedId(id);
    loadList();
  };

  // Empty state
  if (schede.length === 0 && !loadingList) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="avanguard-gradient flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-white/10 shrink-0">
                <img src="/avanguard-logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg leading-tight">Avanguard</h1>
                <p className="text-white/60 text-xs leading-tight">Workout Tool</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl avanguard-gradient avanguard-glow">
                <Dumbbell className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Benvenuto in Avanguard Workout Tool</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Crea e gestisci le tue schede di palestra: settimane, giorni, esercizi e carichi
                con tracking progressivo. Inserisci tutto manualmente o estrai i dati da un'immagine con AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="rounded-lg border p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">Estrazione AI</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Carica uno screenshot o foto della tua scheda e l'AI estrae automaticamente esercizi, serie e ripetizioni.
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Settimane & Giorni</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Organizza per settimana e giorno. Inserisci i carichi per ogni set e tieni traccia dei progressi.
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-2 bg-card">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Flag Aumento</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Segna i carichi da aumentare con un flag, copia i carichi da una settimana all'altra in un click.
                </p>
              </div>
            </div>

            <Button size="lg" onClick={() => setModalOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />Crea la tua prima scheda
            </Button>
          </div>
        </div>

        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          Avanguard Workout Tool · Powered by Z.ai
        </footer>

        <NewSchedaModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      </div>
    );
  }

  // Main layout: sidebar + content
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 md:w-72 shrink-0 border-r hidden sm:flex flex-col">
        <SchedaList
          schede={schede}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNew={() => setModalOpen(true)}
          loading={loadingList}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-20 bg-sidebar text-sidebar-foreground border-b">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded overflow-hidden">
              <img src="/avanguard-logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-sm">Avanguard</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setModalOpen(true)} className="text-sidebar-foreground">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-2 pb-2 overflow-x-auto">
          <div className="flex gap-1">
            {schede.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`shrink-0 px-2 py-1 text-xs rounded ${
                  selectedId === s.id ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-sidebar-accent'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden pt-[88px] sm:pt-0">
        {selectedScheda ? (
          <SchedaView
            scheda={selectedScheda}
            onBack={() => setSelectedId(null)}
            onChanged={loadList}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl avanguard-gradient avanguard-glow">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Seleziona una scheda</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Scegli una scheda dalla sidebar per visualizzare settimane, giorni e carichi
                </p>
              </div>
              <Button onClick={() => setModalOpen(true)} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />Oppure creane una nuova
              </Button>
            </div>
          </div>
        )}
      </main>

      <NewSchedaModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
