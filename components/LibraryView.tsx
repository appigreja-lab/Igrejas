
import React, { useState, useRef } from 'react';
import { LibraryItem } from '../types';

interface LibraryViewProps {
  items: LibraryItem[];
  onAddItem: () => void;
  onAddLink: (title: string, url: string, category: LibraryItem['category'], thumbnail?: string) => void;
  onRemoveItem: (id: string) => void;
  onShareItem: (item: LibraryItem) => void;
  onPlayMusic: (item: LibraryItem) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ items, onAddItem, onAddLink, onRemoveItem, onShareItem, onPlayMusic }) => {
  const [filter, setFilter] = useState<'all' | 'livro' | 'foto' | 'vídeo' | 'música'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<LibraryItem | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  
  // URL Form States
  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [urlThumb, setUrlThumb] = useState('');
  const [urlCat, setUrlCat] = useState<LibraryItem['category']>('livro');

  const filteredItems = items
    .filter(item => {
      // Filtro de Categoria
      const matchesFilter = filter === 'all' || item.category === filter;
      
      // Filtro de Busca
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtro de Data
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = Date.now();
        const diff = now - (item.timestamp || 0);
        const dayMs = 24 * 60 * 60 * 1000;
        
        if (dateFilter === 'today') matchesDate = diff < dayMs;
        else if (dateFilter === 'week') matchesDate = diff < dayMs * 7;
        else if (dateFilter === 'month') matchesDate = diff < dayMs * 30;
      }

      return matchesFilter && matchesSearch && matchesDate;
    })
    // Ordenar do mais recente para o mais antigo
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const categories = [
    { id: 'all', label: 'Todos', icon: '✨' },
    { id: 'livro', label: 'Livros', icon: '📚' },
    { id: 'foto', label: 'Fotos', icon: '🖼️' },
    { id: 'vídeo', label: 'Vídeos', icon: '🎬' },
    { id: 'música', label: 'Música', icon: '🎵' },
  ];

  const datePeriods = [
    { id: 'all', label: 'Qualquer data' },
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mês' },
  ];

  const formatItemDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const dayMs = 24 * 60 * 60 * 1000;
    if (diff < dayMs) return 'Hoje';
    if (diff < dayMs * 2) return 'Ontem';
    if (diff < dayMs * 7) return `Há ${Math.floor(diff/dayMs)} dias`;
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const handleDownload = async (item: LibraryItem) => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = item.category === 'livro' ? '.pdf' : item.category === 'música' ? '.mp3' : item.category === 'vídeo' ? '.mp4' : '.jpg';
      link.download = item.title.endsWith(extension) ? item.title : `${item.title}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.title;
      link.target = "_blank";
      link.click();
    }
  };

  const handleAddUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlTitle.trim() && urlValue.trim()) {
      onAddLink(urlTitle, urlValue, urlCat, urlThumb.trim() || undefined);
      setUrlTitle('');
      setUrlValue('');
      setUrlThumb('');
      setShowUrlForm(false);
      setShowAddMenu(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL copiada para a área de transferência!");
  };

  const renderItem = (item: LibraryItem) => (
    <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition">
      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onShareItem(item); }} className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] shadow-lg active:scale-90 transition">📤</button>
        <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} className="bg-green-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] shadow-lg active:scale-90 transition" title="Baixar">📥</button>
        <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} className="bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] shadow-lg active:scale-90 transition">✕</button>
      </div>
      
      <div onClick={() => item.category === 'música' ? onPlayMusic(item) : setSelectedMedia(item)} className="w-full h-44 relative bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden">
        {item.thumbnail ? (
          <div className="w-full h-full relative group">
            <img src={item.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.title} />
            {item.category === 'vídeo' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20"><span className="text-3xl drop-shadow-lg">▶️</span></div>
            )}
          </div>
        ) : item.category === 'foto' ? (
          <img src={item.url} className="w-full h-full object-cover" alt={item.title} />
        ) : item.category === 'música' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><span className="text-3xl text-blue-600">🎵</span></div>
            <span className="text-[10px] font-black text-blue-400 animate-pulse uppercase">Ouvir</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-6xl">📄</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">PDF / DOC</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest">
          {formatItemDate(item.timestamp)}
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-xs truncate text-gray-800">{item.title}</p>
        <span className="text-[10px] text-blue-500 uppercase font-bold">{categories.find(c => c.id === item.category)?.label}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-6 bg-blue-900 text-white shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Biblioteca</h2>
          <button onClick={() => setShowAddMenu(true)} className="bg-orange-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl font-bold hover:bg-orange-600 transition active:scale-95">+</button>
        </div>
        
        <div className="mb-4 relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar na biblioteca..." className="w-full p-3 pl-10 bg-blue-800/50 text-white placeholder-blue-300 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm border-none" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300">🔍</span>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setFilter(cat.id as any)} className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase transition flex items-center gap-1.5 ${filter === cat.id ? 'bg-white text-blue-900 shadow-md' : 'bg-blue-800/50 text-blue-100 hover:bg-blue-800'}`}>
                <span>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {datePeriods.map(period => (
              <button key={period.id} onClick={() => setDateFilter(period.id as any)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition border ${dateFilter === period.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-blue-700 text-blue-300 hover:border-blue-500'}`}>
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center gap-4">
            <span className="text-4xl">📂</span>
            <p className="text-gray-400 font-bold uppercase text-xs">Nenhum item neste período.</p>
            <button onClick={() => {setFilter('all'); setDateFilter('all');}} className="text-blue-600 font-black text-[10px] uppercase underline">Ver tudo</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">{filteredItems.map(renderItem)}</div>
        )}
      </div>

      {showAddMenu && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end animate-fade-in" onClick={() => setShowAddMenu(false)}>
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-black text-blue-900 mb-6 text-center uppercase">Adicionar Novo Conteúdo</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={() => { onAddItem(); setShowAddMenu(false); }} className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition hover:bg-blue-100">
                <span className="text-3xl">📁</span>
                <span className="text-xs font-black text-blue-900 uppercase">Upload Arquivo</span>
              </button>
              <button onClick={() => setShowUrlForm(true)} className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition hover:bg-orange-100">
                <span className="text-3xl">🔗</span>
                <span className="text-xs font-black text-orange-900 uppercase">Salvar URL/Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showUrlForm && (
        <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-fade-in">
          <header className="p-6 flex items-center justify-between border-b">
            <button onClick={() => setShowUrlForm(false)} className="text-gray-400 text-2xl font-bold">✕</button>
            <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Novo Conteúdo / Link</h3>
            <div className="w-8"></div>
          </header>
          <form onSubmit={handleAddUrlSubmit} className="p-6 space-y-4 overflow-y-auto pb-20">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Título do Item</label>
              <input autoFocus type="text" value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="Ex: PDF da Aula de Domingo" className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Endereço URL do Arquivo</label>
              <input type="text" value={urlValue} onChange={e => setUrlValue(e.target.value)} placeholder="https://exemplo.com/documento.pdf" className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">URL da Capa / Thumbnail (Opcional)</label>
              <input type="text" value={urlThumb} onChange={e => setUrlThumb(e.target.value)} placeholder="https://exemplo.com/capa.jpg" className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-mono text-xs" />
              <p className="text-[9px] text-gray-400 italic">Dica: Use um link de imagem para representar este livro na galeria.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Categoria</label>
              <div className="grid grid-cols-2 gap-2">
                {['livro', 'foto', 'vídeo', 'música'].map(c => (
                  <button key={c} type="button" onClick={() => setUrlCat(c as any)} className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${urlCat === c ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-gray-400 border-gray-100'}`}>{c === 'livro' ? 'PDF / LIVRO' : c === 'música' ? 'ÁUDIO' : c}</button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Salvar na Biblioteca</button>
          </form>
        </div>
      )}

      {selectedMedia && selectedMedia.category !== 'música' && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setSelectedMedia(null)}>
          <div className="w-full h-full flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white flex-1 mr-4">
                <p className="text-[10px] uppercase font-black text-orange-400 tracking-widest mb-1">{selectedMedia.category}</p>
                <h3 className="font-bold text-xl truncate pr-10">{selectedMedia.title}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(selectedMedia)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-xl" title="Baixar">📥</button>
                <button onClick={() => setSelectedMedia(null)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white">✕</button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
              {selectedMedia.category === 'livro' ? (
                <iframe src={selectedMedia.url} className="w-full h-full border-none pt-24" title={selectedMedia.title} />
              ) : selectedMedia.category === 'foto' ? (
                <img src={selectedMedia.url} className="max-w-full max-h-full object-contain" alt="" />
              ) : (
                <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full" />
              )}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default LibraryView;
