# Anti-Portfolio

Una piattaforma web SaaS innovativa che permette ai professionisti di testare le proprie capacità decisionali attraverso simulazioni di carriera interattive alimentate da intelligenza artificiale.

## Caratteristiche Principali

- **Analisi Profilo IA**: Carica il tuo CV e ottieni un'analisi strutturata del tuo profilo professionale utilizzando Claude AI
- **Simulazioni Interattive**: Affronta scenari aziendali realistici e prendi decisioni in contesti lavorativi simulati
- **Valutazione Dettagliata**: Ricevi feedback approfondito sulle tue capacità di leadership, comunicazione, competenze tecniche e adattabilità
- **Community Feed**: Esplora le simulazioni e i risultati di altri utenti
- **Profili Pubblici**: Condividi il tuo percorso e le tue simulazioni completate
- **Supporto Multilingua**: Disponibile in Italiano e Inglese

## Stack Tecnologico

### Frontend
- **Next.js 16** con App Router
- **React 19** con TypeScript
- **TailwindCSS 4** per lo styling
- **Framer Motion** per le animazioni
- **Radix UI** per componenti accessibili
- **next-intl** per l'internazionalizzazione

### Backend & Database
- **Next.js API Routes** con Server Actions
- **PostgreSQL 16** come database principale
- **Prisma ORM** per la gestione del database
- **Docker** per il containerizzazione dello sviluppo

### AI & Authentication
- **Anthropic Claude API** per le funzionalità AI
- **Clerk** per autenticazione e gestione utenti

## Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** 18.x o superiore
- **npm** o **yarn** o **pnpm**
- **PostgreSQL** 16 (o Docker per eseguirlo in container)
- Un account **Anthropic** per ottenere la API key di Claude
- Un account **Clerk** per configurare l'autenticazione

## Installazione

### 1. Clona il repository

```bash
git clone <repository-url>
cd anti-portfolio
```

### 2. Installa le dipendenze

```bash
npm install
# oppure
yarn install
# oppure
pnpm install
```

Questo comando installerà automaticamente tutte le dipendenze e genererà il client Prisma.

### 3. Configura le variabili d'ambiente

Crea un file `.env` nella root del progetto copiando il file `.env.example`:

```bash
cp .env.example .env
```

Configura le seguenti variabili nel file `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5436/myapp"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
CLERK_WEBHOOK_SECRET="whsec_..."

# Anthropic API
ANTHROPIC_API_KEY="sk-ant-..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: File uploads
MAX_FILE_SIZE_MB=10
MAX_FILES=5
```

#### Come ottenere le chiavi API:

**Anthropic API Key:**
1. Vai su [console.anthropic.com](https://console.anthropic.com)
2. Accedi o crea un account
3. Naviga in "API Keys"
4. Crea una nuova chiave API

**Clerk Keys:**
1. Vai su [clerk.com](https://clerk.com)
2. Crea un nuovo progetto
3. Nelle impostazioni del progetto trovi le chiavi publishable e secret
4. Configura il webhook per sincronizzare gli utenti:
   - URL webhook: `https://your-domain.com/api/webhooks/clerk`
   - Eventi da selezionare: `user.created`, `user.updated`

### 4. Avvia il database PostgreSQL

#### Opzione A: Usando Docker (consigliato per sviluppo)

```bash
docker-compose up -d
```

Questo avvierà PostgreSQL sulla porta 5436.

#### Opzione B: PostgreSQL locale

Se hai PostgreSQL già installato localmente, crea un database:

```bash
createdb myapp
```

E assicurati che il `DATABASE_URL` nel file `.env` punti alla tua istanza locale.

### 5. Configura il database

Sincronizza lo schema Prisma con il database:

```bash
npm run db:push
```

Oppure, se preferisci creare una migrazione:

```bash
npm run db:migrate
```

(Opzionale) Popola il database con dati di esempio:

```bash
npm run db:seed
```

### 6. Avvia il server di sviluppo

```bash
npm run dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000)

## Scripts Disponibili

### Sviluppo

```bash
npm run dev          # Avvia il server di sviluppo con Turbopack
npm run build        # Build di produzione
npm start            # Avvia il server di produzione
npm run type-check   # Verifica i tipi TypeScript
npm run lint         # Esegue ESLint
```

### Database (Prisma)

```bash
npm run db:push      # Sincronizza lo schema Prisma con il database
npm run db:migrate   # Crea una nuova migrazione
npm run db:studio    # Apre Prisma Studio (GUI per il database)
npm run db:seed      # Popola il database con dati di esempio
npm run db:reset     # Reset completo del database
npm run db:generate  # Genera il client Prisma
```

## Utilizzo

### 1. Registrazione e Login

Visita la homepage e clicca su "Sign Up" per creare un account tramite Clerk.

### 2. Onboarding - Analisi del Profilo

Dopo la registrazione:
1. Carica il tuo CV (formati supportati: PDF, DOC, DOCX, TXT)
2. Opzionalmente aggiungi informazioni aggiuntive nel campo di testo
3. Clicca su "Analizza Profilo"
4. Claude AI analizzerà il tuo CV ed estrarrà:
   - Ruolo professionale e livello di seniority
   - Competenze tecniche e trasversali
   - Esperienze lavorative
   - Formazione
   - Progetti personali

### 3. Dashboard

Il dashboard mostra:
- Feed pubblico con simulazioni della community
- Pulsante per avviare una nuova simulazione
- Le tue simulazioni recenti

### 4. Avvia una Simulazione

1. Clicca su "Nuova Simulazione"
2. Scegli le configurazioni (tipo di timeline, contesto, difficoltà)
3. Claude genererà uno scenario aziendale realistico
4. Interagisci con il sistema:
   - Leggi il brief iniziale
   - Conosci il team
   - Visualizza la timeline
   - Completa i task prendendo decisioni
   - Ricevi feedback in tempo reale

### 5. Risultati e Valutazione

Al completamento della simulazione:
- Visualizza la valutazione dettagliata
- Score su 4 dimensioni: Leadership, Technical, Communication, Adaptability
- Punti di forza e aree di miglioramento con esempi concreti
- Condividi i risultati nel feed pubblico

### 6. Profilo Pubblico

Il tuo profilo pubblico è accessibile da `/users/me` e mostra:
- Informazioni personali
- Simulazioni completate
- Storia del tuo percorso

## Struttura del Progetto

```
anti-portfolio/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Routing internazionalizzato
│   │   ├── (auth)/              # Gruppo route autenticazione
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (protected)/         # Gruppo route protette
│   │   │   ├── simulation/      # Player simulazione interattiva
│   │   │   ├── onboarding/      # Caricamento e analisi CV
│   │   │   └── settings/
│   │   ├── dashboard/           # Dashboard e feed
│   │   ├── simulations/         # Visualizzazione simulazioni
│   │   │   └── [id]/results/    # Risultati dettagliati
│   │   └── users/               # Profili utente
│   └── api/                     # API Routes
│       ├── analyze-profile/     # Analisi CV con Claude
│       ├── generate-scenario/   # Generazione scenari
│       ├── continue-simulation/ # Gestione conversazione
│       ├── simulations/         # CRUD simulazioni
│       └── webhooks/clerk/      # Webhook Clerk
├── components/                   # Componenti React riusabili
│   ├── ui/                      # Componenti base UI
│   ├── forms/                   # Componenti form
│   ├── simulation/              # Componenti simulazione
│   └── feed/                    # Componenti feed sociale
├── lib/                         # Utilities e librerie
│   ├── anthropic.ts             # Wrapper Claude API
│   ├── db.ts                    # Prisma client
│   ├── validations/             # Schema Zod
│   └── utils.ts
├── prisma/                      # Schema database e migrations
│   ├── schema.prisma
│   └── seed.ts
├── i18n/                        # Configurazione i18n
├── messages/                    # File traduzioni (IT/EN)
├── public/                      # Asset statici
├── uploads/                     # Storage file caricati
├── docker-compose.yml           # PostgreSQL containerizzato
├── next.config.ts               # Configurazione Next.js
├── tailwind.config.ts           # Configurazione TailwindCSS
└── tsconfig.json                # Configurazione TypeScript
```

## Modelli Database Principali

- **User**: Utenti autenticati (sincronizzati da Clerk)
- **ProfileAnalysis**: Analisi CV generata da Claude AI
- **Simulation**: Istanza di una simulazione interattiva
- **SimulationMessage**: Messaggi della conversazione AI
- **SimulationEvaluation**: Valutazione finale della performance
- **SimulationConfig**: Template configurazioni simulazioni
- **AppSettings**: Impostazioni globali dell'applicazione

Per visualizzare e gestire il database graficamente, usa:

```bash
npm run db:studio
```

## Deployment

### Vercel (Consigliato)

1. Fai il push del codice su GitHub
2. Collega il repository a Vercel
3. Configura le variabili d'ambiente nel dashboard Vercel
4. Configura un database PostgreSQL (es. Vercel Postgres, Supabase, Neon)
5. Deploy automatico ad ogni push su main

### Docker

Il progetto include già `docker-compose.yml` per PostgreSQL. Per un deploy completo:

1. Crea un `Dockerfile` per l'applicazione Next.js
2. Configura un reverse proxy (nginx)
3. Usa docker-compose per orchestrare tutti i servizi

## Prisma Studio

Per esplorare e modificare i dati del database tramite interfaccia grafica:

```bash
npm run db:studio
```

Apri [http://localhost:5555](http://localhost:5555) nel browser.

## Troubleshooting

### Errori di connessione al database

Verifica che PostgreSQL sia in esecuzione:

```bash
docker ps  # Se usi Docker
# oppure
pg_isready  # Se usi PostgreSQL locale
```

### Errori Prisma

Rigenera il client Prisma:

```bash
npm run db:generate
```

### Errori Claude API

Verifica che la `ANTHROPIC_API_KEY` sia valida e che tu abbia crediti disponibili nel tuo account Anthropic.

### Problemi con Clerk

Controlla che:
- Le chiavi API siano corrette
- Il webhook sia configurato correttamente
- Gli URL di sign-in/sign-up corrispondano alla configurazione

## Supporto

Per problemi o domande:
1. Controlla la documentazione di [Next.js](https://nextjs.org/docs)
2. Consulta la documentazione di [Prisma](https://www.prisma.io/docs)
3. Leggi la guida di [Claude API](https://docs.anthropic.com/)
4. Visita la documentazione di [Clerk](https://clerk.com/docs)

## Licenza

MIT

---

Sviluppato con Next.js, React, TypeScript e Claude AI
