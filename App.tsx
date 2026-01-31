
import React, { useState, useEffect, useRef } from 'react';
import { AppView, UserProfile, LibraryItem, MediaItem, ReadingDay, PrayerRequest, ReadingPlan, DiaryEntry, CalendarEvent } from './types';
import { LOGO_URL, APP_NAME, INITIAL_READING_PLAN } from './constants';
import BibleReader from './components/BibleReader';
import AdminPanel from './components/AdminPanel';
import Recorder from './components/Recorder';
import ReadingPlanView from './components/ReadingPlanView';
import PrayerSection from './components/PrayerSection';
import LibraryView from './components/LibraryView';
import MusicPlayer from './components/MusicPlayer';
import DiarySection from './components/DiarySection';
import CalendarSection from './components/CalendarSection';
import { generateDevotional } from './services/geminiService';

interface ShareableMedia {
  title: string;
  url?: string;
  data?: string;
  type: string;
}

interface SavedRecording {
  id: string;
  type: 'audio' | 'video';
  data: string;
  timestamp: number;
  title: string;
  description: string;
}

interface Toast {
  message: string;
  type: 'success' | 'info' | 'error';
  id: number;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  
  const [members, setMembers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('fu_members_list');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: "Membro da Família",
        photoUrl: "https://picsum.photos/seed/fu/200/200",
        isSubscriber: true,
        notificationsEnabled: false,
        reminderTime: "08:00"
      }
    ];
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fu_user_profile');
    if (saved) return JSON.parse(saved);
    return members[0];
  });

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('fu_diary_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('fu_calendar_events');
    return saved ? JSON.parse(saved) : [
      { id: 'initial-1', title: 'Culto de Adoração', date: new Date().toISOString().split('T')[0], time: '19:30', type: 'church', description: 'Culto da Família - Esperamos por você!' }
    ];
  });
  
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const [library, setLibrary] = useState<LibraryItem[]>(() => {
    const saved = localStorage.getItem('fu_library');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Manual de Oração', category: 'livro', url: '#', description: 'Um guia completo para sua vida de oração.', thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { id: '2', title: 'Hino da Vitória', category: 'música', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', description: 'Lindo louvor para adoração.', timestamp: Date.now() - 1000 * 60 * 60 * 24 },
      { id: '3', title: 'Mensagem Especial Pastor', category: 'vídeo', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', thumbnail: 'https://picsum.photos/seed/preach/300/200', description: 'Uma palavra de encorajamento para a semana.', timestamp: Date.now() },
      { id: '4', title: 'Foto Retiro 2023', category: 'foto', url: 'https://picsum.photos/seed/church1/800/600', description: 'Momentos inesquecíveis de comunhão.', timestamp: Date.now() - 1000 * 60 * 60 * 48 }
    ];
  });

  const [activeTrack, setActiveTrack] = useState<LibraryItem | null>(() => {
    const lastTrackId = localStorage.getItem('fu_last_track_id');
    if (lastTrackId) {
      const savedLibrary = localStorage.getItem('fu_library');
      const currentLibrary = savedLibrary ? JSON.parse(savedLibrary) : [];
      return currentLibrary.find((item: LibraryItem) => item.id === lastTrackId) || null;
    }
    return null;
  });

  const [dailyDevotional, setDailyDevotional] = useState<string>("Carregando devocional...");
  const [prayers, setPrayers] = useState<PrayerRequest[]>(() => {
    const saved = localStorage.getItem('fu_prayers');
    return saved ? JSON.parse(saved) : [];
  });
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>(() => {
    const saved = localStorage.getItem('fu_reading_plans');
    if (saved) return JSON.parse(saved);
    return [{ id: 'default-plan', title: 'Plano Inicial: Evangelhos', description: 'Leitura dos quatro evangelhos em 15 dias.', target: 'nt', duration: 15, days: INITIAL_READING_PLAN, createdAt: Date.now() }];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); } });
  };

  useEffect(() => {
    loadDevotional();
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showToast("App instalado com sucesso!");
    });
  }, []);

  useEffect(() => { localStorage.setItem('fu_user_profile', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('fu_members_list', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('fu_library', JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem('fu_prayers', JSON.stringify(prayers)); }, [prayers]);
  useEffect(() => { localStorage.setItem('fu_diary_entries', JSON.stringify(diaryEntries)); }, [diaryEntries]);
  useEffect(() => { localStorage.setItem('fu_calendar_events', JSON.stringify(calendarEvents)); }, [calendarEvents]);
  
  useEffect(() => {
    if (activeTrack) {
      localStorage.setItem('fu_last_track_id', activeTrack.id);
    }
  }, [activeTrack]);

  const loadDevotional = async () => { setDailyDevotional(await generateDevotional()); };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleAddLibraryLink = (title: string, url: string, category: LibraryItem['category'], thumbnail?: string) => {
    const newItem: LibraryItem = { id: `fu_link_${Date.now()}`, title, url, category, description: '', thumbnail, timestamp: Date.now() };
    setLibrary(prev => [newItem, ...prev]);
    showToast(`${category === 'livro' ? 'Livro' : 'Link'} salvo na biblioteca!`);
  };

  const handleSaveRecording = (recording: SavedRecording) => {
    const newLibraryItem: LibraryItem = { 
      id: recording.id, 
      title: recording.title, 
      category: recording.type === 'video' ? 'vídeo' : 'música', 
      url: recording.data,
      description: recording.description,
      timestamp: recording.timestamp
    };
    setLibrary(prev => [newLibraryItem, ...prev]);
    showToast("Gravação salva na biblioteca!");
  };

  const removeLibraryItem = (id: string) => {
    const item = library.find(i => i.id === id);
    if (!item) return;
    openConfirm('Confirmar Exclusão', `Remover "${item.title}"?`, () => {
      setLibrary(prev => prev.filter(i => i.id !== id));
      if (activeTrack?.id === id) {
        setActiveTrack(null);
        localStorage.removeItem('fu_last_track_id');
      }
      showToast("Item removido.");
    });
  };

  const handleToggleDay = (planId: string, dayNum: number) => {
    setReadingPlans(prev => prev.map(p => p.id === planId ? { ...p, days: p.days.map(d => d.day === dayNum ? { ...d, completed: !d.completed } : d) } : p));
  };

  const handleAddPlan = (newPlan: ReadingPlan) => { setReadingPlans(prev => [newPlan, ...prev]); showToast("Novo plano criado!"); };
  const handleDeletePlan = (planId: string) => { setReadingPlans(prev => prev.filter(p => p.id !== planId)); showToast("Plano removido."); };
  
  const handleAddPrayer = (data: Partial<PrayerRequest>) => { 
    const newPrayer: PrayerRequest = { 
      id: Date.now().toString(), 
      userName: user.name, 
      request: data.request || '', 
      timestamp: Date.now(), 
      intercessorsCount: 0,
      category: data.category || 'espiritual',
      isUrgent: data.isUrgent,
      isAnonymous: data.isAnonymous,
      isAnswered: false
    };
    setPrayers(prev => [newPrayer, ...prev]); 
    showToast("Pedido enviado à família!"); 
  };
  
  const handleIntercede = (id: string) => { 
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, intercessorsCount: p.intercessorsCount + 1, isIntercededByMe: true } : p)); 
  };

  const handleMarkAsAnswered = (id: string, testimony?: string) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, isAnswered: true, testimony } : p));
    showToast("Glória a Deus pela vitória!");
  };

  const handleLibraryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newItem: LibraryItem = { id: Date.now().toString(), title: file.name.split('.')[0], category: file.type.includes('pdf') ? 'livro' : file.type.includes('video') ? 'vídeo' : 'foto', url: reader.result as string, description: '', timestamp: Date.now() };
        setLibrary(prev => [newItem, ...prev]);
        setIsProcessingFile(false);
        showToast("Arquivo carregado!");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerShare = async (media: ShareableMedia) => {
    if (navigator.share) await navigator.share({ title: media.title, text: media.title, url: media.url || window.location.href });
    else showToast("O recurso de compartilhamento não está disponível neste navegador.", "info");
  };

  const switchUser = (selectedMember: UserProfile) => {
    setUser(selectedMember);
    setShowMemberPicker(false);
    showToast(`Bem-vindo, ${selectedMember.name}!`);
    setCurrentView(AppView.HOME);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        const activePlan = readingPlans[0];
        return (
          <div className="p-4 space-y-6 overflow-y-auto h-full pb-32">
            {!isInstalled && (
              <div onClick={handleInstallClick} className="bg-orange-100 border border-orange-200 p-3 rounded-2xl flex items-center justify-between animate-pulse cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📲</span>
                  <p className="text-[10px] font-black text-orange-900 uppercase">Instale o App na Tela de Início</p>
                </div>
                <span className="text-orange-900 text-lg">→</span>
              </div>
            )}
            <div className="bg-blue-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <h2 className="text-2xl font-bold mb-2">Olá, {user.name.split(' ')[0]}!</h2>
              <div className="text-blue-100 text-sm leading-relaxed">{dailyDevotional}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => setCurrentView(AppView.DIARY)}
                className="bg-white border border-orange-50 p-3 rounded-2xl shadow-sm flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🖋️</div>
                <h3 className="font-black text-blue-900 text-[9px] uppercase tracking-tighter leading-none">Diário do Pai</h3>
              </div>

              <div 
                onClick={() => setCurrentView(AppView.CALENDAR)}
                className="bg-white border border-blue-50 p-3 rounded-2xl shadow-sm flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🗓️</div>
                <h3 className="font-black text-blue-900 text-[9px] uppercase tracking-tighter leading-none">Agenda Reino</h3>
              </div>

              <div 
                onClick={() => setCurrentView(AppView.PRAYERS)}
                className="bg-white border border-purple-50 p-3 rounded-2xl shadow-sm flex flex-col items-center text-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">🙏</div>
                <h3 className="font-black text-blue-900 text-[9px] uppercase tracking-tighter leading-none">Pedidos</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setCurrentView(AppView.MEDIA)} className="bg-orange-500 text-white p-4 rounded-2xl shadow-md flex flex-col items-center justify-center font-black text-xs">🎙️ GRAVAR ÁUDIO</button>
              <button onClick={() => setCurrentView(AppView.MEDIA)} className="bg-red-600 text-white p-4 rounded-2xl shadow-md flex flex-col items-center justify-center font-black text-xs">📹 LIVE / VÍDEO</button>
            </div>
            {activePlan && (
              <div onClick={() => setCurrentView(AppView.READING_PLAN)} className="bg-white p-4 rounded-2xl border flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-blue-600 flex items-center justify-center font-bold text-blue-600">P</div>
                <div><p className="font-bold text-sm">{activePlan.title}</p><p className="text-xs text-gray-500">Toque para continuar lendo</p></div>
              </div>
            )}
          </div>
        );
      case AppView.READING_PLAN: return <ReadingPlanView plans={readingPlans} onToggleDay={handleToggleDay} onAddPlan={handleAddPlan} onDeletePlan={handleDeletePlan} onBack={() => setCurrentView(AppView.HOME)} reminderEnabled={user.notificationsEnabled} reminderTime={user.reminderTime} onUpdateReminder={(enabled, time) => setUser(prev => ({ ...prev, notificationsEnabled: enabled, reminderTime: time }))} />;
      case AppView.BIBLE: return <BibleReader onNotify={(msg) => showToast(msg)} />;
      case AppView.PRAYERS: return <PrayerSection prayers={prayers} onAddPrayer={handleAddPrayer} onIntercede={handleIntercede} onMarkAsAnswered={handleMarkAsAnswered} />;
      case AppView.MEDIA: return (
        <div className="p-4 space-y-6 h-full overflow-y-auto pb-32">
          <Recorder type="video" onSave={handleSaveRecording} />
          <Recorder type="audio" onSave={handleSaveRecording} />
        </div>
      );
      case AppView.DIARY: return (
        <DiarySection 
          entries={diaryEntries} 
          onSaveEntry={(e) => {
            setDiaryEntries(prev => [e, ...prev]);
            showToast("Conversa salva!");
          }}
          onDeleteEntry={(id) => {
            setDiaryEntries(prev => prev.filter(e => e.id !== id));
            showToast("Registro removido.");
          }}
        />
      );
      case AppView.CALENDAR: return (
        <CalendarSection 
          events={calendarEvents}
          onAddEvent={(ev) => {
            setCalendarEvents(prev => [ev, ...prev]);
            showToast("Evento agendado!");
          }}
          onDeleteEvent={(id) => {
            setCalendarEvents(prev => prev.filter(e => e.id !== id));
            showToast("Evento removido.");
          }}
        />
      );
      case AppView.LIBRARY: return (
        <>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,audio/*,application/pdf" onChange={handleLibraryUpload} />
          <LibraryView items={library} onAddItem={() => fileInputRef.current?.click()} onAddLink={handleAddLibraryLink} onRemoveItem={removeLibraryItem} onShareItem={(item) => triggerShare({ title: item.title, url: item.url, type: item.category })} onPlayMusic={(item) => setActiveTrack(item)} />
        </>
      );
      case AppView.PROFILE: return (
        <div className="p-8 flex flex-col items-center space-y-6 h-full bg-white overflow-y-auto pb-32">
          <div className="relative">
            <img src={user.photoUrl} className="w-40 h-40 rounded-full border-4 border-blue-600 object-cover shadow-2xl" />
            {user.isSubscriber && (
              <span className="absolute bottom-0 right-2 bg-orange-500 text-white p-2 rounded-full border-4 border-white text-xs">⭐</span>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-blue-900">{user.name}</h2>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">
              {user.isSubscriber ? 'Assinante Família Unida' : 'Membro Família Unida'}
            </p>
          </div>
          <div className="w-full space-y-3">
            {user.instagram && (
              <a 
                href={`https://instagram.com/${user.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full p-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <span>📸</span> {user.instagram.startsWith('@') ? user.instagram : `@${user.instagram}`}
              </a>
            )}
            <button onClick={() => setShowMemberPicker(true)} className="w-full p-4 bg-blue-50 text-blue-900 font-bold rounded-2xl active:scale-95 transition-all border border-blue-100 flex items-center justify-center gap-2">
              <span>👤</span> Trocar de Perfil
            </button>
            <button onClick={() => setCurrentView(AppView.CALENDAR)} className="w-full p-4 border-2 border-blue-100 text-blue-600 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2">
               <span>🗓️</span> Ver Agenda da Igreja
            </button>
            {!isInstalled && (
              <button 
                onClick={handleInstallClick}
                className="w-full p-5 bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <span>📥</span> Baixar Aplicativo
              </button>
            )}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mt-4">
              <h4 className="font-black text-blue-900 uppercase text-xs mb-3 tracking-tighter">Status da Conta</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${user.isSubscriber ? 'bg-green-500' : 'bg-blue-500'} rounded-full`}></div>
                <p className="text-sm font-bold text-gray-600">{user.isSubscriber ? 'Acesso Premium Ativo' : 'Membro Ativo'}</p>
              </div>
            </div>
          </div>
        </div>
      );
      case AppView.ADMIN: return <AdminPanel 
        library={library} setLibrary={setLibrary} 
        prayers={prayers} setPrayers={setPrayers} 
        readingPlans={readingPlans} setReadingPlans={setReadingPlans} 
        devotional={dailyDevotional} setDevotional={setDailyDevotional}
        members={members} setMembers={setMembers}
        calendarEvents={calendarEvents} setCalendarEvents={setCalendarEvents}
      />;
      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Member Picker Overlay */}
      {showMemberPicker && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end animate-fade-in" onClick={() => setShowMemberPicker(false)}>
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up space-y-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h3 className="text-xl font-black text-blue-900 uppercase">Quem está usando?</h3>
              <p className="text-sm text-gray-500">Selecione o seu perfil cadastrado</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {members.map(member => (
                <button 
                  key={member.id} 
                  onClick={() => switchUser(member)}
                  className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-90 ${user.id === member.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="relative">
                    <img src={member.photoUrl} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" alt="" />
                    {member.isSubscriber && <span className="absolute -bottom-1 -right-1 text-[8px] bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center border border-white">⭐</span>}
                  </div>
                  <p className="font-bold text-xs truncate w-full text-center text-gray-800">{member.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowMemberPicker(false)} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">Cancelar</button>
          </div>
        </div>
      )}

      {showInstallGuide && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end animate-fade-in" onClick={() => setShowInstallGuide(false)}>
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up space-y-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h3 className="text-xl font-black text-blue-900 uppercase">Instalar no Celular</h3>
              <p className="text-sm text-gray-500">Siga os passos abaixo para ter o ícone do app na sua tela inicial:</p>
            </div>
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">1</div>
                <p className="text-sm font-medium">Toque no botão de <b>Compartilhar</b> <span className="text-xl">⎋</span> ou no <b>Menu</b> <span className="text-xl">⋮</span> do seu navegador.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">2</div>
                <p className="text-sm font-medium">Procure pela opção <b>"Adicionar à Tela de Início"</b> ou <b>"Instalar Aplicativo"</b>.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-black text-blue-600">3</div>
                <p className="text-sm font-medium">Confirme e o ícone da <b>Família Unida</b> aparecerá junto aos seus outros apps!</p>
              </div>
            </div>
            <button onClick={() => setShowInstallGuide(false)} className="w-full py-4 bg-blue-900 text-white font-bold rounded-2xl">Entendi</button>
          </div>
        </div>
      )}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl space-y-6">
            <h3 className="text-lg font-black text-blue-900 uppercase text-center">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-500 text-center">{confirmDialog.message}</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 bg-gray-100 rounded-2xl">Não</button><button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-2xl">Sim</button></div>
          </div>
        </div>
      )}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <div key={t.id} className="p-4 rounded-2xl shadow-xl flex items-center gap-3 bg-blue-900 text-white animate-slide-up"><p className="text-xs font-bold">{t.message}</p></div>)}
      </div>
      {isProcessingFile && <div className="absolute inset-0 z-[110] bg-white/60 flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
      <header className="bg-white p-4 border-b flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3"><img src={LOGO_URL} alt="Logo" className="w-10 h-10 object-contain" /><h1 className="text-xl font-bold text-blue-900">{APP_NAME}</h1></div>
        <button onClick={() => setCurrentView(AppView.ADMIN)} className="text-xs font-black text-gray-400 border px-3 py-1.5 rounded-full uppercase">Painel</button>
      </header>
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
      {activeTrack && (
        <MusicPlayer 
          track={activeTrack} 
          onClose={() => {
            setActiveTrack(null);
            localStorage.removeItem('fu_last_track_id');
            localStorage.removeItem(`fu_progress_${activeTrack.id}`);
          }} 
        />
      )}
      <nav className="bg-white border-t py-3 flex items-center justify-around sticky bottom-0 z-30">
        <button onClick={() => setCurrentView(AppView.HOME)} className={currentView === AppView.HOME ? 'text-blue-600' : 'text-gray-400'}>🏠</button>
        <button onClick={() => setCurrentView(AppView.BIBLE)} className={currentView === AppView.BIBLE ? 'text-blue-600' : 'text-gray-400'}>📖</button>
        <button onClick={() => setCurrentView(AppView.PRAYERS)} className={currentView === AppView.PRAYERS ? 'text-blue-600' : 'text-gray-400'}>🙏</button>
        <button onClick={() => setCurrentView(AppView.LIBRARY)} className={currentView === AppView.LIBRARY ? 'text-blue-600' : 'text-gray-400'}>📚</button>
        <button onClick={() => setCurrentView(AppView.PROFILE)} className={currentView === AppView.PROFILE ? 'text-blue-600' : 'text-gray-400'}>👤</button>
      </nav>
    </div>
  );
};

export default App;
