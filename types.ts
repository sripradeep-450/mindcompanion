
export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  photo: string | null;
  bio: string;
}

export type UserRole = 'patient' | 'caretaker';

export interface RoutineItem {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  type: 'medicine' | 'meal' | 'exercise' | 'other';
  howToDo?: string;
  whereToDo?: string;
}

export interface FamilyPhoto {
  id: string;
  url: string;
  eventName: string;
  date: string;
  tags: { name: string; relation?: string; x: number; y: number }[];
  faceId?: string; // For grouping
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  imageUrl: string;
  fact: string;
}

export enum AppState {
  ROUTINE = 'routine',
  GAMES = 'games',
  FAMILY = 'family',
  CHAT = 'chat',
  CARETAKER = 'caretaker'
}

export interface CognitivePuzzle {
  type: 'sequence' | 'logic' | 'odd-one-out' | 'memory' | 'jigsaw';
  instruction: string;
  puzzleData: any;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
}

export type ThemeType = 'default' | 'lavender' | 'contrast';
