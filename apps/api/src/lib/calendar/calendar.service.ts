import { addDays, addHours } from 'date-fns';

function generateEventsWithFlexibleHours(course: any) {
  const events = [];
  const startHour = 8;  // Перший прийом о 08:00
  const endHour = 22;   // Останній прийом не пізніше 22:00
  const availableHours = endHour - startHour;

  for (let day = 0; day < course.Period_courses; day++) {
    const currentDay = addDays(new Date(course.StartDate), day);

    for (let i = 0; i < course.Quantity_day; i++) {
      // Обчислюємо інтервал: якщо 8 прийомів, вони будуть кожні ~2 години
      const hourOffset = course.Quantity_day > 1 
        ? (i * (availableHours / (course.Quantity_day - 1))) 
        : 0;

      events.push({
        title: `💊 Прийом: ${course.Name_doctor}`,
        start: addHours(currentDay, startHour + hourOffset),
        end: addHours(currentDay, startHour + hourOffset + 0.5), // 30 хв на подію
        allDay: false
      });
    }
  }
  return events;
}