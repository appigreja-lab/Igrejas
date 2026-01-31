
export enum AppView {
  HOME = 'home',
  BIBLE = 'bible',
  PRAYERS = 'prayers',
  MEDIA = 'media',
  LIBRARY = 'library',
  PROFILE = 'profile',
  ADMIN = 'admin',
  READING_PLAN = 'reading_plan',
  DIARY = 'diary',
  CALENDAR = 'calendar'
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  instagram?: string; // Novo campo para endereço do Instagram
  photoUrl: string;
  isSubscriber: boolean;
  notificationsEnabled: boolean;
  reminderTime: string; // HH:mm format
}

export interface DiaryEntry {
  id: string;
  title: string;
  audioData?: string; // Base64 (Opcional agora)
  textContent?: string; // Novo campo para texto escrito
  timestamp: number;
  duration?: number; // Opcional se não houver áudio
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'church' | 'personal';
  createdBy?: string;
}

export interface PrayerRequest {
  id: string;
  userName: string;
  request: string;
  timestamp: number;
  intercessorsCount: number;
  isIntercededByMe?: boolean;
  category: 'saúde' | 'família' | 'finanças' | 'espiritual' | 'outros';
  isUrgent?: boolean;
  isAnonymous?: boolean;
  isAnswered?: boolean;
  testimony?: string;
}

export interface ReadingDay {
  day: number;
  reference: string;
  completed: boolean;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  target: 'full' | 'nt' | 'vt' | 'custom';
  duration: number;
  days: ReadingDay[];
  createdAt: number;
}

export interface SavedVerse {
  id: string;
  title: string;
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verseNum: number;
  timestamp: number;
}

export interface LibraryItem {
  id: string;
  title: string;
  category: 'livro' | 'foto' | 'vídeo' | 'música';
  url: string;
  thumbnail?: string;
  description?: string;
  timestamp: number;
}

export interface MediaItem {
  id: string;
  type: 'audio' | 'video';
  url: string;
  title: string;
  date: string;
}
