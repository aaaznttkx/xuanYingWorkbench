import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDateCN = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy年M月d日', { locale: zhCN });
};

export const formatWeekday = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE', { locale: zhCN });
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start: formatDate(start), end: formatDate(end) };
};

export const getMonthDays = (date: Date = new Date()) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

export const isDateToday = (dateStr: string) => {
  return isToday(parseISO(dateStr));
};

export const isSameDate = (date1: string, date2: string) => {
  return isSameDay(parseISO(date1), parseISO(date2));
};

export const todayStr = () => formatDate(new Date());

export const getConsecutiveDays = (dates: string[]): number => {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  const today = todayStr();
  let count = 0;
  let checkDate = today;

  for (const d of sorted) {
    if (d === checkDate) {
      count++;
      const prev = new Date(checkDate);
      prev.setDate(prev.getDate() - 1);
      checkDate = formatDate(prev);
    } else if (d < checkDate) {
      break;
    }
  }
  return count;
};

export const getMonthStats = (dates: string[]) => {
  const now = new Date();
  const monthStart = formatDate(startOfMonth(now));
  const monthDates = dates.filter(d => d >= monthStart);
  return {
    totalDays: new Set(monthDates).size,
    consecutiveDays: getConsecutiveDays(dates),
  };
};
