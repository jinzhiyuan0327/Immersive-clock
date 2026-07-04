import type { ExamItem } from '../types';

export const PRESET_EXAMS: Omit<ExamItem, 'id' | 'order'>[] = [
  {
    name: '2026年高考 语文',
    startTime: '2026-06-07T09:00:00',
    endTime:   '2026-06-07T11:30:00',
    enabled: true,
  },
  {
    name: '2026年高考 数学',
    startTime: '2026-06-07T15:00:00',
    endTime:   '2026-06-07T17:00:00',
    enabled: true,
  },
  {
    name: '2026年高考 英语',
    startTime: '2026-06-08T15:00:00',
    endTime:   '2026-06-08T17:00:00',
    enabled: true,
  },
  // ↓ 继续添加更多考试 ↓
  // { name: '期末考试 数学', startTime: '2026-07-10T09:00:00', endTime: '2026-07-10T11:00:00', enabled: true },
];

export function buildPresetExams(): ExamItem[] {
  return PRESET_EXAMS.map((exam, index) => ({
    ...exam,
    id: `preset_${index}_${exam.startTime.replace(/[^0-9]/g, '')}`,
    order: index,
  }));
}