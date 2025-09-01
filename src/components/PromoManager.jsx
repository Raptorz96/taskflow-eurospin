import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, AlertCircle, Check, X } from 'lucide-react';

export default function PromoManager() {
  const [promozioni, setPromozioni] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState(null);

  const [formData, setFormData] = useState({
    nome_promo: '',
    data_inizio: '',
    data_fine: '',
    corsie: [],
    stato: 'preparazione'
  });

  const corsieDisponibili = [
    'Corsia 1', 'Corsia 2', 'Corsia 3', 'Corsia 4', 'Corsia 5',
    'Corsia 6', 'Corsia 7', 'Corsia 8', 'Banco Freddo', 'Banco Caldo',
    'Ortofrutta', 'Macelleria', 'Panetteria'
  ];

  useEffect(() => {
    caricaPromozioni();
  }, []);

  const caricaPromozioni = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_config')
        .select('*')
        .order('data_inizio', { ascending: true });

      if (error) throw error;
      setPromozioni(data || []);
    } catch (error) {
      console.error('Errore nel caricamento promozioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvaPromozione = async (e) => {
    e.preventDefault();
    try {
      const promoData = {
        ...formData,
        corsie: formData.corsie.length > 0 ? formData.corsie : null
      };

      let error;
      if (editingPromo) {
        ({ error } = await supabase
          .from('promo_config')
          .update(promoData)
          .eq('id', editingPromo.id));
      } else {
        ({ error } = await supabase
          .from('promo_config')
          .insert([promoData]));
      }

      if (error) throw error;

      await caricaPromozioni();
      resetForm();
    } catch (error) {
      console.error('Errore nel salvare la promozione:', error);
      alert('Errore nel salvare la promozione');
    }
  };

  const eliminaPromozione = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa promozione?')) return;

    try {
      const { error } = await supabase
        .from('promo_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await caricaPromozioni();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione della promozione');
    }
  };

  const cambiaStato = async (id, nuovoStato) => {
    try {
      const { error } = await supabase
        .from('promo_config')
        .update({ stato: nuovoStato })
        .eq('id', id);

      if (error) throw error;
      await caricaPromozioni();
    } catch (error) {
      console.error('Errore nel cambio stato:', error);
      alert('Errore nel cambio stato');
    }
  };

  const creaTaskCambioPromo = async (promo, tipo) => {
    try {
      const dataTask = tipo === 'rimozione' 
        ? new Date(new Date(promo.data_inizio).getTime() - 24 * 60 * 60 * 1000) // giorno prima
        : new Date(promo.data_inizio); // giorno stesso

      const { error } = await supabase
        .from('tasks')
        .insert([{
          titolo: tipo === 'rimozione' 
            ? `Togliere promo: ${promo.nome_promo}`
            : `Applicare promo: ${promo.nome_promo}`,
          descrizione: `${tipo === 'rimozione' ? 'Rimuovere' : 'Applicare'} promozione nelle corsie: ${promo.corsie?.join(', ') || 'tutte'}`,
          priorita: 5,
          tempo_stimato: 90,
          reparto: 'magazzino',
          fascia_oraria: tipo === 'rimozione' ? 'sera' : 'mattina',
          data_scadenza: new Date(dataTask.setHours(tipo === 'rimozione' ? 20 : 8, 0, 0, 0)).toISOString(),
          creato_da: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      alert(`Task per ${tipo} promo creato con successo!`);
    } catch (error) {
      console.error('Errore nella creazione task:', error);
      alert('Errore nella creazione del task');
    }
  };

  const resetForm = () => {
    setFormData({
      nome_promo: '',
      data_inizio: '',
      data_fine: '',
      corsie: [],
      stato: 'preparazione'
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  const modificaPromozione = (promo) => {
    setFormData({
      nome_promo: promo.nome_promo,
      data_inizio: promo.data_inizio,
      data_fine: promo.data_fine,
      corsie: promo.corsie || [],
      stato: promo.stato
    });
    setEditingPromo(promo);
    setShowForm(true);
  };

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'preparazione': return 'bg-yellow-100 text-yellow-800';
      case 'attiva': return 'bg-green-100 text-green-800';
      case 'completata': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgenza = (dataInizio, stato) => {
    const oggi = new Date();
    const inizio = new Date(dataInizio);
    const diffGiorni = Math.ceil((inizio - oggi) / (1000 * 60 * 60 * 24));
    
    if (stato === 'attiva' && diffGiorni <= 0) return { text: 'In corso', color: 'text-green-600' };
    if (diffGiorni <= 1 && stato !== 'completata') return { text: 'Urgente', color: 'text-red-600' };
    if (diffGiorni <= 3 && stato !== 'completata') return { text: 'Prossima', color: 'text-orange-600' };
    return { text: 'Pianificata', color: 'text-blue-600' };
  };

  if (loading) {
    return <div className="flex justify-center p-8">Caricamento promozioni...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestione Promozioni
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Annulla' : '+ Nuova Promozione'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium mb-4">
            {editingPromo ? 'Modifica Promozione' : 'Nuova Promozione'}
          </h3>
          <form onSubmit={salvaPromozione} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Promozione
                </label>
                <input
                  type="text"
                  value={formData.nome_promo}
                  onChange={(e) => setFormData({...formData, nome_promo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={formData.stato}
                  onChange={(e) => setFormData({...formData, stato: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="preparazione">Preparazione</option>
                  <option value="attiva">Attiva</option>
                  <option value="completata">Completata</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inizio
                </label>
                <input
                  type="date"
                  value={formData.data_inizio}
                  onChange={(e) => setFormData({...formData, data_inizio: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fine
                </label>
                <input
                  type="date"
                  value={formData.data_fine}
                  onChange={(e) => setFormData({...formData, data_fine: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corsie Interessate
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {corsieDisponibili.map((corsia) => (
                  <label key={corsia} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.corsie.includes(corsia)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, corsie: [...formData.corsie, corsia]});
                        } else {
                          setFormData({...formData, corsie: formData.corsie.filter(c => c !== corsia)});
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{corsia}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPromo ? 'Aggiorna' : 'Salva'} Promozione
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {promozioni.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessuna promozione configurata
          </div>
        ) : (
          promozioni.map((promo) => {
            const urgenza = getUrgenza(promo.data_inizio, promo.stato);
            return (
              <div key={promo.id} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {promo.nome_promo}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatoColor(promo.stato)}`}>
                        {promo.stato}
                      </span>
                      <span className={`text-sm font-medium ${urgenza.color}`}>
                        {urgenza.text}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(promo.data_inizio).toLocaleDateString('it-IT')} - {new Date(promo.data_fine).toLocaleDateString('it-IT')}
                      </div>
                      {promo.corsie && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {promo.corsie.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => modificaPromozione(promo)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => eliminaPromozione(promo.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {promo.stato === 'preparazione' && (
                    <>
                      <button
                        onClick={() => creaTaskCambioPromo(promo, 'rimozione')}
                        className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        Task Rimozione
                      </button>
                      <button
                        onClick={() => creaTaskCambioPromo(promo, 'applicazione')}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Task Applicazione
                      </button>
                      <button
                        onClick={() => cambiaStato(promo.id, 'attiva')}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Attiva
                      </button>
                    </>
                  )}
                  {promo.stato === 'attiva' && (
                    <button
                      onClick={() => cambiaStato(promo.id, 'completata')}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Completa
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}