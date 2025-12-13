export type MaterialType = 'PDF' | 'VIDEO' | 'WORKSHEET' | 'EXERCISE';

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  description: string;
  dateAdded: string;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  className: string;
  status: 'PRESENT' | 'ABSENT' | 'SICK' | 'PERMIT' | 'UNMARKED';
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  className: string;
  subject: string;
  room: string;
}

export interface SyllabusItem {
  id: string;
  week: number;
  topic: string;
  competency: string;
}

export enum ViewState {
  PROFILE = 'PROFILE',
  SCHEDULE = 'SCHEDULE',
  SYLLABUS = 'SYLLABUS',
  MATERIALS = 'MATERIALS',
  ATTENDANCE = 'ATTENDANCE',
}