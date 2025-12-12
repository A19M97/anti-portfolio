This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔄 Come mantenere aggiornato il tuo fork con il repository originale

Se hai forkato un repository (`repo1`) e stai sviluppando nel tuo fork (`repo2`), puoi mantenere il tuo fork sincronizzato con il repository originale seguendo questi passaggi.

---

### 🧭 1. Vai nella directory del tuo fork

```bash
cd percorso/del/tuo/repo2
```

---

### 🧩 2. Aggiungi il repository originale come *upstream*

```bash
git remote add upstream https://github.com/utente-originale/repo1.git
```

Verifica che sia stato aggiunto correttamente:

```bash
git remote -v
```

Dovresti vedere qualcosa come:

```
origin    https://github.com/tu-utente/repo2.git (fetch)
origin    https://github.com/tu-utente/repo2.git (push)
upstream  https://github.com/utente-originale/repo1.git (fetch)
upstream  https://github.com/utente-originale/repo1.git (push)
```

---

### 🔄 3. Recupera gli ultimi cambiamenti dal repository originale

```bash
git fetch upstream
```

---

### ⚙️ 4. Unisci gli aggiornamenti nel tuo branch principale

Spostati sul branch principale (ad esempio `main`):

```bash
git checkout main
```

Poi scegli una delle due opzioni:

#### 🔹 Opzione A: Merge (consigliata e più sicura)

```bash
git merge upstream/main
```

#### 🔹 Opzione B: Rebase (più pulita, ma riscrive la cronologia)

```bash
git rebase upstream/main
```

---

### 💾 5. Aggiorna il tuo fork su GitHub

```bash
git push origin main
```

---

### ✅ Riepilogo rapido

Per aggiornare periodicamente il tuo fork:

```bash
git fetch upstream
git checkout master
git merge upstream/master
git push origin master
```

---

💡 **Suggerimento:**  
Puoi creare uno script Bash per automatizzare tutto questo:

```bash
#!/bin/bash
# sync-fork.sh - Aggiorna il fork con il repository originale

git fetch upstream
git checkout master
git merge upstream/master
git push origin master

echo "✅ Fork aggiornato con successo!"
```

Rendi lo script eseguibile e lancialo ogni volta che vuoi aggiornare il tuo fork:

```bash
chmod +x sync-fork.sh
./sync-fork.sh
```

