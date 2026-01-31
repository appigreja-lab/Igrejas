
import React, { useState } from 'react';
import { ReadingPlan, ReadingDay } from '../types';
import { BIBLE_BOOKS } from '../constants';

interface PlanCreatorProps {
  onSave: (plan: ReadingPlan) => void;
  onCancel: () => void;
}

const PlanCreator: React.FC<PlanCreatorProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState<'full' | 'nt' | 'vt' | 'custom'>('nt');
  const [duration, setDuration] = useState(30);

  const generatePlan = () => {
    if (!title.trim()) {
      alert('Por favor, dê um título ao seu plano.');
      return;
    }

    let booksToInclude = BIBLE_BOOKS;
    if (target === 'nt') booksToInclude = BIBLE_BOOKS.filter(b => b.testament === 'Novo');
    else if (target === 'vt') booksToInclude = BIBLE_BOOKS.filter(b => b.testament === 'Velho');

    const totalChapters = booksToInclude.reduce((acc, b) => acc + b.chapters, 0);
    const chaptersPerDay = Math.ceil(totalChapters / duration);

    const days: ReadingDay[] = [];
    let currentBookIndex = 0;
    let currentChapter = 1;

    for (let d = 1; d <= duration; d++) {
      let dailyReference = "";
      let chaptersAddedToday = 0;

      while (chaptersAddedToday < chaptersPerDay && currentBookIndex < booksToInclude.length) {
        const book = booksToInclude[currentBookIndex];
        const remainingInBook = book.chapters - currentChapter + 1;
        const take = Math.min(chaptersPerDay - chaptersAddedToday, remainingInBook);
        
        const start = currentChapter;
        const end = currentChapter + take - 1;
        
        dailyReference += `${book.name} ${start}${start !== end ? '-' + end : ''}; `;
        
        chaptersAddedToday += take;
        currentChapter += take;

        if (currentChapter > book.chapters) {
          currentBookIndex++;
          currentChapter = 1;
        }
      }

      days.push({
        day: d,
        reference: dailyReference.trim().replace(/;$/, ''),
        completed: false
      });
    }

    const newPlan: ReadingPlan = {
      id: Date.now().toString(),
      title,
      description: `Plano de ${duration} dias para ler ${target === 'full' ? 'a Bíblia Toda' : target === 'nt' ? 'o Novo Testamento' : 'o Velho Testamento'}`,
      target,
      duration,
      days,
      createdAt: Date.now()
    };

    onSave(newPlan);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl space-y-6 animate-slide-up">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-blue-900">Novo Plano Personalizado</h3>
        <button onClick={onCancel} className="text-gray-400">✕</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Título do Plano</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Minha Jornada com Jesus"
            className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">O que você quer ler?</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'nt', label: 'Novo Testamento' },
              { id: 'vt', label: 'Velho Testamento' },
              { id: 'full', label: 'Bíblia Toda' },
              { id: 'custom', label: 'Personalizado' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setTarget(opt.id as any)}
                className={`p-3 rounded-xl border-2 text-xs font-bold transition ${target === opt.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Duração (Dias): {duration}</label>
          <input 
            type="range" 
            min="7" 
            max="365" 
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
            <span>1 Semana</span>
            <span>1 Ano</span>
          </div>
        </div>
      </div>

      <button 
        onClick={generatePlan}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition active:scale-95"
      >
        Gerar Plano de Leitura
      </button>
    </div>
  );
};

export default PlanCreator;
