import { addDays, addMinutes, format } from 'date-fns';

interface CalendarCourseLike {
  Id: bigint | number;
  Name_doctor: string;
  Period_courses: number;
  Quantity_day: number;
  Status?: string;
  Dose_times?: unknown;
  Start_date: Date | string;
  tabletos_id?: bigint | number;
}

export type CourseDoseState = 'scheduled' | 'taken' | 'missed' | 'skipped';

export interface CourseDoseLogLike {
  courseId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  state: Exclude<CourseDoseState, 'scheduled'>;
}

export interface CalendarEventDto {
  id: string;
  courseId: string;
  medicineId: string;
  medicineName: string;
  doctorName: string;
  title: string;
  doseTime: string;
  status: CourseDoseState;
  start: string;
  end: string;
  allDay: boolean;
}

function toDateKey(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getDoseTimesByQuantity(quantityDay: number): string[] {
  if (quantityDay <= 1) return ['08:00'];
  if (quantityDay === 2) return ['08:00', '20:00'];
  if (quantityDay === 3) return ['08:00', '14:00', '20:00'];

  const startMinutes = 8 * 60;
  const endMinutes = 22 * 60;
  const span = endMinutes - startMinutes;
  const step = span / (quantityDay - 1);

  return Array.from({ length: quantityDay }, (_, index) => {
    const minutes = Math.round(startMinutes + index * step);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  });
}

export function normalizeCourseDoseTimes(
  rawDoseTimes: unknown,
  quantityDay: number,
): string[] {
  if (!Array.isArray(rawDoseTimes)) {
    return getDoseTimesByQuantity(quantityDay);
  }

  const normalized = rawDoseTimes
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => isValidTime(item));

  const uniqueSorted = Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b));
  if (uniqueSorted.length > 0) return uniqueSorted;
  return getDoseTimesByQuantity(quantityDay);
}

export function computeCourseEndDate(course: CalendarCourseLike): Date | null {
  const startDate = new Date(course.Start_date);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const normalizedDays = Math.max(1, Number(course.Period_courses) || 1);
  return addDays(startDate, normalizedDays - 1);
}

function applyTimeToDay(day: Date, time: string): Date {
  const [hh, mm] = time.split(':').map((v) => Number(v));
  const value = new Date(day);
  value.setHours(hh, mm, 0, 0);
  return value;
}

function isDateWithinRange(value: Date, from?: Date, to?: Date): boolean {
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

function toLogMapKey(courseId: string, dateKey: string, time: string): string {
  return `${courseId}|${dateKey}|${time}`;
}

export function buildDoseLogMap(logs: CourseDoseLogLike[]): Map<string, CourseDoseLogLike['state']> {
  return new Map(
    logs.map((log) => [toLogMapKey(log.courseId, log.date, log.time), log.state] as const),
  );
}

export function generateCourseCalendarEvents(
  course: CalendarCourseLike,
  options: {
    from?: Date;
    to?: Date;
    medicineName?: string;
    logStateByKey?: Map<string, CourseDoseLogLike['state']>;
  } = {},
): CalendarEventDto[] {
  const startDate = new Date(course.Start_date);
  const endDate = computeCourseEndDate(course);
  if (Number.isNaN(startDate.getTime()) || !endDate) return [];

  const events: CalendarEventDto[] = [];
  const normalizedDays = Math.max(1, Number(course.Period_courses) || 1);
  const doseTimes = normalizeCourseDoseTimes(course.Dose_times, course.Quantity_day);
  const medicineName = options.medicineName?.trim() || 'Невідомий препарат';

  for (let dayIndex = 0; dayIndex < normalizedDays; dayIndex += 1) {
    const currentDay = addDays(startDate, dayIndex);
    const dayStart = new Date(currentDay);
    dayStart.setHours(0, 0, 0, 0);
    if (!isDateWithinRange(dayStart, options.from, options.to)) {
      continue;
    }

    for (const doseTime of doseTimes) {
      const eventStart = applyTimeToDay(currentDay, doseTime);
      const eventEnd = addMinutes(eventStart, 30);
      const dateKey = toDateKey(currentDay);
      const courseId = String(course.Id);
      const logKey = toLogMapKey(courseId, dateKey, doseTime);
      const state = options.logStateByKey?.get(logKey) ?? 'scheduled';

      events.push({
        id: `${courseId}-${dateKey}-${doseTime}`,
        courseId,
        medicineId: String(course.tabletos_id ?? ''),
        medicineName,
        doctorName: course.Name_doctor,
        title: `Прийом: ${medicineName}`,
        doseTime,
        status: state,
        start: eventStart.toISOString(),
        end: eventEnd.toISOString(),
        allDay: false,
      });
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
