export interface SyllabusTopic {
  id: string; // e.g., "1.1"
  title: string;
  domain: string;
  estimatedTime: string; // e.g., "30 mins"
  description: string;
  youtubeUrl?: string;
  completed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userAnswer?: number;
}

export interface QuizHistoryItem {
  id: string;
  topicId: string;
  topicTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  score: number;
  questions: QuizQuestion[];
  date: string;
}

export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  learned: boolean;
  favorite: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface StudyStats {
  completedTopics: string[]; // List of topic IDs
  youtubeUrls: { [topicId: string]: string }; // Map of topicId -> YouTube URL
  quizHistory: QuizHistoryItem[];
  flashcards: Flashcard[];
  dailyStreak: number;
  lastStudyDate?: string; // YYYY-MM-DD
}
