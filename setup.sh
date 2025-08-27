#!/bin/bash

# TaskFlow Eurospin Setup Script
echo "🚀 TaskFlow Eurospin - Setup Automatico"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installa Node.js 18+ e riprova."
    echo "   Download: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js versione $NODE_VERSION trovata. Raccomandato: 18+"
    echo "   L'app funzionerà comunque, ma considera un upgrade."
fi

echo "✅ Node.js $(node -v) trovato"

# Install dependencies
echo ""
echo "📦 Installazione dipendenze..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Installazione fallita. Controlla gli errori sopra."
    exit 1
fi

echo "✅ Dipendenze installate"

# Check if .env exists
echo ""
echo "🔧 Configurazione environment..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "⚠️  File .env creato da template."
        echo "   IMPORTANTE: Modifica .env con le tue credenziali Supabase!"
        echo ""
        echo "   1. Vai su https://supabase.com"
        echo "   2. Crea nuovo progetto"  
        echo "   3. Copia URL e ANON_KEY in .env"
        echo "   4. Importa supabase_schema.sql nel SQL Editor"
    else
        echo "❌ File .env.example non trovato. Crea manualmente .env"
        exit 1
    fi
else
    echo "✅ File .env già presente"
fi

# Check if PWA icons exist (and are not placeholders)
echo ""
echo "🖼️  Controllo PWA icons..."
if [ -f "public/icon-192.png" ] && [ -f "public/icon-512.png" ]; then
    # Check if they're placeholder files (contain text instead of being actual images)
    if grep -q "placeholder" "public/icon-192.png" 2>/dev/null; then
        echo "⚠️  PWA icons sono placeholder. Sostituisci con icone PNG reali:"
        echo "   - public/icon-192.png (192x192 pixels)"
        echo "   - public/icon-512.png (512x512 pixels)"
        echo "   Raccomandato: sfondo blu Eurospin (#0066CC) con logo/iniziali"
    else
        echo "✅ PWA icons presenti"
    fi
else
    echo "❌ PWA icons mancanti. Crea:"
    echo "   - public/icon-192.png (192x192 pixels)"
    echo "   - public/icon-512.png (512x512 pixels)"
fi

echo ""
echo "🎉 Setup completato!"
echo ""
echo "📋 Prossimi passi:"
echo "   1. Configura Supabase (vedi SETUP_GUIDE.md)"
echo "   2. Modifica .env con le tue credenziali"  
echo "   3. Avvia: npm run dev"
echo "   4. Build produzione: npm run build"
echo ""
echo "📖 Guida completa: SETUP_GUIDE.md"
echo "🚀 Avvia ora: npm run dev"