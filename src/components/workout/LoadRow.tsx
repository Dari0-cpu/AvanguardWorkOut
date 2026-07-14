'use client';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flag, Check, Loader2 } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadRowProps {
  setNumber: number;
  weight: string;
  shouldIncrease: boolean;
  completed: boolean;
  exerciseId: string;
  weekNumber: number;
  onChange: (payload: { weight?: string; shouldIncrease?: boolean; completed?: boolean }) => Promise<void>;
}

export function LoadRow({
  setNumber,
  weight,
  shouldIncrease,
  completed,
  onChange,
}: LoadRowProps) {
  const [localWeight, setLocalWeight] = useState(weight);
  const [savingWeight, setSavingWeight] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef(weight);

  const handleWeightChange = useCallback((val: string) => {
    setLocalWeight(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (val === lastSavedRef.current) return;
      setSavingWeight(true);
      try {
        await onChange({ weight: val });
        lastSavedRef.current = val;
      } finally {
        setSavingWeight(false);
      }
    }, 600);
  }, [onChange]);

  const toggleIncrease = async () => {
    await onChange({ shouldIncrease: !shouldIncrease });
  };

  const toggleCompleted = async () => {
    await onChange({ completed: !completed });
  };

  return (
    <div className={cn(
      'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors',
      completed && 'bg-primary/5',
      shouldIncrease && 'bg-primary/10'
    )}>
      <span className="text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground">
        {setNumber}
      </span>

      <Input
        value={localWeight}
        onChange={(e) => handleWeightChange(e.target.value)}
        placeholder="es. 80kg"
        className="h-8 flex-1 min-w-[80px] text-sm"
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleIncrease}
              className={cn(
                'h-8 w-8 shrink-0',
                shouldIncrease && 'text-primary pulse-increase'
              )}
            >
              <Flag className={cn('h-4 w-4', shouldIncrease && 'fill-primary')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {shouldIncrease ? 'Flagato da aumentare' : 'Flaga per aumento'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleCompleted}
              className={cn(
                'h-8 w-8 shrink-0',
                completed && 'text-emerald-500'
              )}
            >
              {completed ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current opacity-40" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {completed ? 'Completato' : 'Segna completato'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {savingWeight && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}
