# Profile Analysis Feature - Setup Guide

## Overview
La funzionalità di analisi del profilo permette agli utenti di caricare documenti (CV, LinkedIn export PDF, etc.) e testo libero per ottenere un'analisi automatica tramite Claude AI che estrae informazioni strutturate come:
- Ruolo professionale
- Seniority level
- Settori di esperienza
- Skills e competenze tecniche
- Esperienze lavorative
- Educazione
- Progetti personali

## Setup

### 1. Configurare l'API Key di Anthropic

1. Ottieni una API key da [Anthropic Console](https://console.anthropic.com/)
2. Aggiungi la key al file `.env.local` (crea il file se non esiste):

```bash
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 2. Aggiornare il Database

Esegui la migrazione Prisma per aggiungere la tabella `profile_analyses`:

```bash
npm run db:push
# oppure per creare una migrazione
npm run db:migrate
```

### 3. Verificare la Directory Uploads

La directory `uploads/` è già creata e configurata nel `.gitignore`. I file caricati saranno salvati qui.

## Utilizzo

### Per gli utenti

1. Naviga alla pagina `/onboarding` (o `/[locale]/onboarding` con il tuo locale)
2. Carica uno o più documenti:
   - PDF (consigliato per LinkedIn export)
   - DOC/DOCX
   - TXT
   - Massimo 5 file, 10MB ciascuno
3. Opzionalmente, aggiungi informazioni extra nel campo di testo libero
4. Clicca "Analyze Profile" e attendi l'analisi (può richiedere 10-30 secondi)
5. I risultati saranno salvati nel database e visualizzati a schermo

### API Endpoints

#### POST `/api/analyze-profile`
Carica file e testo per l'analisi.

**Body (FormData):**
- `files`: File[] - Array di file (max 5)
- `freeText`: string (optional) - Testo libero

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "userId": "...",
    "role": "Senior Full Stack Developer",
    "seniority": "Senior",
    "sectors": ["FinTech", "E-commerce"],
    "skills": [...],
    "workExperiences": [...],
    "education": [...],
    "personalProjects": [...],
    "analysisStatus": "completed",
    ...
  }
}
```

#### GET `/api/analyze-profile`
Recupera tutte le analisi dell'utente autenticato.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

## Architettura

### File Strutturali

```
├── prisma/
│   └── schema.prisma              # Schema DB con ProfileAnalysis model
├── lib/
│   ├── anthropic.ts              # Client Claude AI e logica di analisi
│   ├── file-processing.ts        # Gestione upload e estrazione testo da PDF
│   └── validations/
│       └── profile-analysis.ts   # Zod schemas per validazione
├── app/
│   ├── api/
│   │   └── analyze-profile/
│   │       └── route.ts          # API endpoint
│   └── [locale]/(protected)/
│       └── onboarding/
│           └── page.tsx          # UI per upload e analisi
├── components/ui/
│   └── file-upload.tsx           # Componente drag-n-drop per upload
└── uploads/                      # Directory per file caricati (gitignored)
```

### Database Schema

```prisma
model ProfileAnalysis {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(...)

  // Dati analizzati
  role              String?
  seniority         String?
  sectors           String[]
  skills            Json?
  workExperiences   Json?
  education         Json?
  personalProjects  Json?
  additionalData    Json?   // Campo flessibile per info future

  // Dati originali
  uploadedFiles     String[]
  freeText          String?

  // Metadata
  analysisStatus    String   @default("pending")
  errorMessage      String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Workflow

1. **Upload**: L'utente carica file e/o testo tramite la UI
2. **Salvataggio**: I file sono salvati in `/uploads/` con naming `{userId}_{timestamp}_{filename}`
3. **Preparazione**: I file PDF sono convertiti in base64, i file di testo sono decodificati
4. **Analisi**: I documenti sono inviati direttamente a Claude API (PDF nativo supportato!)
5. **Parsing**: La risposta JSON di Claude è validata con Zod
6. **Salvataggio DB**: I dati analizzati sono salvati in PostgreSQL
7. **Display**: I risultati sono mostrati all'utente

**Nota importante**: Claude supporta nativamente la lettura di PDF, quindi non è necessario estrarre manualmente il testo. Questo rende il processo più accurato e affidabile, specialmente per PDF complessi con tabelle, formattazione, ecc.

## Personalizzazione

### Modificare i campi estratti

Per aggiungere nuovi campi all'analisi:

1. Aggiorna lo schema Zod in `lib/validations/profile-analysis.ts`:
```typescript
export const llmAnalysisOutputSchema = z.object({
  // ... campi esistenti
  newField: z.string().optional(),
});
```

2. Aggiorna il prompt in `lib/anthropic.ts` per includere il nuovo campo nell'output JSON richiesto

3. Se necessario, aggiungi una colonna al DB in `prisma/schema.prisma` oppure usa il campo `additionalData` (JSON flessibile)

### Modificare il modello Claude

In `lib/anthropic.ts`, cambia il modello:
```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-haiku-20241022", // Modello attualmente in uso
  // ...
});
```

**Modello attuale**: `claude-3-5-haiku-20241022` (più economico e veloce)

Altri modelli disponibili:
- `claude-3-5-haiku-20241022` ✓ (in uso - più economico, ottimo per task strutturati)
- `claude-3-5-sonnet-20241022` (bilanciato - più accurato per analisi complesse)
- `claude-3-opus-20240229` (più potente ma più costoso)

**Nota**: Haiku è ottimo per questo use case perché l'analisi di CV è un task ben definito con output JSON strutturato. Se noti che la qualità non è sufficiente, puoi passare a Sonnet.

### Modificare i limiti di upload

In `lib/validations/profile-analysis.ts`:
```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES = 5;
```

## Troubleshooting

### Errore "Failed to parse LLM response as valid JSON"
- Claude potrebbe non aver restituito JSON valido
- Controlla i log della console per vedere la risposta raw
- Potrebbe essere necessario migliorare il prompt per essere più specifico

### PDF non viene letto correttamente
- Assicurati che il PDF non sia corrotto
- Claude ha un limite di dimensione per i PDF (~32MB per file)
- PDF scansionati (solo immagini) potrebbero dare risultati meno accurati
- Se il PDF è molto grande, considera di dividerlo in sezioni più piccole

### File troppo grandi
- Aumenta `MAX_FILE_SIZE` se necessario
- Considera di usare storage cloud (S3, Cloudinary) per file grandi invece del filesystem locale

## Prossimi Passi

Possibili miglioramenti futuri:
- [ ] Upload diretto da URL (LinkedIn profile URL)
- [ ] Analisi incrementale (aggiornamento invece di rianalisi completa)
- [ ] Supporto per altri formati (Excel, CSV per analizzare esperienze strutturate)
- [ ] Dashboard per visualizzare e confrontare analisi multiple
- [ ] Export dei dati analizzati in formato JSON/PDF
- [ ] Migrazione a storage cloud (Uploadthing, S3, Vercel Blob)
- [ ] Processing asincrono con job queue per file molto grandi
- [ ] Supporto per immagini (screenshot di profili LinkedIn/portfolio)
- [ ] Analisi multi-lingue con auto-detection
