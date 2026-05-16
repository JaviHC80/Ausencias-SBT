export type AbsenceType = 'completa' | 'parcial';
export type AbsenceReason = 'Vacaciones' | 'Asuntos propios' | 'Médico' | 'Baja' | 'Permiso';

export interface Absence {
  id: string;
  userId: string;
  userName: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  type: AbsenceType;
  reason: AbsenceReason;
  createdAt: string; // ISO string
}

export const WORKERS = ['Ana', 'Eva', 'Fabi', 'Aroa', 'Azahara', 'Javi'];
export const REASONS: AbsenceReason[] = ['Vacaciones', 'Asuntos propios', 'Médico', 'Baja', 'Permiso'];
