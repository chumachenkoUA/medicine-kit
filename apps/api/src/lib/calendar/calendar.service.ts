import { addDays, addHours } from 'date-fns';

interface CalendarCourseLike {
  Id: bigint | number;
  Name_doctor: string;
  Period_courses: number;
  Quantity_day: number;
  Start_date: Date | string;
}

export interface CalendarEventDto {
  courseId: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

export function generateEventsWithFlexibleHours(course: CalendarCourseLike): CalendarEventDto[] {
  const events = [];
  const startHour = 8;  // Перший прийом о 08:00
  const endHour = 22;   // Останній прийом не пізніше 22:00
  const availableHours = endHour - startHour;
  const startDate = new Date(course.Start_date);

  if (Number.isNaN(startDate.getTime())) {
    return [];
  }

  for (let day = 0; day < course.Period_courses; day++) {
    const currentDay = addDays(startDate, day);

    for (let i = 0; i < course.Quantity_day; i++) {
      // Обчислюємо інтервал: якщо 8 прийомів, вони будуть кожні ~2 години
      const hourOffset = course.Quantity_day > 1 
        ? (i * (availableHours / (course.Quantity_day - 1))) 
        : 0;
      const eventStart = addHours(currentDay, startHour + hourOffset);
      const eventEnd = addHours(currentDay, startHour + hourOffset + 0.5);

      events.push({
        courseId: String(course.Id),
        title: `Прийом: ${course.Name_doctor}`,
        start: eventStart.toISOString(),
        end: eventEnd.toISOString(), // 30 хв на подію
        allDay: false
      });
    }
  }
  return events;
}
