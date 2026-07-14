'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Calendar, Dumbbell, Sparkles, Loader2 } from 'lucide-react';
import type { SchedaListItem } from '@/types/workout';
import { cn } from '@/lib/utils';

interface SchedaListProps {
  schede: SchedaListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading?: boolean;
}

export function SchedaList({ schede, selectedId, onSelect, onNew, loading }: SchedaListProps) {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header / Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-sidebar-accent shrink-0">
            <img
              src="/avanguard-logo.png"
              alt="Avanguard Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">Avanguard</h1>
            <p className="text-[11px] text-sidebar-accent-foreground/70 leading-tight truncate">Workout Tool</p>
          </div>
        </div>
      </div>

      {/* New scheda button */}
      <div className="p-3">
        <Button onClick={onNew} className="w-full gap-2" variant="default">
          <Sparkles className="h-4 w-4" />
          Nuova scheda
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-sidebar-accent-foreground/50" />
          </div>
        ) : schede.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Dumbbell className="h-10 w-10 mx-auto text-sidebar-accent-foreground/30 mb-2" />
            <p className="text-sm font-medium text-sidebar-accent-foreground/70">Nessuna scheda</p>
            <p className="text-xs text-sidebar-accent-foreground/50 mt-1">
              Crea la tua prima scheda per iniziare
            </p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {schede.map(scheda => (
              <button
                key={scheda.id}
                onClick={() => onSelect(scheda.id)}
                className={cn(
                  'w-full text-left p-3 rounded-md transition-colors group',
                  selectedId === scheda.id
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{scheda.name}</p>
                    {scheda.description && (
                      <p className="text-[11px] opacity-70 truncate mt-0.5">{scheda.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          selectedId === scheda.id ? 'bg-sidebar-primary-foreground/15' : ''
                        )}
                      >
                        <Calendar className="h-2.5 w-2.5 mr-1" />
                        {scheda.durationWeeks} sett.
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          selectedId === scheda.id ? 'bg-sidebar-primary-foreground/15' : ''
                        )}
                      >
                        <Dumbbell className="h-2.5 w-2.5 mr-1" />
                        {scheda.exerciseCount} ex
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border text-[10px] text-sidebar-accent-foreground/50 text-center">
        Avanguard Workout Tool · v1.0
      </div>
    </div>
  );
}
