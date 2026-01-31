
import React, { useState } from 'react';
import { CalendarEvent } from '../types';

interface CalendarSectionProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({ events, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('19:30');
  const [eventDesc, setEventDesc] = useState('');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const formatDateString = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${currentDate.getFullYear()}-${month}-${dayStr}`;
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  const handleAddEvent = () => {
    if (!eventTitle.trim()) return alert("Título obrigatório");
    const newEvent: CalendarEvent = {
      id: `ev_${Date.now()}`,
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      date: selectedDate,
      time: eventTime,
      type: 'personal'
    };
    onAddEvent(newEvent);
    setEventTitle('');
    setEventDesc('');
    setShowAddForm(false);
  };

  const filteredEvents = getEventsForDate(selectedDate).filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-400 py-2 uppercase">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`b-${i}`} className="p-2"></div>)}
        {days.map(day => {
          const dateStr = formatDateString(day);
          const hasEvents = getEventsForDate(dateStr).length > 0;
          const isSelected = selectedDate === dateStr;
          const isChurchEvent = getEventsForDate(dateStr).some(e => e.type === 'church');

          return (
            <div 
              key={day} 
              onClick={() => { setSelectedDate(dateStr); setShowAddForm(false); }}
              className={`relative p-3 rounded-2xl text-center text-sm font-bold cursor-pointer transition-all active:scale-90 ${
                isSelected ? 'bg-blue-600 text-white shadow-lg' : isToday(day) ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              {day}
              {hasEvents && (
                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isChurchEvent ? 'bg-orange-500' : 'bg-blue-400'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      <div className="p-6 bg-blue-900 text-white shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Agenda do Reino</h2>
          <button onClick={() => setShowAddForm(true)} className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg active:scale-90">+</button>
        </div>
        
        <div className="flex justify-between items-center mb-4 bg-blue-800/40 p-3 rounded-2xl border border-white/10">
          <button onClick={handlePrevMonth} className="p-2">◀</button>
          <span className="font-black uppercase tracking-widest text-xs">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={handleNextMonth} className="p-2">▶</button>
        </div>

        {renderCalendar()}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">
            Compromissos: {selectedDate.split('-').reverse().join('/')}
          </h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span className="text-[8px] font-bold text-gray-400">IGREJA</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div><span className="text-[8px] font-bold text-gray-400">PESSOAL</span></div>
          </div>
        </div>

        <div className="relative mb-4">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar eventos do dia..."
            className="w-full p-3 bg-white border border-gray-100 rounded-2xl outline-none text-xs font-bold shadow-sm"
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
            <span className="text-4xl">🗓️</span>
            <p className="text-xs font-bold uppercase">Nenhum evento agendado</p>
          </div>
        ) : (
          filteredEvents.sort((a,b) => a.time.localeCompare(b.time)).map(event => (
            <div key={event.id} className={`p-4 rounded-3xl border shadow-sm flex flex-col gap-2 transition-all hover:shadow-md ${
              event.type === 'church' ? 'bg-orange-50 border-orange-100' : 'bg-white border-blue-50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="bg-white/60 p-2 rounded-xl text-xs font-black shadow-inner">{event.time}</span>
                  <div>
                    <h4 className={`font-black text-sm ${event.type === 'church' ? 'text-orange-900' : 'text-blue-900'}`}>{event.title}</h4>
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{event.type === 'church' ? 'Oficial Igreja' : 'Lembrete Pessoal'}</p>
                  </div>
                </div>
                <button onClick={() => onDeleteEvent(event.id)} className="text-gray-300 hover:text-red-500">✕</button>
              </div>
              {event.description && <p className="text-xs text-gray-600 leading-relaxed pl-1">{event.description}</p>}
            </div>
          ))
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-end animate-fade-in" onClick={() => setShowAddForm(false)}>
          <div className="bg-white w-full rounded-t-[40px] p-8 animate-slide-up space-y-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-center">
              <h3 className="text-xl font-black text-blue-900 uppercase">Novo Lembrete</h3>
              <p className="text-xs text-gray-400">Dia: {selectedDate.split('-').reverse().join('/')}</p>
            </div>

            <div className="space-y-4">
              <input 
                type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} 
                placeholder="Título do compromisso" 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
              <div className="flex gap-4">
                <input 
                  type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
                <p className="flex-1 text-[10px] text-gray-400 self-center leading-tight">Os compromissos pessoais são visíveis apenas para você.</p>
              </div>
              <textarea 
                value={eventDesc} onChange={e => setEventDesc(e.target.value)}
                placeholder="Descrição ou observação (Opcional)"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
              <button onClick={handleAddEvent} className="w-full py-5 bg-blue-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-blue-100 active:scale-95 transition-all">Salvar na Agenda</button>
            </div>
            <button onClick={() => setShowAddForm(false)} className="w-full py-2 text-gray-400 font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSection;
