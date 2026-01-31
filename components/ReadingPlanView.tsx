
import React, { useState } from 'react';
import { ReadingPlan, ReadingDay } from '../types';
import PlanCreator from './PlanCreator';

interface ReadingPlanViewProps {
  plans: ReadingPlan[];
  onToggleDay: (planId: string, day: number) => void;
  onAddPlan: (plan: ReadingPlan) => void;
  onDeletePlan: (planId: string) => void;
  onBack: () => void;
  reminderEnabled: boolean;
  reminderTime: string;
  onUpdateReminder: (enabled: boolean, time: string) => void;
}

const ReadingPlanView: React.FC<ReadingPlanViewProps> = ({ 
  plans, 
  onToggleDay, 
  onAddPlan, 
  onDeletePlan, 
  onBack,
  reminderEnabled,
  reminderTime,
  onUpdateReminder
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  if (isCreating) {
    return (
      <div className="p-4 bg-gray-50 h-full">
        <PlanCreator 
          onSave={(plan) => {
            onAddPlan(plan);
            setIsCreating(false);
          }} 
          onCancel={() => setIsCreating(false)} 
        />
      </div>
    );
  }

  if (selectedPlan) {
    const completedCount = selectedPlan.days.filter(d => d.completed).length;
    const progressPercent = Math.round((completedCount / selectedPlan.days.length) * 100);

    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b flex items-center bg-blue-900 text-white">
          <button onClick={() => setSelectedPlanId(null)} className="mr-4 text-xl">←</button>
          <div className="flex-1">
            <h2 className="text-xl font-bold truncate">{selectedPlan.title}</h2>
            <p className="text-xs text-blue-200">{progressPercent}% Concluído • {completedCount} de {selectedPlan.days.length} dias</p>
          </div>
          <button 
            onClick={() => {
              if(window.confirm('Excluir este plano?')) {
                onDeletePlan(selectedPlan.id);
                setSelectedPlanId(null);
              }
            }}
            className="p-2 text-red-400"
          >
            🗑️
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedPlan.days.map((item) => (
            <div 
              key={item.day}
              onClick={() => onToggleDay(selectedPlan.id, item.day)}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                item.completed ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  item.completed ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.day}
                </div>
                <div className="pr-4">
                  <p className={`font-bold text-sm leading-tight ${item.completed ? 'text-blue-900' : 'text-gray-800'}`}>
                    {item.reference}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Dia {item.day}</p>
                </div>
              </div>
              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                item.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {item.completed && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 bg-blue-900 text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Meus Planos</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95 transition"
          >
            + Novo Plano
          </button>
        </div>
        <p className="text-blue-200 text-sm">Gerencie seus objetivos de leitura bíblica.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Reminder Quick Config */}
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔔</span>
              <div>
                <p className="font-bold text-sm text-gray-800">Lembrete Diário</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">Hora da Palavra</p>
              </div>
            </div>
            <button 
              onClick={() => onUpdateReminder(!reminderEnabled, reminderTime)}
              className={`w-10 h-5 rounded-full relative transition-colors ${reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${reminderEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
            </button>
          </div>
          
          {reminderEnabled && (
            <div className="flex items-center justify-between bg-blue-50 p-2 rounded-xl animate-fade-in">
              <span className="text-xs font-bold text-blue-800">Agendado para:</span>
              <input 
                type="time" 
                value={reminderTime}
                onChange={(e) => onUpdateReminder(true, e.target.value)}
                className="bg-white border rounded-lg p-1 text-xs font-bold text-blue-600 outline-none"
              />
            </div>
          )}
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <span className="text-4xl block mb-4">📚</span>
            <p className="text-gray-500 font-medium">Você ainda não tem planos.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="mt-4 text-blue-600 font-bold underline"
            >
              Criar meu primeiro plano
            </button>
          </div>
        ) : (
          plans.map(plan => {
            const completed = plan.days.filter(d => d.completed).length;
            const progress = Math.round((completed / plan.days.length) * 100);
            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-300 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">{plan.title}</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{plan.description}</p>
                  </div>
                  <span className="text-blue-600 font-bold text-sm">{progress}%</span>
                </div>
                
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[10px] text-gray-500 font-medium italic">Iniciado em {new Date(plan.createdAt).toLocaleDateString()}</span>
                  <span className="text-blue-600 text-xs font-bold">Continuar →</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReadingPlanView;
