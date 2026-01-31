
import React, { useState, useRef, useEffect } from 'react';
import { DiaryEntry } from '../types';

interface DiarySectionProps {
  entries: DiaryEntry[];
  onSaveEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const DiarySection: React.FC<DiarySectionProps> = ({ entries, onSaveEntry, onDeleteEntry }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [tempAudioData, setTempAudioData] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecorder, setShowRecorder] = useState(false);
  const [entryMode, setEntryMode] = useState<'text' | 'audio'>('text');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickEmojis = [
    '🙏', '✨', '❤️', '🕊️', '🔥', '🙌', '📜', '⛪', 
    '🌅', '🌈', '🫂', '🛡️', '⚔️', '💎', '💡', '🌱',
    '💧', '🦁', '🐑', '👑', '👣', '⚓', '🔔', '🍇'
  ];

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlobUrl(URL.createObjectURL(blob));
        const reader = new FileReader();
        reader.onloadend = () => setTempAudioData(reader.result as string);
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioBlobUrl(null);
    } catch (err) {
      alert("Permissão de microfone necessária para gravar áudio no diário.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textContent;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setTextContent(before + emoji + after);
      
      // Reset focus and selection
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
        }
      }, 0);
    } else {
      setTextContent(prev => prev + emoji);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return alert("Dê um título para sua conversa.");
    if (!tempAudioData && !textContent.trim()) return alert("Escreva algo ou grave um áudio para salvar.");
    
    const newEntry: DiaryEntry = {
      id: `diary_${Date.now()}`,
      title: title.trim(),
      audioData: tempAudioData || undefined,
      textContent: textContent.trim() || undefined,
      timestamp: Date.now(),
      duration: tempAudioData ? recordingDuration : undefined
    };

    onSaveEntry(newEntry);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTextContent('');
    setAudioBlobUrl(null);
    setTempAudioData(null);
    setRecordingDuration(0);
    setShowRecorder(false);
    setEntryMode('text');
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredEntries = entries
    .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.textContent?.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col h-full bg-[#fdfaf5] overflow-hidden relative">
      <div className="p-6 bg-[#1a237e] text-white shadow-xl">
        <h2 className="text-2xl font-serif font-bold mb-1">Conversando com Deus Pai</h2>
        <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold mb-4">Seu Diário Espiritual</p>
        
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas conversas..."
            className="w-full p-3 pl-10 bg-white/10 rounded-2xl text-sm outline-none border border-white/20 focus:bg-white/20 transition-all placeholder:text-blue-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-sm">🔍</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
            <span className="text-6xl">🖋️</span>
            <p className="font-serif italic">Nenhum registro encontrado...</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-bold text-lg text-blue-900 leading-tight">{entry.title}</h3>
                    <div className="flex gap-1">
                      {entry.audioData && <span className="text-xs">🎙️</span>}
                      {entry.textContent && <span className="text-xs">📝</span>}
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">
                    {new Date(entry.timestamp).toLocaleDateString('pt-BR')} às {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => onDeleteEntry(entry.id)} className="text-red-300 hover:text-red-500 p-1">✕</button>
              </div>
              
              {entry.textContent && (
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-orange-50 italic text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {entry.textContent}
                </div>
              )}

              {entry.audioData && (
                <div className="space-y-1">
                  <audio src={entry.audioData} controls className="w-full h-10 rounded-full" />
                  <div className="flex justify-end">
                     <span className="text-[9px] font-bold text-gray-300 italic">Duração: {formatTime(entry.duration || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!showRecorder && (
        <button 
          onClick={() => setShowRecorder(true)}
          className="fixed bottom-24 right-6 w-16 h-16 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl hover:bg-orange-600 active:scale-95 transition-all z-20"
        >
          🖋️
        </button>
      )}

      {showRecorder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-end animate-fade-in" onClick={() => !isRecording && setShowRecorder(false)}>
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up space-y-6 shadow-2xl border-t-4 border-orange-400 max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h3 className="text-xl font-serif font-black text-blue-900 uppercase tracking-tight">Nova Conversa</h3>
              <p className="text-xs text-gray-400 italic">Escreva ou grave seu coração para o Pai...</p>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título desta conversa (ex: Gratidão)"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />

              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button 
                  onClick={() => setEntryMode('text')} 
                  className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${entryMode === 'text' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-400'}`}
                >
                  📝 Escrever
                </button>
                <button 
                  onClick={() => setEntryMode('audio')} 
                  className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${entryMode === 'audio' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-400'}`}
                >
                  🎙️ Gravar Áudio
                </button>
              </div>

              {entryMode === 'text' ? (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2 border-b border-gray-100">
                    {quickEmojis.map(emoji => (
                      <button 
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="flex-shrink-0 w-10 h-10 bg-gray-50 hover:bg-orange-50 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    ref={textareaRef}
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="Querido Deus Pai, hoje eu quero..."
                    className="w-full h-48 p-5 bg-slate-50 border border-gray-100 rounded-3xl text-sm outline-none focus:ring-2 focus:ring-orange-400 transition-all resize-none italic leading-relaxed"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-6 bg-slate-50/50 rounded-3xl border border-dashed border-gray-200">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-inner transition-all ${isRecording ? 'bg-red-50 text-red-600 animate-pulse scale-110 border-4 border-red-500' : 'bg-white text-gray-400'}`}>
                    {isRecording ? '⏹️' : '🎙️'}
                  </div>
                  
                  {isRecording && (
                    <p className="font-mono font-black text-red-600 text-2xl tracking-tighter">
                      {formatTime(recordingDuration)}
                    </p>
                  )}

                  <div className="flex gap-4 w-full px-6">
                    {!isRecording && !audioBlobUrl && (
                      <button onClick={startRecording} className="flex-1 py-4 bg-blue-900 text-white font-black uppercase rounded-2xl shadow-lg active:scale-95">Iniciar Gravação</button>
                    )}
                    {isRecording && (
                      <button onClick={stopRecording} className="flex-1 py-4 bg-red-600 text-white font-black uppercase rounded-2xl shadow-lg active:scale-95">Parar</button>
                    )}
                  </div>

                  {audioBlobUrl && !isRecording && (
                    <div className="w-full px-6 space-y-4 animate-fade-in">
                      <p className="text-center text-[10px] font-black text-blue-400 uppercase tracking-widest">Revisar Áudio</p>
                      <audio src={audioBlobUrl} controls className="w-full" />
                      <button onClick={() => { setAudioBlobUrl(null); setTempAudioData(null); }} className="w-full py-3 text-red-400 text-xs font-bold uppercase underline">Descartar Áudio</button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={resetForm} className="flex-1 py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl uppercase text-xs">Cancelar</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-orange-500 text-white font-black uppercase rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all text-xs tracking-widest">Salvar no Diário</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default DiarySection;
