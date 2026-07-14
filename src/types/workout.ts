export interface Load {
  id: string;
  exerciseId: string;
  weekNumber: number;
  setNumber: number;
  weight: string;
  shouldIncrease: boolean;
  completed: boolean;
  notes?: string | null;
}

export interface Exercise {
  id: string;
  schedaId: string;
  name: string;
  dayOfWeek: number; // 1=Lun..7=Dom
  sets: number;
  reps: string;
  restSec: number;
  notes?: string | null;
  order: number;
  loads?: Load[];
}

export interface Scheda {
  id: string;
  name: string;
  description?: string | null;
  durationWeeks: number;
  createdAt: string;
  updatedAt: string;
  exercises?: Exercise[];
}

export interface SchedaListItem {
  id: string;
  name: string;
  description?: string | null;
  durationWeeks: number;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string;
}

export const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const DAYS_FULL = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function dayLabel(d: number): string {
  return DAYS[(d - 1) % 7] ?? '?';
}
export function dayLabelFull(d: number): string {
  return DAYS_FULL[(d - 1) % 7] ?? '?';
}

// Colori per i giorni
export const DAY_COLORS: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  2: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  3: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  4: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
  5: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  6: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30',
  7: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30',
};
