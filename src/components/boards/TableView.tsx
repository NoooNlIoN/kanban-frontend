import { useState, useMemo } from 'react';
import type { Column, Card, Member } from '../../api/types';
import UserAvatar from '../common/UserAvatar';

interface TableViewProps {
  columns: Column[];
  onOpenCardDetails?: (card: Card, columnId: number) => void;
  members?: Member[];
}

interface CardWithColumn extends Card {
  columnTitle: string;
  columnId: number;
}

type SortField = 'title' | 'columnTitle' | 'deadline' | 'completed' | 'none';
type SortDirection = 'asc' | 'desc';

const TableView: React.FC<TableViewProps> = ({ columns, onOpenCardDetails, members }) => {
  const [filterText, setFilterText] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('all');
  const [filterCompleted, setFilterCompleted] = useState<string>('all');
  const [filterDeadline, setFilterDeadline] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Преобразуем все карточки из разных колонок в плоский массив с дополнительной информацией
  const allCards = useMemo(() => {
    const cards: CardWithColumn[] = [];
    columns.forEach(column => {
      column.cards.forEach(card => {
        cards.push({
          ...card,
          columnTitle: column.title,
          columnId: column.id
        });
      });
    });
    return cards;
  }, [columns]);

  // Собираем всех пользователей из всех карточек для отображения аватаров
  const allUsers = useMemo(() => {
    const usersMap = new Map();
    
    // Если передан массив участников доски, используем его
    if (members && Array.isArray(members)) {
      members.forEach(member => {
        if (member && typeof member === 'object' && 'id' in member) {
          usersMap.set(member.id, member);
        }
      });
    }
    
    // Дополнительно собираем пользователей из карточек
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.assigned_users && Array.isArray(card.assigned_users)) {
          card.assigned_users.forEach(user => {
            if (typeof user === 'object' && user !== null && 'id' in user) {
              usersMap.set(user.id, user);
            }
          });
        }
      });
    });
    
    return Array.from(usersMap.values());
  }, [columns, members]);

  // Фильтруем карточки по введенному тексту, колонке, статусу выполнения и сроку
  const filteredCards = useMemo(() => {
    const filtered = allCards.filter(card => {
      // Фильтр по тексту
      const matchesText = 
        card.title.toLowerCase().includes(filterText.toLowerCase()) || 
        (card.description && card.description.toLowerCase().includes(filterText.toLowerCase()));
      
      // Фильтр по колонке
      const matchesColumn = filterColumn === 'all' || card.columnTitle === filterColumn;
      
      // Фильтр по статусу выполнения
      const matchesCompleted = 
        filterCompleted === 'all' || 
        (filterCompleted === 'completed' && card.completed) || 
        (filterCompleted === 'not_completed' && !card.completed);
        
      // Фильтр по сроку выполнения
      let matchesDeadline = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      if (filterDeadline !== 'all') {
        if (!card.deadline) {
          matchesDeadline = filterDeadline === 'no_deadline';
        } else {
          const deadlineDate = new Date(card.deadline);
          deadlineDate.setHours(0, 0, 0, 0);
          
          switch (filterDeadline) {
            case 'today':
              matchesDeadline = deadlineDate.getTime() === today.getTime();
              break;
            case 'tomorrow':
              matchesDeadline = deadlineDate.getTime() === tomorrow.getTime();
              break;
            case 'this_week':
              matchesDeadline = deadlineDate >= today && deadlineDate < nextWeek;
              break;
            case 'overdue':
              matchesDeadline = deadlineDate < today && !card.completed;
              break;
            case 'has_deadline':
              matchesDeadline = true; // Уже проверили, что deadline существует
              break;
            case 'no_deadline':
              matchesDeadline = false; // Уже проверили, что deadline существует
              break;
          }
        }
      }
        
      return matchesText && matchesColumn && matchesCompleted && matchesDeadline;
    });
    
    // Сортировка
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'columnTitle':
            comparison = a.columnTitle.localeCompare(b.columnTitle);
            break;
          case 'completed':
            comparison = (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
            break;
          case 'deadline':
            // Если один из сроков отсутствует
            if (!a.deadline && !b.deadline) comparison = 0;
            else if (!a.deadline) comparison = 1;
            else if (!b.deadline) comparison = -1;
            else comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [allCards, filterText, filterColumn, filterCompleted, filterDeadline, sortField, sortDirection]);

  // Получаем уникальные названия колонок для фильтра
  const uniqueColumns = useMemo(() => {
    return [...new Set(columns.map(column => column.title))];
  }, [columns]);

  // Обработчик клика по карточке
  const handleCardClick = (card: CardWithColumn) => {
    if (onOpenCardDetails) {
      onOpenCardDetails(card, card.columnId);
    }
  };

  // Обработчик клика по заголовку для сортировки
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Если уже сортируем по этому полю, меняем направление
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Иначе устанавливаем новое поле сортировки и сбрасываем направление
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Рендер иконки сортировки
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1 inline-block">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Фильтры */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          {/* Поиск по тексту */}
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Поиск задач..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Фильтр по колонке */}
          <div className="w-48">
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все колонки</option>
              {uniqueColumns.map(column => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>
          
          {/* Фильтр по статусу выполнения */}
          <div className="w-48">
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все задачи</option>
              <option value="completed">Выполненные</option>
              <option value="not_completed">Невыполненные</option>
            </select>
          </div>
          
          {/* Фильтр по сроку выполнения */}
          <div className="w-48">
            <select
              value={filterDeadline}
              onChange={(e) => setFilterDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Любой срок</option>
              <option value="today">Сегодня</option>
              <option value="tomorrow">Завтра</option>
              <option value="this_week">Эта неделя</option>
              <option value="overdue">Просроченные</option>
              <option value="has_deadline">Есть срок</option>
              <option value="no_deadline">Без срока</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('title')}
              >
                Название {renderSortIcon('title')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('columnTitle')}
              >
                Колонка {renderSortIcon('columnTitle')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Описание
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('deadline')}
              >
                Срок {renderSortIcon('deadline')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('completed')}
              >
                Статус {renderSortIcon('completed')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Метка
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ответственные
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCards.length > 0 ? (
              filteredCards.map(card => (
                <tr 
                  key={card.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {card.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.columnTitle}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {card.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.deadline ? new Date(card.deadline).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.completed ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Выполнено
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        В работе
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.color ? (
                      <div 
                        className="w-4 h-4 rounded-full inline-block" 
                        style={{ backgroundColor: card.color }} 
                      />
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.assigned_users && card.assigned_users.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden">
                        {card.assigned_users.map(userIdOrObject => {
                          // Определяем ID пользователя
                          const userId = typeof userIdOrObject === 'object' ? userIdOrObject.id : userIdOrObject;
                          
                          // Находим данные о пользователе
                          let username = `Пользователь ${userId}`;
                          if (typeof userIdOrObject === 'object' && userIdOrObject.username) {
                            username = userIdOrObject.username;
                          } else {
                            const foundUser = allUsers.find(u => u.id === userId);
                            if (foundUser) {
                              username = foundUser.username;
                            }
                          }
                          
                          return (
                            <UserAvatar 
                              key={`table-avatar-${userId}`}
                              username={username}
                              id={userId}
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Нет задач, соответствующих критериям поиска
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView; 