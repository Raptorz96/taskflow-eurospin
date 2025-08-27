# TaskFlow Eurospin

Sistema di gestione task per supermercato Eurospin, progettato per ottimizzare la coordinazione delle attività quotidiane del personale.

## 🚀 Caratteristiche Principali

- **Progressive Web App (PWA)** installabile su mobile e desktop
- **Sistema autenticazione** con ruoli differenziati  
- **Dashboard intelligente** con fasce orarie (Mattina/Pomeriggio/Sera)
- **Gestione task avanzata** con swipe gestures
- **8 azioni rapide** predefinite per manager
- **Task ricorrenti** automatici
- **Sistema avvisi** per scadenze prodotti
- **Design mobile-first** ottimizzato per tablet

## 🛠️ Setup Rapido

### 1. Installazione
```bash
npm install
```

### 2. Configurazione Database
1. Crea progetto su [supabase.com](https://supabase.com)
2. Aggiorna credenziali in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
3. Esegui schema SQL: `supabase_schema.sql`

### 3. Sviluppo
```bash
npm run dev  # http://localhost:5173
```

### 4. Build Produzione
```bash
npm run build
npm run preview
```

## 📱 Funzionalità

### Reparti Supportati
- 🥬 Ortofrutta (verde)
- 🥩 Macelleria (rosso) 
- 🍝 Gastronomia (giallo)
- 🥖 Panetteria (arancione)
- 📦 Magazzino (grigio)
- 💰 Casse (blu)

### Azioni Rapide (Manager)
- 🧹 Pulizie Mattina (45min)
- 🏷️ Cambio Promo (60min)
- 📅 Controllo Scadenze (30min)
- 📊 Inventario Veloce (90min)
- 📦 Riordino Scaffali (120min)
- 💰 Chiusura Casse (30min)
- 🌙 Pulizie Sera (60min)
- 🌡️ Controllo Temperature (20min)

## 🔧 Stack Tecnologico

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **PWA**: Vite PWA Plugin + Workbox  
- **Icons**: Lucide React
- **Routing**: React Router

## 📝 Setup Completo

1. **Sostituire icons PWA** in `public/` (192x192 e 512x512 px)
2. **Configurare Supabase** con schema fornito
3. **Aggiornare .env** con credenziali reali
4. **Deploy** su Netlify/Vercel o server proprio

## 🎯 Utilizzo

### Dipendenti
- Login e visualizzazione task assegnati
- Swipe gestures per completare task  
- Aggiunta commenti collaborativi
- Monitoraggio scadenze prodotti

### Manager (Responsabili/Admin)
- Tutte le funzioni dipendente +
- Azioni rapide per task comuni
- Gestione template ricorrenti
- Assegnazione task ad altri utenti

L'app è **production-ready** e ottimizzata per l'uso immediato in ambiente Eurospin!
