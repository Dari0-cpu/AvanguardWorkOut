import ZAI from 'z-ai-web-dev-sdk';

export interface ExtractedExercise {
  name: string;
  dayOfWeek: number; // 1=Lun..7=Dom
  sets: number;
  reps: string;
  restSec: number;
  notes?: string;
}

export interface ExtractedScheda {
  name: string;
  description?: string;
  durationWeeks: number;
  exercises: ExtractedExercise[];
}

const SYSTEM_PROMPT = `Sei un assistente che estrae dati strutturati da immagini di schede di allenamento in palestra.
Analizza l'immagine fornita (può essere una screenshot di un'app, una foto di un foglio, un PDF, o un SVG) ed estrai:
- nome della scheda (se visibile, altrimenti proponi "Scheda")
- durata in settimane (se visibile, default 4)
- lista degli esercizi, ognuno con:
  - nome (es. "Panca piana", "Squat", "Lat machine")
  - giorno della settimana (1=Lunedì, 2=Martedì, 3=Mercoledì, 4=Giovedì, 5=Venerdì, 6=Sabato, 7=Domenica). Se vedi "Giorno A/B/C" senza giorno specifico, usa 1,2,3 rispettivamente.
  - serie (numero)
  - ripetizioni (stringa, es. "8-12", "10", "5+5", "30 sec")
  - recupero in secondi (default 90 se non specificato)
  - note (tecnica, tempo, etc.)

Rispondi SOLO con un JSON valido nel formato:
{
  "name": "string",
  "description": "string (opzionale)",
  "durationWeeks": number,
  "exercises": [
    {
      "name": "string",
      "dayOfWeek": number,
      "sets": number,
      "reps": "string",
      "restSec": number,
      "notes": "string (opzionale)"
    }
  ]
}

Non aggiungere testo prima o dopo il JSON. Non usare markdown code fences.`;

export async function extractSchedaFromImage(base64Image: string, mimeType: string): Promise<ExtractedScheda> {
  const zai = await ZAI.create();

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: SYSTEM_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Estrai il JSON dalla risposta (anche se avvolto in code fences)
  let jsonStr = content.trim();
  
  // Rimuovi code fences markdown se presenti
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }
  
  // Prova a trovare JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Validazione e sanitizzazione
    return {
      name: String(parsed.name || 'Scheda estratta'),
      description: parsed.description ? String(parsed.description) : undefined,
      durationWeeks: Math.min(Math.max(parseInt(parsed.durationWeeks) || 4, 1), 52),
      exercises: Array.isArray(parsed.exercises)
        ? parsed.exercises.map((ex: any, idx: number) => ({
            name: String(ex.name || `Esercizio ${idx + 1}`),
            dayOfWeek: Math.min(Math.max(parseInt(ex.dayOfWeek) || 1, 1), 7),
            sets: Math.min(Math.max(parseInt(ex.sets) || 4, 1), 20),
            reps: String(ex.reps || '8-12'),
            restSec: Math.min(Math.max(parseInt(ex.restSec) || 90, 0), 600),
            notes: ex.notes ? String(ex.notes) : undefined,
          }))
        : [],
    };
  } catch (e) {
    throw new Error(`Impossibile parsare la risposta AI: ${content.slice(0, 200)}`);
  }
}
