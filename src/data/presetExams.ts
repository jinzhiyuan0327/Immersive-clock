import type { ExamItem } from '../types';

export const PRESET_EXAMS: Omit<ExamItem, 'id' | 'order'>[] = [
  {
    name: '语文',
    startTime: '2026-06-07T09:00:00',
    endTime:   '2026-06-07T11:30:00',
    enabled: true,
  },
  {
    name: '数学',
    startTime: '2026-06-07T15:00:00',
    endTime:   '2026-06-07T17:00:00',
    enabled: true,
  },
  {
    name: '英语',
    startTime: '2026-06-08T15:00:00',
    endTime:   '2026-06-08T17:00:00',
    enabled: true,
  },
  // ↓ 继续添加更多分考试(科目)↓
  // { name: '物理', startTime: '2026-06-08T09:00:00', endTime: '2026-06-08T10:15:00', enabled: true },
];

export function buildPresetExams(): ExamItem[] {
  return PRESET_EXAMS.map((exam, index) => ({
    ...exam,
    id: `preset_${index}_${exam.startTime.replace(/[^0-9]/g, '')}`,
    order: index,
  }));
}