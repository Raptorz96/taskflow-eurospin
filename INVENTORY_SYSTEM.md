# Sistema di Gestione Inventario - TaskFlow Eurospin

## 📦 Panoramica

Il sistema di gestione inventario di TaskFlow Eurospin offre un controllo completo delle rimanenze di magazzino con funzionalità avanzate di monitoraggio, alert intelligenti e integrazione con il sistema di foto capture.

## 🌟 Funzionalità Principali

### 1. **Dashboard Inventario**
- **Visualizzazione per Reparto**: Inventario filtrato per reparto dell'utente
- **Statistiche in Tempo Reale**: Totali, OK, Bassi, Critici, Esauriti
- **Ricerca Rapida**: Cerca per nome, codice o EAN
- **Filtri Avanzati**: Per stato scorte e categoria

### 2. **Gestione Prodotti**
- **Card Interattive**: Ogni prodotto ha una card dedicata con informazioni complete
- **Quick Actions**: Pulsanti rapidi +1, +10, -1, -10, input personalizzato
- **Indicatori Visivi**: Barre colorate per stato scorte
- **Storico Movimenti**: Visualizza ultimi 10 movimenti con dettagli

### 3. **Sistema di Alert Intelligenti**
- **Alert Automatici**: Notifiche quando sotto soglia minima
- **Classificazione**: Zero stock, Critico, Basso, Non aggiornato
- **Notifiche Push**: Sistema di notifiche browser native
- **Riepilogo Giornaliero**: Notifica mattutina alle 7:00 con situazione critica

### 4. **Integrazione con Foto**
- **Riconoscimento OCR**: Analisi automatica foto prodotti
- **Matching Intelligente**: Suggerimenti prodotti basati su foto
- **Update Rimanenze**: Aggiornamento quantità diretto da foto ripasso
- **Creazione Automatica**: Nuovi prodotti da foto con dati estratti

### 5. **Trend e Analytics**
- **Sparkline**: Grafici 7 giorni per trend rimanenze
- **Consumo Medio**: Calcolo automatico consumo giornaliero
- **Giorni Copertura**: Stima giorni rimanenti basata su consumo
- **Valore Inventario**: Calcolo valore totale per reparto

## 🗄️ Struttura Database

### Tabelle Principali

#### `products`
```sql
- id (UUID): Identificativo univoco
- nome (TEXT): Nome prodotto
- codice (TEXT): Codice prodotto interno
- codice_ean (TEXT): Codice a barre
- reparto (TEXT): Reparto di appartenenza
- categoria (TEXT): Categoria prodotto
- soglia_minima (INT): Soglia minima scorte
- soglia_critica (INT): Soglia critica
- unita_misura (TEXT): Unità di misura (pz, kg, lt, etc.)
- prezzo_ultimo (NUMERIC): Ultimo prezzo registrato
- photo_url (TEXT): URL foto prodotto
```

#### `inventory`
```sql
- id (UUID): Identificativo univoco
- product_id (UUID): Riferimento prodotto
- quantita (INT): Quantità attuale
- valore_totale (NUMERIC): Valore totale inventario
- consumo_medio_giornaliero (NUMERIC): Consumo medio calcolato
- giorni_copertura (INT): Giorni copertura stimati
- updated_at (TIMESTAMP): Ultimo aggiornamento
- updated_by (UUID): Utente che ha aggiornato
```

#### `stock_movements`
```sql
- id (UUID): Identificativo univoco
- product_id (UUID): Riferimento prodotto
- tipo (TEXT): Tipo movimento (carico, scarico, vendita, ripasso, etc.)
- quantita_precedente (INT): Quantità prima del movimento
- quantita (INT): Variazione quantità
- quantita_finale (INT): Quantità dopo movimento
- prezzo_unitario (NUMERIC): Prezzo unitario
- note (TEXT): Note movimento
- created_by (UUID): Utente creatore
- created_at (TIMESTAMP): Data movimento
```

#### `inventory_alerts`
```sql
- id (UUID): Identificativo univoco
- product_id (UUID): Riferimento prodotto
- alert_type (TEXT): Tipo alert (sotto_soglia, critico, zero_stock, etc.)
- is_read (BOOL): Flag lettura
- acknowledged_by (UUID): Utente che ha confermato
- acknowledged_at (TIMESTAMP): Data conferma
```

## 🎛️ Componenti UI

### 1. **InventoryManager** (`src/components/InventoryManager.jsx`)
Dashboard principale inventario con:
- Header con statistiche riassuntive
- Filtri e ricerca
- Lista prodotti con StockCard
- Gestione alert critici

### 2. **StockCard** (`src/components/StockCard.jsx`)
Card interattiva singolo prodotto con:
- Informazioni prodotto
- Indicatori stato scorte
- Quick actions per aggiustamenti
- Sparkline trend 7 giorni
- Storico movimenti

### 3. **Integrazione Camera**
Aggiornamento `QuickCameraInput.jsx`:
- Suggerimenti prodotti da OCR
- Matching intelligente prodotti esistenti
- Quick update rimanenze da ripasso
- Creazione nuovi prodotti

## 📱 Navigation Update

### Nuova Tab "Magazzino"
- **Posizione**: Terza tab in BottomNav
- **Icona**: Package di lucide-react
- **Badge**: Numero alert non letti
- **Colore**: Indigo (#4F46E5)

## 🔔 Sistema Notifiche

### Notifiche Push Browser
```javascript
// Tipi di notifica
- low_stock: Scorte basse
- zero_stock: Prodotto esaurito  
- daily_summary: Riepilogo giornaliero
- outdated_inventory: Inventario non aggiornato
```

### Programmazione Automatica
- **Riepilogo Giornaliero**: 7:00 AM ogni giorno
- **Check Scadenze Ordini**: Ogni 30 minuti durante orari lavorativi
- **Cleanup Alert**: Rimozione automatica alert risolti

## 🚀 Performance & Caching

### Sistema Cache Locale
```javascript
// Cache specializzate per tipo di dato
- inventoryCache: 2 minuti
- productsCache: 10 minuti  
- alertsCache: 1 minuto
- tasksCache: 30 secondi
```

### Funzionalità Offline
- **Cache Strategy**: Cache-first con fallback network
- **Dati Expirati**: Utilizzo dati scaduti quando offline
- **Sync Automatico**: Sincronizzazione quando torna online

## 🎯 Workflow Tipico

### 1. **Ripasso Mattutino**
1. Accedi tab Magazzino
2. Visualizza alert critici
3. Usa camera per prodotti da ripassare
4. Sistema suggerisce prodotti esistenti
5. Aggiorna quantità direttamente da foto
6. Crea task se necessario

### 2. **Controllo Periodico**
1. Monitora badge alert su tab
2. Filtra per prodotti critici/bassi
3. Usa quick actions per aggiustamenti
4. Visualizza trend per decisioni acquisto

### 3. **Gestione Nuovi Prodotti**
1. Foto prodotto non riconosciuto
2. Sistema estrae dati OCR
3. Compila automaticamente form
4. Conferma e salva nuovo prodotto
5. Inizializza inventario

## 📊 Metriche e Analytics

### KPI Principali
- **Stock Turn**: Rotazione scorte per categoria
- **Hit Rate Cache**: Efficienza sistema cache  
- **Alert Resolution Time**: Tempo risoluzione alert
- **Accuracy OCR**: Precisione riconoscimento prodotti

### Dashboard Metriche
- Valore inventario per reparto
- Trend consumo settimanale
- Top prodotti per rotazione
- Efficienza operativa

## 🔧 Configurazione

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Setup
1. Eseguire script `supabase_schema.sql`
2. Creare bucket storage `task-photos`
3. Configurare RLS policies
4. Importare dati prodotti iniziali

### Browser Permissions
- **Camera Access**: Per foto prodotti
- **Notifications**: Per alert sistema
- **Local Storage**: Per cache e preferences

## 🚨 Troubleshooting

### Problemi Comuni

**Cache Non Funziona**
```javascript
// Pulire cache manualmente
import { inventoryCache } from './utils/cache'
inventoryCache.clear()
```

**Alert Non Arrivano**
```javascript
// Controllare permessi notifiche
navigator.permissions.query({name: 'notifications'})
```

**OCR Non Preciso**
- Migliorare illuminazione foto
- Inquadrare solo testo prodotto  
- Verificare lingua italiana Tesseract

**Performance Lenta**
```javascript
// Verificare cache metrics
import { CacheMetrics } from './utils/cache'
console.log(CacheMetrics.getHitRate())
```

## 🔄 Aggiornamenti Futuri

### Roadmap
- [ ] **AI Predittivo**: Machine learning per previsione fabbisogni
- [ ] **Integrazione ERP**: Sync con sistemi gestionali esistenti
- [ ] **Barcode Scanner**: Lettore codici a barre nativo
- [ ] **Multi-Store**: Gestione multi-punto vendita
- [ ] **Analytics Avanzate**: Dashboard business intelligence
- [ ] **Mobile App**: App nativa iOS/Android

### API Extensions
- Endpoint REST per integrazioni esterne
- Webhook per sincronizzazione real-time
- GraphQL per query complesse
- Bulk operations per import/export

## 📚 Documentazione Tecnica

### File Principali
```
src/
├── components/
│   ├── InventoryManager.jsx     # Dashboard principale
│   ├── StockCard.jsx           # Card prodotto interattiva  
│   └── QuickCameraInput.jsx    # Integrazione camera
├── utils/
│   ├── notifications.js        # Sistema notifiche
│   └── cache.js                # Caching locale
└── lib/
    └── supabase.js             # Funzioni database
```

### API Functions
- `getInventoryByDepartment()`: Lista inventario per reparto
- `createStockMovement()`: Crea movimento scorte
- `getInventoryAlerts()`: Recupera alert attivi
- `searchProducts()`: Ricerca prodotti
- `calculateConsumption()`: Calcola consumo medio

Il sistema è progettato per scalare e adattarsi alle esigenze specifiche di ogni punto vendita Eurospin, garantendo efficienza operativa e controllo completo delle rimanenze.