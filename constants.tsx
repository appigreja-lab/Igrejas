
import React from 'react';
import { ReadingDay } from './types';

export const APP_NAME = "Família Unida";
export const LOGO_URL = "https://images.squarespace-cdn.com/content/v1/5e173e6a928e4e0406733276/1578581001438-X8W98W0S8S0W8S0W8S0W/logo.png";

export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Velho' | 'Novo';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Velho Testamento
  { name: 'Gênesis', chapters: 50, testament: 'Velho' },
  { name: 'Êxodo', chapters: 40, testament: 'Velho' },
  { name: 'Levítico', chapters: 27, testament: 'Velho' },
  { name: 'Números', chapters: 36, testament: 'Velho' },
  { name: 'Deuteronômio', chapters: 34, testament: 'Velho' },
  { name: 'Josué', chapters: 24, testament: 'Velho' },
  { name: 'Juízes', chapters: 21, testament: 'Velho' },
  { name: 'Rute', chapters: 4, testament: 'Velho' },
  { name: '1 Samuel', chapters: 31, testament: 'Velho' },
  { name: '2 Samuel', chapters: 24, testament: 'Velho' },
  { name: '1 Reis', chapters: 22, testament: 'Velho' },
  { name: '2 Reis', chapters: 25, testament: 'Velho' },
  { name: '1 Crônicas', chapters: 29, testament: 'Velho' },
  { name: '2 Crônicas', chapters: 36, testament: 'Velho' },
  { name: 'Esdras', chapters: 10, testament: 'Velho' },
  { name: 'Neemias', chapters: 13, testament: 'Velho' },
  { name: 'Ester', chapters: 10, testament: 'Velho' },
  { name: 'Jó', chapters: 42, testament: 'Velho' },
  { name: 'Salmos', chapters: 150, testament: 'Velho' },
  { name: 'Provérbios', chapters: 31, testament: 'Velho' },
  { name: 'Eclesiastes', chapters: 12, testament: 'Velho' },
  { name: 'Cânticos', chapters: 8, testament: 'Velho' },
  { name: 'Isaías', chapters: 66, testament: 'Velho' },
  { name: 'Jeremias', chapters: 52, testament: 'Velho' },
  { name: 'Lamentações', chapters: 5, testament: 'Velho' },
  { name: 'Ezequiel', chapters: 48, testament: 'Velho' },
  { name: 'Daniel', chapters: 12, testament: 'Velho' },
  { name: 'Oséias', chapters: 14, testament: 'Velho' },
  { name: 'Joel', chapters: 3, testament: 'Velho' },
  { name: 'Amós', chapters: 9, testament: 'Velho' },
  { name: 'Obadias', chapters: 1, testament: 'Velho' },
  { name: 'Jonas', chapters: 4, testament: 'Velho' },
  { name: 'Miquéias', chapters: 7, testament: 'Velho' },
  { name: 'Naum', chapters: 3, testament: 'Velho' },
  { name: 'Habacuque', chapters: 3, testament: 'Velho' },
  { name: 'Sofonias', chapters: 3, testament: 'Velho' },
  { name: 'Ageu', chapters: 2, testament: 'Velho' },
  { name: 'Zacarias', chapters: 14, testament: 'Velho' },
  { name: 'Malaquias', chapters: 4, testament: 'Velho' },
  // Novo Testamento
  { name: 'Mateus', chapters: 28, testament: 'Novo' },
  { name: 'Marcos', chapters: 16, testament: 'Novo' },
  { name: 'Lucas', chapters: 24, testament: 'Novo' },
  { name: 'João', chapters: 21, testament: 'Novo' },
  { name: 'Atos', chapters: 28, testament: 'Novo' },
  { name: 'Romanos', chapters: 16, testament: 'Novo' },
  { name: '1 Coríntios', chapters: 16, testament: 'Novo' },
  { name: '2 Coríntios', chapters: 13, testament: 'Novo' },
  { name: 'Gálatas', chapters: 6, testament: 'Novo' },
  { name: 'Efésios', chapters: 6, testament: 'Novo' },
  { name: 'Filipenses', chapters: 4, testament: 'Novo' },
  { name: 'Colossenses', chapters: 4, testament: 'Novo' },
  { name: '1 Tessalonicenses', chapters: 5, testament: 'Novo' },
  { name: '2 Tessalonicenses', chapters: 3, testament: 'Novo' },
  { name: '1 Timóteo', chapters: 6, testament: 'Novo' },
  { name: '2 Timóteo', chapters: 4, testament: 'Novo' },
  { name: 'Tito', chapters: 3, testament: 'Novo' },
  { name: 'Filemom', chapters: 1, testament: 'Novo' },
  { name: 'Hebreus', chapters: 13, testament: 'Novo' },
  { name: 'Tiago', chapters: 5, testament: 'Novo' },
  { name: '1 Pedro', chapters: 5, testament: 'Novo' },
  { name: '2 Pedro', chapters: 3, testament: 'Novo' },
  { name: '1 João', chapters: 5, testament: 'Novo' },
  { name: '2 João', chapters: 1, testament: 'Novo' },
  { name: '3 João', chapters: 1, testament: 'Novo' },
  { name: 'Judas', chapters: 1, testament: 'Novo' },
  { name: 'Apocalipse', chapters: 22, testament: 'Novo' },
];

export const INITIAL_READING_PLAN: ReadingDay[] = [
  { day: 1, reference: "Mateus 1-4", completed: false },
  { day: 2, reference: "Mateus 5-7", completed: false },
  { day: 3, reference: "Mateus 8-10", completed: false },
  { day: 4, reference: "Mateus 11-13", completed: false },
  { day: 5, reference: "Mateus 14-17", completed: false },
  { day: 6, reference: "Mateus 18-20", completed: false },
  { day: 7, reference: "Mateus 21-23", completed: false },
  { day: 8, reference: "Mateus 24-25", completed: false },
  { day: 9, reference: "Mateus 26", completed: false },
  { day: 10, reference: "Mateus 27-28", completed: false },
  { day: 11, reference: "Marcos 1-3", completed: false },
  { day: 12, reference: "Marcos 4-6", completed: false },
  { day: 13, reference: "Marcos 7-9", completed: false },
  { day: 14, reference: "Marcos 10-12", completed: false },
  { day: 15, reference: "Marcos 13-14", completed: false },
];

export const COLORS = {
  primary: 'blue-600',
  secondary: 'orange-500',
  accent: 'blue-900'
};
