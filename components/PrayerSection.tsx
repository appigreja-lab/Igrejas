
import React, { useState, useEffect } from 'react';
import { PrayerRequest } from '../types';

interface PrayerSectionProps {
  prayers: PrayerRequest[];
  onAddPrayer: (request: Partial<PrayerRequest>) => void;
  onIntercede: (id: string) => void;
  onMarkAsAnswered: (id: string, testimony?: string) => void;
}

interface AmenAnimation {
  id: number;
  x: number;
  y: number;
  text?: string;
  emoji?: string;
}

const PrayerSection: React.FC<PrayerSectionProps> = ({ prayers, onAddPrayer, onIntercede, onMarkAsAnswered }) => {
  const [newRequest, setNewRequest] = useState('');
  const [newCategory, setNewCategory] = useState<PrayerRequest['category']>('espiritual');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'testimony' | 'urgent' | 'my' | 'waiting'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showTestimonyForm, setShowTestimonyForm] = useState<string | null>(null);
  const [selectedPrayerForView, setSelectedPrayerForView] = useState<PrayerRequest | null>(null);
  const [testimonyText, setTestimonyText] = useState('');
  const [amenAnimations, setAmenAnimations] = useState<AmenAnimation[]>([]);
  const [glowingCardId, setGlowingCardId] = useState<string | null>(null);

  const categories = [
    { id: 'espiritual', label: 'Espiritual', icon: '🔥', color: 'bg-purple-100 text-purple-600' },
    { id: 'saúde', label: 'Saúde', icon: '🏥', color: 'bg-red-100 text-red-600' },
    { id: 'família', label: 'Família', icon: '🏠', color: 'bg-blue-100 text-blue-600' },
    { id: 'finanças', label: 'Finanças', icon: '💰', color: 'bg-green-100 text-green-600' },
    { id: 'outros', label: 'Outros', icon: '✨', color: 'bg-gray-100 text-gray-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRequest.trim()) {
      onAddPrayer({
        request: newRequest.trim(),
        category: newCategory,
        isUrgent,
        isAnonymous
      });
      setNewRequest('');
      setIsUrgent(false);
      setIsAnonymous(false);
      setShowForm(false);
    }
  };

  const handleIntercedeWithAnimation = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    let clientX, clientY;
    if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    }

    const messages = ['Amém!', 'Glória!', 'Fé!', 'Unidos!', 'Oração enviada!'];
    const emojis = ['🙏', '🙌', '✨', '🔥', '💖', '🕊️'];
    
    const newAnim = {
      id: Date.now(),
      x: clientX - 20,
      y: clientY - 40,
      text: messages[Math.floor(Math.random() * messages.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    };

    setAmenAnimations(prev => [...prev, newAnim]);
    setGlowingCardId(id);
    
    setTimeout(() => {
      setAmenAnimations(prev => prev.filter(a => a.id !== newAnim.id));
    }, 1500);

    setTimeout(() => {
      setGlowingCardId(null);
    }, 2000);

    onIntercede(id);
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]);
  };

  const handleTestimonySubmit = (id: string) => {
    onMarkAsAnswered(id, testimonyText.trim());
    setTestimonyText('');
    setShowTestimonyForm(null);
    setSelectedPrayerForView(null);
  };

  const filteredPrayers = prayers.filter(p => {
    const matchesCategory = activeCategoryFilter === 'all' || p.category === activeCategoryFilter;
    
    let matchesTab = false;
    switch (activeTab) {
      case 'all': matchesTab = !p.isAnswered; break;
      case 'testimony': matchesTab = !!p.isAnswered; break;
      case 'urgent': matchesTab = !!p.isUrgent && !p.isAnswered; break;
      case 'my': matchesTab = !!p.isIntercededByMe && !p.isAnswered; break;
      case 'waiting': matchesTab = p.intercessorsCount === 0 && !p.isAnswered; break;
    }
    
    return matchesTab && matchesCategory;
  }).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      {/* Header com Filtros */}
      <div className="p-6 bg-blue-900 text-white shadow-xl z-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Líder de Oração</h2>
          <div className="flex gap-1.5">
             <button onClick={() => setActiveTab('urgent')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeTab === 'urgent' ? 'bg-red-500 scale-110 shadow-lg' : 'bg-white/10'}`} title="Urgentes">🚨</button>
             <button onClick={() => setActiveTab('waiting')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeTab === 'waiting' ? 'bg-yellow-500 scale-110 shadow-lg' : 'bg-white/10'}`} title="Aguardando Oração">⏳</button>
             <button onClick={() => setActiveTab('my')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeTab === 'my' ? 'bg-blue-500 scale-110 shadow-lg' : 'bg-white/10'}`} title="Minhas Intercessões">👤</button>
             <button onClick={() => setActiveTab('testimony')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${activeTab === 'testimony' ? 'bg-orange-500 scale-110 shadow-lg' : 'bg-white/10'}`} title="Testemunhos">⭐</button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
           <button 
             onClick={() => { setActiveTab('all'); setActiveCategoryFilter('all'); }}
             className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' && activeCategoryFilter === 'all' ? 'bg-white text-blue-900' : 'bg-blue-800/40 text-blue-200'}`}
           >
             Geral
           </button>
           {categories.map(cat => (
             <button 
               key={cat.id}
               onClick={() => { 
                 if (activeTab === 'testimony') setActiveTab('all');
                 setActiveCategoryFilter(cat.id); 
               }}
               className={`px-5 py-2.5 flex-shrink-0 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeCategoryFilter === cat.id ? 'bg-white text-blue-900' : 'bg-blue-800/40 text-blue-200'}`}
             >
               <span>{cat.icon}</span> {cat.label}
             </button>
           ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32">
        {filteredPrayers.length === 0 ? (
          <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
            <span className="text-6xl">
              {activeTab === 'testimony' ? '🏆' : 
               activeTab === 'my' ? '👤' : 
               activeTab === 'waiting' ? '✨' : '🙏'}
            </span>
            <p className="font-black uppercase text-xs tracking-widest">
              {activeTab === 'my' ? 'Você ainda não intercedeu por nenhum pedido' : 
               activeTab === 'waiting' ? 'Glória a Deus! Todos os pedidos têm intercessores' : 
               'Nada por aqui no momento'}
            </p>
          </div>
        ) : (
          filteredPrayers.map((prayer) => (
            <div 
              key={prayer.id} 
              onClick={() => setSelectedPrayerForView(prayer)}
              className={`relative bg-white rounded-[32px] p-5 shadow-sm border transition-all hover:shadow-md cursor-pointer active:scale-[0.98] ${
                prayer.isUrgent ? 'border-red-200 ring-2 ring-red-50' : 'border-blue-50'
              } ${prayer.isAnswered ? 'bg-orange-50/30 border-orange-100' : ''} ${
                glowingCardId === prayer.id ? 'animate-celestial-glow border-orange-300 ring-4 ring-orange-100/50' : ''
              }`}
            >
              {prayer.isAnswered && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-black px-4 py-1 rounded-full shadow-lg uppercase tracking-tighter z-10">
                  Vitória & Testemunho
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${categories.find(c => c.id === prayer.category)?.color || 'bg-gray-100'}`}>
                    {prayer.isAnonymous ? '👤' : (prayer.userName.charAt(0))}
                  </div>
                  <div>
                    <p className="font-black text-sm text-blue-900 leading-tight">
                      {prayer.isAnonymous ? 'Irmão(ã) em Cristo' : prayer.userName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(prayer.timestamp).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                      <span className="text-[9px] font-black text-blue-400 uppercase">{prayer.category}</span>
                    </div>
                  </div>
                </div>
                {prayer.isUrgent && !prayer.isAnswered && (
                  <span className="text-[8px] font-black bg-red-500 text-white px-2 py-1 rounded-lg uppercase animate-pulse">Urgente</span>
                )}
              </div>
              
              <div className="bg-slate-50/50 p-4 rounded-2xl mb-4 border border-blue-50/50">
                <p className="text-gray-700 text-sm leading-relaxed italic line-clamp-3">"{prayer.request}"</p>
                {prayer.isAnswered && prayer.testimony && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-[10px] font-black text-orange-500 uppercase mb-1">Resposta do Pai:</p>
                    <p className="text-xs text-orange-900 font-medium line-clamp-2">{prayer.testimony}</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {prayer.intercessorsCount > 0 ? (
                      [...Array(Math.min(3, prayer.intercessorsCount))].map((_, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] ${glowingCardId === prayer.id ? 'animate-bounce' : ''}`}>🙏</div>
                      ))
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">?</div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${prayer.intercessorsCount === 0 ? 'text-orange-400' : 'text-blue-600'} ${glowingCardId === prayer.id ? 'scale-110 font-black' : ''}`}>
                    {prayer.intercessorsCount === 0 ? 'Seja o primeiro a orar' : `${prayer.intercessorsCount} Intercedendo`}
                  </span>
                </div>
                {prayer.isIntercededByMe && !prayer.isAnswered && (
                  <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg uppercase">Já Intercedi</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      {!showForm && !selectedPrayerForView && (
        <button 
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-blue-700 transition-all active:scale-95 z-30 ring-8 ring-blue-50"
        >
          +
        </button>
      )}

      {/* Amen Floating Animations */}
      {amenAnimations.map(anim => (
        <div 
          key={anim.id}
          className="fixed pointer-events-none z-[200] flex flex-col items-center gap-1 animate-float-up"
          style={{ left: anim.x, top: anim.y }}
        >
          <span className="text-3xl drop-shadow-lg">{anim.emoji}</span>
          <span className="text-[10px] font-black bg-white/90 text-blue-900 px-2 py-0.5 rounded-full shadow-md uppercase tracking-tighter whitespace-nowrap border border-blue-100">
            {anim.text}
          </span>
        </div>
      ))}

      {/* Modal Visualização Rápida */}
      {selectedPrayerForView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[130] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedPrayerForView(null)}>
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className={`p-8 pb-10 relative overflow-hidden ${categories.find(c => c.id === selectedPrayerForView.category)?.color || 'bg-blue-50'}`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <button 
                onClick={() => setSelectedPrayerForView(null)}
                className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-blue-900 font-bold"
              >✕</button>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-4xl shadow-xl">
                  {selectedPrayerForView.isAnonymous ? '👤' : selectedPrayerForView.userName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-blue-900">{selectedPrayerForView.isAnonymous ? 'Irmão(ã) em Cristo' : selectedPrayerForView.userName}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{new Date(selectedPrayerForView.timestamp).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-blue-900/20"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{selectedPrayerForView.category}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Pedido de Oração</p>
                <p className="text-gray-800 text-lg font-serif italic leading-relaxed text-center">
                  "{selectedPrayerForView.request}"
                </p>
              </div>

              {selectedPrayerForView.isAnswered && (
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-2 relative">
                  <span className="absolute -top-3 left-6 bg-orange-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-md uppercase">Oração Respondida!</span>
                  <p className="text-orange-900 text-sm font-medium leading-relaxed italic">
                    {selectedPrayerForView.testimony || "Gloria a Deus! Este pedido foi atendido."}
                  </p>
                </div>
              )}

              <div className="flex flex-col items-center gap-2 py-4">
                <div className="flex -space-x-2">
                  {selectedPrayerForView.intercessorsCount > 0 ? (
                    [...Array(Math.min(5, selectedPrayerForView.intercessorsCount))].map((_, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-xs ${glowingCardId === selectedPrayerForView.id ? 'animate-bounce' : ''}`}>🙏</div>
                    ))
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">?</div>
                  )}
                </div>
                <p className={`text-xs font-black text-blue-900 uppercase transition-all ${glowingCardId === selectedPrayerForView.id ? 'scale-110 text-orange-500' : ''}`}>
                  {selectedPrayerForView.intercessorsCount === 0 ? 'Aguardando o primeiro intercessor' : `${selectedPrayerForView.intercessorsCount} corações intercedendo`}
                </p>
              </div>
            </div>

            <div className="p-8 pt-0 flex flex-col gap-3">
              {!selectedPrayerForView.isAnswered ? (
                <>
                  <button 
                    onClick={(e) => handleIntercedeWithAnimation(e, selectedPrayerForView.id)}
                    className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                      selectedPrayerForView.isIntercededByMe 
                      ? 'bg-blue-50 text-blue-400 border border-blue-100 cursor-default' 
                      : 'bg-blue-600 text-white shadow-blue-100'
                    }`}
                  >
                    <span>🙏</span> {selectedPrayerForView.isIntercededByMe ? 'EU JÁ INTERCEDI' : 'INTERCEDER AGORA'}
                  </button>
                  <button 
                    onClick={() => setShowTestimonyForm(selectedPrayerForView.id)}
                    className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    ⭐ CONTAR VITÓRIA
                  </button>
                </>
              ) : (
                <button 
                   onClick={() => setSelectedPrayerForView(null)}
                   className="w-full py-5 bg-blue-900 text-white rounded-3xl font-black uppercase tracking-widest"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Pedido */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-end animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-xl text-blue-900 uppercase">Derramar o Coração</h3>
               <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Escolha a Categoria</label>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {categories.map(cat => (
                    <button 
                      key={cat.id} 
                      type="button" 
                      onClick={() => setNewCategory(cat.id as any)}
                      className={`px-4 py-3 rounded-2xl flex-shrink-0 flex items-center gap-2 text-[10px] font-black uppercase transition-all ${newCategory === cat.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sua Oração</label>
                <textarea 
                  autoFocus
                  value={newRequest}
                  onChange={(e) => setNewRequest(e.target.value)}
                  placeholder="Escreva seu motivo..."
                  className="w-full h-32 p-5 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-3xl outline-none transition-all resize-none font-medium text-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all border-2 ${isUrgent ? 'bg-red-50 border-red-500 text-red-600 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  🚨 Urgente
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all border-2 ${isAnonymous ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}
                >
                  👤 Anônimo
                </button>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all"
              >
                Lançar sobre Ele
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Testemunho */}
      {showTestimonyForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[140] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-xl font-black text-orange-500 uppercase text-center relative z-10">Contar a Vitória!</h3>
            <p className="text-xs text-gray-500 text-center font-medium">Como o Senhor respondeu à sua oração?</p>
            <textarea 
              value={testimonyText}
              onChange={(e) => setTestimonyText(e.target.value)}
              placeholder="O Senhor fez grandes coisas por nós..."
              className="w-full h-32 p-4 bg-orange-50/50 border border-orange-100 rounded-3xl outline-none focus:ring-2 focus:ring-orange-400 text-sm font-medium"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowTestimonyForm(null)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-[10px]">Cancelar</button>
              <button onClick={() => handleTestimonySubmit(showTestimonyForm)} className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Publicar Vitória</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes float-up {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.8); opacity: 0; }
        }
        .animate-float-up { animation: float-up 1.5s ease-out forwards; }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes celestial-glow {
          0% { box-shadow: 0 0 0 rgba(255, 165, 0, 0); }
          50% { box-shadow: 0 0 30px rgba(255, 165, 0, 0.5); }
          100% { box-shadow: 0 0 0 rgba(255, 165, 0, 0); }
        }
        .animate-celestial-glow { animation: celestial-glow 2s ease-in-out; }
      `}} />
    </div>
  );
};

export default PrayerSection;
