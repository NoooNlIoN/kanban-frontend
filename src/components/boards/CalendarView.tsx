import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Column } from '../../api/types';

const locales = {
  'ru-RU': ru,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Настройка русскоязычных сообщений
const messages = {
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  allDay: 'Весь день',
  week: 'Неделя',
  work_week: 'Рабочая неделя',
  day: 'День',
  month: 'Месяц',
  previous: 'Назад',
  next: 'Вперед',
  yesterday: 'Вчера',
  tomorrow: 'Завтра',
  today: 'Сегодня',
  agenda: 'Повестка',
  noEventsInRange: 'Нет событий в указанном диапазоне.',
  showMore: (total: number) => `+${total} ещё`,
}

interface CalendarViewProps {
  columns: Column[];
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  color?: string;
  column_id: number;
}

const CalendarView: React.FC<CalendarViewProps> = ({ columns }) => {
  // Преобразуем карточки из колонок в события календаря
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    columns.forEach(column => {
      column.cards.forEach(card => {
        // Показываем только карточки с дедлайном
        if (card.deadline) {
          const deadlineDate = new Date(card.deadline);
          
          // Создаем событие календаря
          calendarEvents.push({
            id: card.id,
            title: card.title,
            start: deadlineDate,
            end: new Date(deadlineDate.getTime() + 60 * 60 * 1000), // Добавляем 1 час к дедлайну для отображения
            allDay: false,
            color: card.color,
            column_id: column.id
          });
        }
      });
    });
    
    return calendarEvents;
  }, [columns]);

  // Дополнительные стили для событий
  const eventStyleGetter = (event: CalendarEvent) => {
    let style: React.CSSProperties = {
      backgroundColor: event.color || '#0074ff',
      borderRadius: '4px',
      color: '#fff',
      border: 'none',
      display: 'block',
      padding: '2px 5px',
      fontSize: '90%'
    };
    
    // Маркируем выполненные задачи
    const column = columns.find(col => col.id === event.column_id);
    const card = column?.cards.find(c => c.id === event.id);
    
    if (card && card.completed) {
      style = {
        ...style,
        backgroundColor: '#4caf50',
        textDecoration: 'line-through',
        opacity: 0.8
      };
    }
    
    return {
      style
    };
  };

  return (
    <div className="h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        messages={messages}
        eventPropGetter={eventStyleGetter}
        style={{ height: 'calc(100vh - 200px)' }}
        views={['month', 'week', 'day', 'agenda']}
        defaultView='month'
        popup
        selectable
        culture="ru-RU"
      />
    </div>
  );
};

export default CalendarView; 