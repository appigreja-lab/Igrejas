
import React, { useState, useEffect } from 'react';
import { BIBLE_BOOKS, BibleBook } from '../constants';
import { fetchBibleChapter, getCachedChapter, searchBibleVerses } from '../services/geminiService';
import { SavedVerse } from '../types';

interface BibleReaderProps {
  onNotify?: (message: string) => void;
}

const BibleReader: React.FC<BibleReaderProps> = ({ onNotify }) => {
  const [testament, setTestament] = useState<'Velho' | 'Novo'>('Novo');
  const [selectedBook, setSelectedBook] = useState<BibleBook>(BIBLE_BOOKS.find(b => b.name === 'Mateus') || BIBLE_BOOKS[39]);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<{ n: number; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookListOpen, setIsBookListOpen] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ reference: string; text: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Saved Verses State
  const [savedVerses, setSavedVerses] = useState<SavedVerse[]>(() => {
    const saved = localStorage.getItem('fu_saved_verses');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingVerse, setEditingVerse] = useState<SavedVerse | null>(null);

  useEffect(() => {
    localStorage.setItem('fu_saved_verses', JSON.stringify(savedVerses));
  }, [savedVerses]);

  const filteredBooks = BIBLE_BOOKS.filter(b => b.testament === testament);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    if (!showSavedList && !showSearch) loadChapter();
  }, [selectedBook, chapter, showSavedList, showSearch]);

  const loadChapter = async () => {
    const cached = getCachedChapter(selectedBook.name, chapter);
    if (cached) {
      setVerses(cached);
      return;
    }

    setIsLoading(true);
    const result = await fetchBibleChapter(selectedBook.name, chapter);
    setVerses(result);
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchBibleVerses(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const changeBook = (book: BibleBook) => {
    setSelectedBook(book);
    setChapter(1);
    setIsBookListOpen(false);
    setShowSearch(false);
  };

  const handleSaveVerse = (v: { n: number, text: string }) => {
    const ref = `${selectedBook.name} ${chapter}:${v.n}`;
    const alreadySaved = savedVerses.find(sv => sv.reference === ref);
    
    if (alreadySaved) {
      onNotify?.("Este versículo já está nos seus favoritos!");
      return;
    }

    const newSaved: SavedVerse = {
      id: Date.now().toString(),
      title: ref,
      reference: ref,
      text: v.text,
      book: selectedBook.name,
      chapter: chapter,
      verseNum: v.n,
      timestamp: Date.now()
    };

    setSavedVerses([newSaved, ...savedVerses]);
    onNotify?.("Versículo salvo nos favoritos!");
  };

  const saveFromSearch = (res: { reference: string, text: string }) => {
    const alreadySaved = savedVerses.find(sv => sv.reference === res.reference);
    if (alreadySaved) {
      onNotify?.("Este versículo já está nos seus favoritos!");
      return;
    }

    const newSaved: SavedVerse = {
      id: Date.now().toString(),
      title: res.reference,
      reference: res.reference,
      text: res.text,
      book: res.reference.split(' ')[0], // Simple split
      chapter: 1, // Placeholder
      verseNum: 1, // Placeholder
      timestamp: Date.now()
    };

    setSavedVerses([newSaved, ...savedVerses]);
    onNotify?.("Versículo salvo nos favoritos!");
  };

  const removeSavedVerse = (id: string) => {
    setSavedVerses(savedVerses.filter(sv => sv.id !== id));
    onNotify?.("Favorito removido.");
  };

  const updateVerseTitle = (id: string, newTitle: string) => {
    setSavedVerses(savedVerses.map(sv => sv.id === id ? { ...sv, title: newTitle } : sv));
    setEditingVerse(null);
    onNotify?.("Título atualizado!");
  };

  const goToReference = (sv: SavedVerse) => {
    const book = BIBLE_BOOKS.find(b => b.name === sv.book);
    if (book) {
      setSelectedBook(book);
      setChapter(sv.chapter);
      setShowSavedList(false);
      setShowSearch(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Top Header */}
      <div className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {!showSavedList && !showSearch ? (
              <div 
                onClick={() => setIsBookListOpen(!isBookListOpen)}
                className="flex items-center gap-2 cursor-pointer bg-blue-800 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <span className="text-xl">📖</span>
                <span className="font-bold">{selectedBook.name} {chapter}</span>
                <span className="text-xs opacity-60">▼</span>
              </div>
            ) : (
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="text-xl">{showSavedList ? '⭐' : '🔍'}</span> {showSavedList ? 'Favoritos' : 'Busca Bíblica'}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setShowSearch(true); setShowSavedList(false); }}
              className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-orange-500 text-white' : 'bg-blue-800 text-blue-100'}`}
              title="Pesquisar por tema"
            >
              🔍
            </button>
            <button 
              onClick={() => { setShowSavedList(!showSavedList); setShowSearch(false); }}
              className={`p-2 rounded-lg transition-colors ${showSavedList ? 'bg-orange-500 text-white' : 'bg-blue-800 text-blue-100'}`}
              title="Versículos Favoritos"
            >
              ⭐
            </button>
            {(showSavedList || showSearch) && (
              <button 
                onClick={() => { setShowSavedList(false); setShowSearch(false); }}
                className="p-2 bg-blue-800 text-blue-100 rounded-lg"
              >
                Ler
              </button>
            )}
          </div>
        </div>

        {isBookListOpen && !showSavedList && !showSearch && (
          <div className="absolute top-full left-0 w-full h-[60vh] bg-white text-gray-900 shadow-2xl overflow-y-auto z-50 border-t animate-slide-up">
            <div className="p-4 grid grid-cols-2 gap-2">
              {filteredBooks.map(book => (
                <button key={book.name} onClick={() => changeBook(book)} className={`text-left px-4 py-3 rounded-xl border transition ${selectedBook.name === book.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50'}`}>
                  <p className="text-sm font-bold">{book.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {!showSavedList && !showSearch && (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setChapter(num)}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${chapter === num ? 'bg-white text-blue-900' : 'bg-blue-800 text-blue-200 opacity-60'}`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {showSearch ? (
          <div className="animate-fade-in space-y-6">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Esperança, Medo, Amor..."
                className="flex-1 p-4 bg-white border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                className="bg-blue-600 text-white px-6 rounded-2xl font-bold shadow-lg active:scale-95 transition"
              >
                {isSearching ? '...' : '🔍'}
              </button>
            </div>

            <div className="space-y-4">
              {isSearching ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm italic">Buscando versículos...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm space-y-2 group">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-blue-900">{res.reference}</h4>
                      <button onClick={() => saveFromSearch(res)} className="text-xl">⭐</button>
                    </div>
                    <p className="text-sm text-gray-700 italic leading-relaxed">"{res.text}"</p>
                  </div>
                ))
              ) : searchQuery && !isSearching && (
                <p className="text-center text-gray-400 py-10">Use temas ou palavras-chave para encontrar versículos.</p>
              )}
            </div>
          </div>
        ) : showSavedList ? (
          <div className="space-y-4 animate-fade-in pb-20">
            {savedVerses.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4 text-gray-400">
                <span className="text-6xl">⭐</span>
                <p className="font-medium">Nenhum versículo salvo ainda.</p>
                <button onClick={() => setShowSavedList(false)} className="text-blue-600 font-bold underline">Voltar para a Bíblia</button>
              </div>
            ) : (
              savedVerses.map(sv => (
                <div key={sv.id} className="bg-white p-5 rounded-2xl border border-blue-50 shadow-sm space-y-3 group hover:border-blue-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      {editingVerse?.id === sv.id ? (
                        <div className="flex gap-2">
                          <input 
                            autoFocus
                            className="flex-1 border-b-2 border-blue-500 outline-none font-bold text-blue-900 p-1"
                            value={editingVerse.title}
                            onChange={(e) => setEditingVerse({...editingVerse, title: e.target.value})}
                          />
                          <button onClick={() => updateVerseTitle(sv.id, editingVerse.title)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">OK</button>
                        </div>
                      ) : (
                        <h3 className="font-black text-blue-900 text-lg group-hover:text-blue-600 transition" onClick={() => setEditingVerse(sv)}>
                          {sv.title} <span className="text-[10px] ml-1 text-gray-300">✎</span>
                        </h3>
                      )}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sv.reference}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => goToReference(sv)} className="p-2 bg-blue-50 text-blue-600 rounded-full text-xs">📖</button>
                      <button onClick={() => removeSavedVerse(sv.id)} className="p-2 bg-red-50 text-red-400 rounded-full text-xs">✕</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-blue-100 pl-4">
                    {sv.text}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="max-w-prose mx-auto space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 italic">Buscando na palavra...</p>
              </div>
            ) : verses.map(v => (
              <p 
                key={v.n} 
                className="leading-relaxed text-gray-800 text-lg cursor-pointer hover:bg-blue-50 p-2 rounded-xl transition-colors group relative"
                onClick={() => handleSaveVerse(v)}
              >
                <sup className="font-bold text-blue-600 mr-2 text-sm">{v.n}</sup>
                {v.text}
                <span className="absolute -left-8 opacity-0 group-hover:opacity-100 transition-opacity text-xl">⭐</span>
              </p>
            ))}
            <div className="h-20"></div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </div>
  );
};

export default BibleReader;
