
import React, { useState, useRef } from 'react';
import { LibraryItem, PrayerRequest, ReadingPlan, UserProfile, CalendarEvent } from '../types';

interface AdminPanelProps {
  library: LibraryItem[];
  setLibrary: React.Dispatch<React.SetStateAction<LibraryItem[]>>;
  prayers: PrayerRequest[];
  setPrayers: React.Dispatch<React.SetStateAction<PrayerRequest[]>>;
  readingPlans: ReadingPlan[];
  setReadingPlans: React.Dispatch<React.SetStateAction<ReadingPlan[]>>;
  devotional: string;
  setDevotional: (text: string) => void;
  members: UserProfile[];
  setMembers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  calendarEvents: CalendarEvent[];
  setCalendarEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  library, setLibrary, 
  prayers, setPrayers, 
  readingPlans, setReadingPlans,
  devotional, setDevotional,
  members, setMembers,
  calendarEvents, setCalendarEvents
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'devotional' | 'library' | 'members' | 'prayers' | 'agenda'>('devotional');

  // Form states - Library
  const [newDevotional, setNewDevotional] = useState(devotional);
  const [newLibTitle, setNewLibTitle] = useState('');
  const [newLibUrl, setNewLibUrl] = useState('');
  const [newLibThumb, setNewLibThumb] = useState('');
  const [newLibCat, setNewLibCat] = useState<LibraryItem['category']>('livro');
  
  // Form states - Members
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberInstagram, setNewMemberInstagram] = useState('');
  const [newMemberPhoto, setNewMemberPhoto] = useState('');
  const [newMemberIsSubscriber, setNewMemberIsSubscriber] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const memberPhotoInputRef = useRef<HTMLInputElement>(null);

  // Form states - Agenda
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEvTime, setNewEvTime] = useState('19:30');
  const [newEvDesc, setNewEvDesc] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      setIsLoggedIn(true);
    } else {
      alert('Credenciais inválidas (admin / 1234)');
    }
  };

  const handleMemberPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewMemberPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addMember = () => {
    if (!newMemberName.trim()) return alert('Nome obrigatório');
    const newMember: UserProfile = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      instagram: newMemberInstagram.trim() || undefined,
      photoUrl: newMemberPhoto || `https://picsum.photos/seed/${Date.now()}/200/200`,
      isSubscriber: newMemberIsSubscriber,
      notificationsEnabled: false,
      reminderTime: "08:00"
    };
    setMembers(prev => [newMember, ...prev]);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberInstagram('');
    setNewMemberPhoto('');
    setNewMemberIsSubscriber(false);
    alert('Membro cadastrado!');
  };

  const addChurchEvent = () => {
    if (!newEvTitle.trim() || !newEvDate) return alert('Preencha título e data');
    const newEvent: CalendarEvent = {
      id: `ch_ev_${Date.now()}`,
      title: newEvTitle.trim(),
      date: newEvDate,
      time: newEvTime,
      description: newEvDesc.trim(),
      type: 'church'
    };
    setCalendarEvents(prev => [newEvent, ...prev]);
    setNewEvTitle('');
    setNewEvDesc('');
    alert('Evento oficial cadastrado!');
  };

  const deleteEvent = (id: string) => {
    if (window.confirm('Remover este evento da agenda oficial?')) {
      setCalendarEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const addLibraryItem = () => {
    if (!newLibTitle.trim() || !newLibUrl.trim()) return alert('Título e URL obrigatórios');
    const newItem: LibraryItem = {
      id: `fu_admin_lib_${Date.now()}`,
      title: newLibTitle,
      url: newLibUrl,
      category: newLibCat,
      thumbnail: newLibThumb.trim() || undefined,
      timestamp: Date.now()
    };
    setLibrary(prev => [newItem, ...prev]);
    setNewLibTitle('');
    setNewLibUrl('');
    setNewLibThumb('');
    alert('Item publicado!');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 h-full">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border-t-4 border-blue-900">
          <h2 className="text-xl font-black text-blue-900 uppercase text-center mb-6 tracking-tight">Painel ADM</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" placeholder="admin" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none" placeholder="****" />
            <button type="submit" className="w-full bg-blue-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Acessar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="bg-blue-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Painel ADM</h2>
          <button onClick={() => setIsLoggedIn(false)} className="text-[10px] font-black bg-red-500/20 text-red-100 border border-red-500/30 px-4 py-2 rounded-full uppercase">Sair</button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 relative z-10">
          {[
            { id: 'devotional', label: 'Devocional' },
            { id: 'agenda', label: 'Agenda' },
            { id: 'library', label: 'Biblioteca' },
            { id: 'members', label: 'Membros' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 flex-shrink-0 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab.id ? 'bg-white text-blue-900' : 'bg-blue-800/40 text-blue-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        {activeTab === 'devotional' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-black text-blue-900 uppercase text-xs mb-2">Palavra do Dia</h3>
            <textarea className="w-full h-64 p-5 bg-slate-50 border border-gray-100 rounded-3xl text-sm" value={newDevotional} onChange={(e) => setNewDevotional(e.target.value)} />
            <button onClick={() => setDevotional(newDevotional)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Atualizar</button>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <h3 className="font-black text-blue-900 uppercase text-xs">Novo Evento Oficial</h3>
              <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Título do Evento" value={newEvTitle} onChange={e => setNewEvTitle(e.target.value)} />
              <div className="flex gap-2">
                 <input type="date" className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none" value={newEvDate} onChange={e => setNewEvDate(e.target.value)} />
                 <input type="time" className="p-4 bg-slate-50 border rounded-2xl outline-none" value={newEvTime} onChange={e => setNewEvTime(e.target.value)} />
              </div>
              <textarea className="w-full h-24 p-4 bg-slate-50 border rounded-2xl" placeholder="Descrição (Culto de domingo, Reunião de obreiros, etc)" value={newEvDesc} onChange={e => setNewEvDesc(e.target.value)} />
              <button onClick={addChurchEvent} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Publicar na Agenda Geral</button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
               <h3 className="font-black text-blue-900 uppercase text-xs">Eventos Cadastrados</h3>
               <div className="space-y-2">
                 {calendarEvents.filter(e => e.type === 'church').map(ev => (
                   <div key={ev.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                     <div>
                       <p className="font-bold text-sm text-blue-900">{ev.title}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">{ev.date.split('-').reverse().join('/')} às {ev.time}</p>
                     </div>
                     <button onClick={() => deleteEvent(ev.id)} className="text-red-500 font-bold">✕</button>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-5">
              <h3 className="font-black text-blue-900 uppercase text-xs">Novo Cadastro</h3>
              <div 
                onClick={() => memberPhotoInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed mx-auto flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
              >
                {newMemberPhoto ? <img src={newMemberPhoto} className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
              </div>
              <input type="file" ref={memberPhotoInputRef} onChange={handleMemberPhotoUpload} accept="image/*" className="hidden" />
              <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Nome" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
              <input type="email" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="E-mail" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
              <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none" placeholder="Instagram (ex: @usuario)" value={newMemberInstagram} onChange={(e) => setNewMemberInstagram(e.target.value)} />
              <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer">
                <span className="text-xs font-black uppercase">Assinatura Premium</span>
                <input type="checkbox" checked={newMemberIsSubscriber} onChange={(e) => setNewMemberIsSubscriber(e.target.checked)} className="w-6 h-6 accent-orange-500" />
              </label>
              <button onClick={addMember} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Cadastrar</button>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
              <h3 className="font-black text-blue-900 uppercase text-xs">Novo Conteúdo</h3>
              <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Título" value={newLibTitle} onChange={(e) => setNewLibTitle(e.target.value)} />
              <input type="text" className="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="URL do Arquivo" value={newLibUrl} onChange={(e) => setNewLibUrl(e.target.value)} />
              <select className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={newLibCat} onChange={(e) => setNewLibCat(e.target.value as any)}>
                <option value="livro">📖 Livro (PDF)</option>
                <option value="foto">🖼️ Imagem</option>
                <option value="vídeo">🎬 Vídeo</option>
                <option value="música">🎵 Áudio</option>
              </select>
              <button onClick={addLibraryItem} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Publicar</button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
};

export default AdminPanel;
