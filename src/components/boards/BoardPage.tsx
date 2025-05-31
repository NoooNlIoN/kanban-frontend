import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import boardService from '../../api/boardService';
import type { BoardComplete, Card, Column, UserRole, Member } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import PermissionsModal from './PermissionsModal';
import CardDetailModal from './CardDetailModal';
import CalendarView from './CalendarView';
import TableView from './TableView';
import DashboardView from './DashboardView';
import UsersSidebar from './UsersSidebar';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  MeasuringStrategy,
  closestCorners,
} from '@dnd-kit/core';
import type { 
  DragStartEvent as DndDragStartEvent, 
  DragEndEvent as DndDragEndEvent, 
  DragOverEvent, 
  CollisionDetection 
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { SortableColumn } from './SortableColumn';
import UserAvatar from '../common/UserAvatar';

// Определяем локальные типы для событий DnD, так как они не экспортируются напрямую
interface DragStartEvent {
  active: {
    id: string | number;
    data?: {
      current?: {
        type?: string;
        columnId?: number;
      }
    }
  };
}

interface DragEndEvent {
  active: {
    id: string | number;
    data?: {
      current?: {
        type?: string;
        columnId?: number;
      }
    }
  };
  over?: {
    id: string | number;
    data?: {
      current?: {
        type?: string;
        columnId?: number;
      }
    }
  } | null;
}

// Вспомогательные функции для работы с идентификаторами
const getItemType = (id: string) => {
  if (id.startsWith('column-')) return 'column';
  if (id.startsWith('card-')) return 'card';
  return 'unknown';
};

const getOriginalId = (id: string) => {
  const parts = id.split('-');
  return parseInt(parts[1]);
};

const createColumnId = (id: number) => `column-${id}`;
const createCardId = (id: number) => `card-${id}`;

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boardComplete, setBoardComplete] = useState<BoardComplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  // Новое состояние для отслеживания позиции перетаскивания
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetType, setDropTargetType] = useState<'card' | 'column' | null>(null);
  // Новые состояния для боковой панели и модального окна
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  
  // Состояние для отслеживания режима просмотра: 'kanban', 'calendar' или 'table'
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'table' | 'dashboard'>('kanban');

  // Настройка сенсоров и измерения для перетаскивания
  const [activeId, setActiveId] = useState<string | null>(null);
  const [clonedItems, setClonedItems] = useState<Column[] | null>(null);
  const lastOverId = useRef<string | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { 
        distance: 10, // Увеличиваем минимальное расстояние для активации перетаскивания
        tolerance: 5, // Оставляем толерантность для активации
        delay: 100 // Добавляем задержку для предотвращения случайного перетаскивания
      } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  // Получаем сортированные колонки для улучшения производительности при перетаскивании
  const sortedColumns = useMemo(() => {
    return boardComplete ? [...boardComplete.columns].sort((a, b) => a.order - b.order) : [];
  }, [boardComplete]);

  // Определяем роль текущего пользователя на доске
  const currentUserRole = useMemo<UserRole>(() => {
    if (!boardComplete || !user) return 'member';
    
    // Проверяем, является ли текущий пользователь владельцем доски
    if (boardComplete.owner_id === user.id) {
      return 'owner';
    }
    
    // Ищем пользователя в списке участников
    const currentMember = boardComplete.members.find(member => member.id === user.id);
    return currentMember?.role as UserRole || 'member';
  }, [boardComplete, user]);
  
  // Проверка прав доступа
  const canEdit = useMemo(() => {
    return currentUserRole === 'owner' || currentUserRole === 'admin' || 
           (boardComplete?.permissions?.can_edit || false);
  }, [currentUserRole, boardComplete]);
  
  const canDelete = useMemo(() => {
    return currentUserRole === 'owner' || 
           (boardComplete?.permissions?.can_delete || false);
  }, [currentUserRole, boardComplete]);
  
  const canManageUsers = useMemo(() => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  }, [currentUserRole]);

  // Добавляем состояние для модального окна с детальной информацией о карточке
  const [isCardDetailModalOpen, setIsCardDetailModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedCardColumnId, setSelectedCardColumnId] = useState<number | null>(null);

  // Добавляем новое состояние для боковой панели пользователей
  const [isUsersSidebarOpen, setIsUsersSidebarOpen] = useState(false);

  useEffect(() => {
    if (boardId) {
      fetchBoardComplete(parseInt(boardId));
    }
  }, [boardId]);

  // Функция для получения полной информации о доске через API
  const fetchBoardComplete = async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await boardService.getBoardComplete(id);
      
      // Дополнительный запрос для получения актуального списка пользователей
      try {
        const usersResponse = await boardService.getBoardUsers(id);
        let boardUsers: Member[] = [];
        
        if (Array.isArray(usersResponse)) {
          boardUsers = usersResponse;
        } else if (usersResponse && 'users' in usersResponse && Array.isArray(usersResponse.users)) {
          boardUsers = usersResponse.users;
        }
        
        // Обновляем данные с актуальным списком пользователей
        data.members = boardUsers;
      } catch (userErr) {
        console.error('Ошибка при загрузке пользователей доски:', userErr);
      }
      
      setBoardComplete(data);
      setEditForm({ title: data.title, description: data.description });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке доски');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardComplete || !boardId) return;

    try {
      const updatedBoard = await boardService.updateBoard(parseInt(boardId), editForm);
      setBoardComplete({
        ...boardComplete,
        title: updatedBoard.title,
        description: updatedBoard.description,
        updated_at: updatedBoard.updated_at
      });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении доски');
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardComplete || !boardId) return;

    if (window.confirm('Вы уверены, что хотите удалить эту доску?')) {
      try {
        await boardService.deleteBoard(parseInt(boardId));
        navigate('/boards');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при удалении доски');
      }
    }
  };

  // Обработчик для обновления доски после изменения прав доступа
  const handleBoardUpdate = useCallback(() => {
    if (boardId) {
      // Обновляем только необходимые данные о разрешениях, а не всю доску
      const updatePermissions = async () => {
        try {
          // Получаем только роль текущего пользователя через API пользователей доски
          const usersResponse = await boardService.getBoardUsers(parseInt(boardId));
          
          let boardUsers: Member[] = [];
          if (Array.isArray(usersResponse)) {
            boardUsers = usersResponse;
          } else if (usersResponse && 'users' in usersResponse && Array.isArray(usersResponse.users)) {
            boardUsers = usersResponse.users;
          }
          
          if (boardComplete && user) {
            // Находим текущего пользователя в списке
            const currentMember = boardUsers.find(member => member.id === user.id);
            const newRole = currentMember?.role || 'member';
            
            // Обновляем только members и permissions в boardComplete
            setBoardComplete(prev => {
              if (!prev) return prev;
              
              return {
                ...prev,
                members: boardUsers
              };
            });
          }
        } catch (error) {
          console.error('Ошибка при обновлении разрешений:', error);
          // В случае ошибки, обновляем всю доску
          if (boardId) {
            fetchBoardComplete(parseInt(boardId));
          }
        }
      };
      
      updatePermissions();
    }
  }, [boardId, boardComplete, user]);

  // Создание новой колонки
  const handleCreateColumn = async () => {
    if (!boardComplete || !boardId || !newColumnTitle.trim()) return;

    try {
      const order = boardComplete.columns.length;
      const newColumn = await boardService.createColumn(
        parseInt(boardId),
        { title: newColumnTitle, order }
      );
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: [...boardComplete.columns, newColumn]
      });
      
      setNewColumnTitle('');
      setIsAddingColumn(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании колонки');
    }
  };

  // Проверка доступности действий для текущего пользователя
  const checkPermission = useCallback((action: 'edit' | 'delete' | 'create_column' | 'create_card' | 'toggle_complete'): boolean => {
    if (!user || !boardComplete) return false;
    
    switch (action) {
      case 'edit':
      case 'create_column':
      case 'create_card':
        return canEdit;
      
      case 'delete':
        return canDelete;
      
      case 'toggle_complete':
        // Все пользователи могут отмечать карточки как выполненные
        return true;
      
      default:
        return false;
    }
  }, [user, boardComplete, canEdit, canDelete]);

  // Кастомное обнаружение коллизий для улучшения DnD
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // Если активного элемента нет, используем обычное определение коллизий
      if (!activeId) {
        return closestCenter(args);
      }

      // Получаем все коллизии
      const pointerCollisions = pointerWithin(args);
      const intersections = rectIntersection(args);
      const collisions = [...pointerCollisions, ...intersections];

      // Если коллизий нет, возвращаем пустой массив
      if (!collisions.length) return [];

      // Определяем тип активного элемента
      const isColumn = getItemType(activeId.toString()) === 'column';

      if (isColumn) {
        // Для колонок используем комбинированный подход для более точного определения
        const closestCollisions = closestCorners(args);
        
        // Если мышь находится над коллизией, приоритезируем её
        if (pointerCollisions.length > 0) {
          // Возвращаем только ближайшую коллизию под указателем
          return [pointerCollisions[0]];
        }
        
        return closestCollisions;
      }

      // Логика для карточек (можно доработать потом)
      return collisions;
    },
    [activeId, getItemType]
  );

  // Обновляем обработчик начала перетаскивания
  const handleDragStart = useCallback((event: DndDragStartEvent) => {
    console.log('DragStart event запущен:', event);
    
    if (!boardComplete) {
      console.error('boardComplete не определен в handleDragStart');
      return;
    }
    
    const { active } = event;
    const activeId = active.id.toString();
    setActiveId(activeId);
    
    // Определяем тип перетаскиваемого элемента
    if (activeId.startsWith('user-')) {
      // Пользователь перетаскивается
      console.log('Перетаскивание пользователя:', active.data?.current);
      return;
    }
    
    // Для колонок и карточек используем существующую логику
    const itemType = getItemType(activeId);
    
    console.log('Drag start:', { activeId, itemType, data: active.data });
    
    if (itemType === 'column') {
      const columnId = getOriginalId(activeId);
      const activeColumn = boardComplete.columns.find(col => col.id === columnId);
      if (activeColumn) {
        setActiveColumn(activeColumn);
        console.log('Перетаскивание колонки:', activeColumn);
      } else {
        console.error(`Не найдена колонка с id=${columnId}`);
      }
    } else if (itemType === 'card') {
      const cardId = getOriginalId(activeId);
      // Безопасно получаем columnId из данных события
      const columnId = active.data?.current?.columnId;
      if (columnId === undefined) {
        console.error('columnId не найден в active.data:', active.data);
        return;
      }
      
      const column = boardComplete.columns.find(col => col.id === columnId);
      if (!column) {
        console.error(`Не найдена колонка с id=${columnId}`);
        return;
      }
      
      const activeCard = column.cards.find(card => card.id === cardId);
      if (activeCard) {
        setActiveCard(activeCard);
        console.log('Перетаскивание карточки:', activeCard, 'из колонки:', column);
      } else {
        console.error(`Не найдена карточка с id=${cardId} в колонке id=${columnId}`);
      }
    }
  }, [boardComplete]);

  // Добавим обработчик события DragOver
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    if (!over) {
      setDropTargetId(null);
      setDropTargetType(null);
      return;
    }
    
    const overId = over.id.toString();
    const overType = getItemType(overId);
    
    setDropTargetId(overId);
    setDropTargetType(overType as 'card' | 'column');
  }, []);

  // Обновляем обработчик завершения перетаскивания
  const handleDragEnd = useCallback(async (event: DndDragEndEvent) => {
    // Сбрасываем индикаторы
    setDropTargetId(null);
    setDropTargetType(null);
    setActiveId(null);
    
    const { active, over } = event;
    
    console.log('Drag end:', { 
      activeId: active.id, 
      overId: over?.id, 
      activeData: active.data,
      overData: over?.data
    });
    
    // Если нет целевого элемента или нет доски - выходим
    if (!over || !boardComplete || !boardId) {
      setActiveColumn(null);
      setActiveCard(null);
      return;
    }
    
    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    // Обработка перетаскивания пользователя на карточку
    if (activeId.startsWith('user-') && overId.startsWith('card-droppable-')) {
      const userId = parseInt(activeId.replace('user-', ''));
      const cardId = parseInt(overId.replace('card-droppable-', ''));
      const columnId = over.data?.current?.columnId;
      
      if (!columnId) {
        console.error('columnId не найден в over.data:', over.data);
        return;
      }
      
      console.log('Назначение пользователя на карточку:', { userId, cardId, columnId });
      
      try {
        // Проверяем, имеет ли текущий пользователь права на назначение
        if (!canEdit) {
          console.error('Недостаточно прав для назначения пользователя на карточку');
          return;
        }
        
        await boardService.assignUserToCard(parseInt(boardId), columnId, cardId, userId);
        
        // Обновляем состояние доски
        const updatedColumns = boardComplete.columns.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              cards: col.cards.map(card => {
                if (card.id === cardId) {
                  // Находим пользователя в списке участников доски
                  const assignedUser = boardComplete.members.find(member => member.id === userId);
                  
                  if (!assignedUser) {
                    return card;
                  }
                  
                  // Проверяем, есть ли уже такой пользователь в списке назначенных
                  const isAlreadyAssigned = card.assigned_users?.some(user => {
                    if (typeof user === 'object' && user !== null) {
                      return user.id === userId;
                    }
                    return user === userId;
                  });
                  
                  if (isAlreadyAssigned) {
                    return card;
                  }
                  
                  // Добавляем пользователя в список назначенных
                  return {
                    ...card,
                    assigned_users: [
                      ...(card.assigned_users || []),
                      assignedUser
                    ]
                  };
                }
                return card;
              })
            };
          }
          return col;
        });
        
        setBoardComplete({
          ...boardComplete,
          columns: updatedColumns
        });
        
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при назначении пользователя на карточку');
      }
      
      return;
    }
    
    // Обработка перетаскивания колонок и карточек (существующий код)
    const itemType = getItemType(activeId);
    
    if (itemType === 'column') {
      // Обработка перетаскивания колонок
      if (getItemType(overId) !== 'column') {
        setActiveColumn(null);
        return;
      }
      
      const activeColumnId = getOriginalId(activeId);
      const overColumnId = getOriginalId(overId);
      
      // Если колонка перетаскивается на саму себя - выходим
      if (activeColumnId === overColumnId) {
        setActiveColumn(null);
        return;
      }
      
      console.log('Перемещение колонки:', { activeColumnId, overColumnId });
      
      // Находим индексы для перемещения
      const oldIndex = sortedColumns.findIndex(col => col.id === activeColumnId);
      const newIndex = sortedColumns.findIndex(col => col.id === overColumnId);
      
      console.log('Индексы колонок:', { oldIndex, newIndex });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Создаем новый порядок колонок с использованием библиотечной функции arrayMove
        // которая корректно обрабатывает вставку элемента в новую позицию
        const newColumns = arrayMove(sortedColumns, oldIndex, newIndex);
        
        // Обновляем порядковые номера колонок
        const columnsWithNewPositions = newColumns.map((col, index) => ({
          ...col,
          order: index // Важно пересчитать порядок для всех колонок
        }));
        
        // Обновляем состояние доски сразу для мгновенного визуального отображения
        setBoardComplete({
          ...boardComplete,
          columns: columnsWithNewPositions
        });
        
        // Отправляем обновленные позиции на сервер
        try {
          // Сервер ожидает только массив ID колонок в новом порядке
          await boardService.updateColumns(
            parseInt(boardId),
            {
              column_order: columnsWithNewPositions.map(col => col.id)
            }
          );
          
          console.log('Порядок колонок успешно обновлен:', columnsWithNewPositions.map(c => c.id));
        } catch (err: any) {
          console.error('Ошибка при обновлении порядка колонок:', err);
          setError(err.response?.data?.detail || 'Ошибка при обновлении позиций колонок');
          
          // В случае ошибки обновляем доску с сервера для синхронизации состояния
          if (boardId) {
            try {
              await fetchBoardComplete(parseInt(boardId));
            } catch (fetchErr) {
              console.error('Не удалось обновить состояние доски после ошибки:', fetchErr);
            }
          }
        }
      } else {
        console.warn('Не найдены индексы для перемещения колонок:', { oldIndex, newIndex });
      }
      
      setActiveColumn(null);
    } else if (itemType === 'card') {
      // Обработка перетаскивания карточек
      const cardId = getOriginalId(activeId);
      const sourceColumnId = active.data?.current?.columnId;
      
      if (!sourceColumnId) {
        console.error('Отсутствует sourceColumnId в event.active.data', active.data);
        setActiveCard(null);
        return;
      }
      
      const targetId = overId;
      const targetType = getItemType(targetId);
      let targetColumnId: number;
      let newPosition: number;
      
      if (targetType === 'card') {
        // Карточка перетащена на другую карточку
        const overCardId = getOriginalId(targetId);
        const overColumnId = over.data?.current?.columnId;
        
        if (!overColumnId) {
          console.error('Отсутствует overColumnId в event.over.data', over.data);
          setActiveCard(null);
          return;
        }
        
        targetColumnId = overColumnId;
        
        // Находим все карточки в целевой колонке
        const targetColumn = boardComplete.columns.find(col => col.id === targetColumnId);
        if (!targetColumn) {
          setActiveCard(null);
          return;
        }
        
        // Сортируем карточки целевой колонки
        const sortedTargetCards = [...targetColumn.cards].sort((a, b) => a.order - b.order);
        
        // Находим индекс целевой карточки
        const overCardIndex = sortedTargetCards.findIndex(card => card.id === overCardId);
        
        if (sourceColumnId === targetColumnId) {
          // Перемещение в пределах одной колонки
          const sourceCardIndex = sortedTargetCards.findIndex(card => card.id === cardId);
          
          // Если карточка перетаскивается на то же место - выходим
          if (sourceCardIndex === overCardIndex) {
            setActiveCard(null);
            return;
          }
          
          // Удаляем карточку с исходной позиции и вставляем на новую
          const newCards = [...sortedTargetCards];
          const [movedCard] = newCards.splice(sourceCardIndex, 1);
          newCards.splice(overCardIndex, 0, movedCard);
          
          // Обновляем порядок карточек
          const cardsWithNewPositions = newCards.map((card, index) => ({
            ...card,
            order: index
          }));
          
          // Обновляем состояние доски
          const updatedColumns = boardComplete.columns.map(col => {
            if (col.id === targetColumnId) {
              return {
                ...col,
                cards: cardsWithNewPositions
              };
            }
            return col;
          });
          
          setBoardComplete({
            ...boardComplete,
            columns: updatedColumns
          });
          
          // Отправляем обновленные позиции на сервер
          try {
            await boardService.updateCards(
              parseInt(boardId),
              targetColumnId,
              {
                card_order: cardsWithNewPositions.map(card => card.id)
              }
            );
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка при обновлении позиций карточек');
          }
        } else {
          // Перемещение между колонками
          // Определяем новую позицию
          newPosition = overCardIndex;
          
          // Создаем новые массивы карточек для исходной и целевой колонок
          const sourceColumn = boardComplete.columns.find(col => col.id === sourceColumnId);
          if (!sourceColumn) {
            setActiveCard(null);
            return;
          }
          
          const sourceCards = [...sourceColumn.cards].sort((a, b) => a.order - b.order);
          const targetCards = [...sortedTargetCards];
          
          // Находим перемещаемую карточку и удаляем её из исходной колонки
          const sourceCardIndex = sourceCards.findIndex(card => card.id === cardId);
          if (sourceCardIndex === -1) {
            setActiveCard(null);
            return;
          }
          
          const [movedCard] = sourceCards.splice(sourceCardIndex, 1);
          
          // Добавляем карточку в целевую колонку
          targetCards.splice(overCardIndex, 0, movedCard);
          
          // Обновляем порядки карточек
          const updatedSourceCards = sourceCards.map((card, index) => ({
            ...card,
            order: index
          }));
          
          const updatedTargetCards = targetCards.map((card, index) => ({
            ...card,
            order: index
          }));
          
          // Обновляем состояние доски локально
          const updatedColumns = boardComplete.columns.map(col => {
            if (col.id === sourceColumnId) {
              return {
                ...col,
                cards: updatedSourceCards
              };
            }
            if (col.id === targetColumnId) {
              return {
                ...col,
                cards: updatedTargetCards
              };
            }
            return col;
          });
          
          setBoardComplete({
            ...boardComplete,
            columns: updatedColumns
          });
          
          // Отправляем запрос на перемещение карточки
          try {
            await boardService.moveCard(
              parseInt(boardId),
              cardId,
              {
                column_id: targetColumnId,
                order: newPosition
              }
            );
            
            // Не запрашиваем полное обновление доски через fetchBoardComplete
            // Доска уже обновлена локально
          } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка при перемещении карточки');
            // Если произошла ошибка, обновляем доску с сервера
            await fetchBoardComplete(parseInt(boardId));
          }
        }
      } else if (targetType === 'column') {
        // Карточка перетащена на колонку
        targetColumnId = getOriginalId(targetId);
        
        // Находим целевую колонку
        const targetColumn = boardComplete.columns.find(col => col.id === targetColumnId);
        if (!targetColumn) {
          setActiveCard(null);
          return;
        }
        
        const sourceColumn = boardComplete.columns.find(col => col.id === sourceColumnId);
        if (!sourceColumn) {
          setActiveCard(null);
          return;
        }
        
        // Добавляем карточку в конец колонки
        newPosition = targetColumn.cards.length;
        
        // Создаем новые массивы карточек для исходной и целевой колонок
        const sourceCards = [...sourceColumn.cards].sort((a, b) => a.order - b.order);
        const targetCards = [...targetColumn.cards].sort((a, b) => a.order - b.order);
        
        // Находим перемещаемую карточку и удаляем её из исходной колонки
        const sourceCardIndex = sourceCards.findIndex(card => card.id === cardId);
        if (sourceCardIndex === -1) {
          setActiveCard(null);
          return;
        }
        
        const [movedCard] = sourceCards.splice(sourceCardIndex, 1);
        
        // Добавляем карточку в целевую колонку
        targetCards.push(movedCard);
        
        // Обновляем порядки карточек
        const updatedSourceCards = sourceCards.map((card, index) => ({
          ...card,
          order: index
        }));
        
        const updatedTargetCards = targetCards.map((card, index) => ({
          ...card,
          order: index
        }));
        
        // Обновляем состояние доски локально
        const updatedColumns = boardComplete.columns.map(col => {
          if (col.id === sourceColumnId) {
            return {
              ...col,
              cards: updatedSourceCards
            };
          }
          if (col.id === targetColumnId) {
            return {
              ...col,
              cards: updatedTargetCards
            };
          }
          return col;
        });
        
        setBoardComplete({
          ...boardComplete,
          columns: updatedColumns
        });
        
        // Отправляем запрос на перемещение карточки
        try {
          await boardService.moveCard(
            parseInt(boardId),
            cardId,
            {
              column_id: targetColumnId,
              order: newPosition
            }
          );
          
          // Не запрашиваем полное обновление доски через fetchBoardComplete
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Ошибка при перемещении карточки');
          // Если произошла ошибка, обновляем доску с сервера
          await fetchBoardComplete(parseInt(boardId));
        }
      }
      
      setActiveCard(null);
    }
  }, [boardComplete, boardId, sortedColumns, canEdit]);

  const handleDeleteColumn = async (columnId: number) => {
    if (!boardComplete || !boardId) return;

    if (window.confirm('Вы уверены, что хотите удалить эту колонку и все её карточки?')) {
      try {
        await boardService.deleteColumn(parseInt(boardId), columnId);
        
        // Обновляем состояние доски
        setBoardComplete({
          ...boardComplete,
          columns: boardComplete.columns.filter(col => col.id !== columnId)
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при удалении колонки');
      }
    }
  };

  const handleUpdateColumnTitle = async (columnId: number, title: string) => {
    if (!boardComplete || !boardId) return;

    try {
      await boardService.updateColumn(parseInt(boardId), columnId, { title });
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => 
          col.id === columnId ? { ...col, title } : col
        )
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении названия колонки');
    }
  };

  const handleAddCard = async (columnId: number, cardTitle: string, cardDescription: string) => {
    if (!boardComplete || !boardId) return;

    try {
      // Находим колонку
      const column = boardComplete.columns.find(col => col.id === columnId);
      if (!column) return;
      
      // Определяем порядок новой карточки
      const order = column.cards.length;
      
      // Создаем карточку
      const newCard = await boardService.createCard(
        parseInt(boardId),
        columnId,
        { 
          title: cardTitle, 
          description: cardDescription,
          order 
        }
      );
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              cards: [...col.cards, newCard]
            };
          }
          return col;
        })
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании карточки');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!boardComplete || !boardId) return;

    // Находим колонку, которой принадлежит карточка
    let columnId: number | undefined;
    for (const column of boardComplete.columns) {
      if (column.cards.some(card => card.id === cardId)) {
        columnId = column.id;
        break;
      }
    }

    if (!columnId) return;

    try {
      await boardService.deleteCard(parseInt(boardId), cardId, columnId);
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => {
          if (col.id === columnId) {
            return {
              ...col,
              cards: col.cards.filter(card => card.id !== cardId)
            };
          }
          return col;
        })
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении карточки');
    }
  };

  const handleUpdateCard = async (cardId: number, cardData: { 
    title?: string; 
    description?: string; 
    color?: string;
    deadline?: string | null;
    completed?: boolean;
    assigned_users?: number[];
  }) => {
    if (!boardComplete || !boardId) return;

    console.log('handleUpdateCard вызван с данными:', cardData);
    
    // Находим колонку и карточку
    let targetColumn: Column | undefined;
    let targetCard: Card | undefined;

    for (const column of boardComplete.columns) {
      const card = column.cards.find(card => card.id === cardId);
      if (card) {
        targetColumn = column;
        targetCard = card;
        break;
      }
    }

    if (!targetColumn || !targetCard) return;

    try {
      // Создаем копию данных, которые мы собираемся отправить
      const dataToSend: any = { ...cardData };
      
      // Правильно обрабатываем значение deadline
      console.log('Исходный deadline в запросе:', dataToSend.deadline);
      
      if (dataToSend.deadline === null) {
        // Если deadline явно установлен в null, нужно удалить поле
        console.log('Удаляем поле deadline из запроса');
        delete dataToSend.deadline;
      }
      
      console.log('Отправляем данные на сервер:', dataToSend);
      
      const updatedCard = await boardService.updateCard(
        parseInt(boardId),
        cardId,
        targetColumn.id,
        dataToSend // Используем подготовленные данные
      );
      
      console.log('Получен ответ от сервера:', updatedCard);
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => {
          if (col.id === targetColumn?.id) {
            return {
              ...col,
              cards: col.cards.map(card => 
                card.id === cardId ? updatedCard : card
              )
            };
          }
          return col;
        })
      });
    } catch (err: any) {
      console.error('Ошибка при обновлении карточки:', err);
      setError(err.response?.data?.detail || 'Ошибка при обновлении карточки');
    }
  };

  const handleToggleCardCompleted = async (cardId: number, columnId?: number) => {
    if (!boardComplete || !boardId) return;

    // Если columnId не указан, найдем его
    let targetColumnId = columnId;
    if (!targetColumnId) {
      for (const column of boardComplete.columns) {
        if (column.cards.some(card => card.id === cardId)) {
          targetColumnId = column.id;
          break;
        }
      }
    }

    if (!targetColumnId) return;

    try {
      const updatedCard = await boardService.toggleCardCompleted(
        parseInt(boardId),
        targetColumnId,
        cardId
      );
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => {
          if (col.id === targetColumnId) {
            return {
              ...col,
              cards: col.cards.map(card => 
                card.id === cardId ? updatedCard : card
              )
            };
          }
          return col;
        })
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при изменении статуса выполнения карточки');
    }
  };

  // Обработчик для открытия модального окна с детальной информацией о карточке
  const handleOpenCardDetails = useCallback((card: Card, columnId: number) => {
    setSelectedCard(card);
    setSelectedCardColumnId(columnId);
    setIsCardDetailModalOpen(true);
  }, []);

  // Обработчик для обновления карточки без полной перезагрузки доски
  const handleCardDataChanged = useCallback((updatedCard: Card | null) => {
    if (!updatedCard || !boardComplete) return;
    
    // Проверяем, изменилась ли колонка карточки
    const currentColumnId = updatedCard.column_id;
    let originalColumnId: number | undefined;
    let cardFound = false;
    
    // Находим текущее положение карточки
    for (const column of boardComplete.columns) {
      if (column.cards.some(card => card.id === updatedCard.id)) {
        originalColumnId = column.id;
        cardFound = true;
        break;
      }
    }
    
    if (!cardFound) return; // Карточка не найдена в текущей доске
    
    // Если карточка перемещена в другую колонку
    if (originalColumnId !== currentColumnId) {
      const newColumns = boardComplete.columns.map(column => {
        // Удаляем карточку из исходной колонки
        if (column.id === originalColumnId) {
          return {
            ...column,
            cards: column.cards.filter(card => card.id !== updatedCard.id)
          };
        }
        
        // Добавляем карточку в новую колонку
        if (column.id === currentColumnId) {
          return {
            ...column,
            cards: [...column.cards, updatedCard]
          };
        }
        
        return column;
      });
      
      // Обновляем состояние доски
      setBoardComplete({
        ...boardComplete,
        columns: newColumns
      });
    } else {
      // Карточка осталась в той же колонке, просто обновляем её
      setBoardComplete({
        ...boardComplete,
        columns: boardComplete.columns.map(col => {
          if (col.id === currentColumnId) {
            return {
              ...col,
              cards: col.cards.map(card => 
                card.id === updatedCard.id ? updatedCard : card
              )
            };
          }
          return col;
        })
      });
    }
  }, [boardComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Ошибка</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/boards')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Вернуться к списку досок
          </button>
        </div>
      </div>
    );
  }

  if (!boardComplete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      {/* Заголовок и управление доской */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow">
        {isEditing ? (
          <form onSubmit={handleUpdateBoard} className="w-full">
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Название доски"
                required
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Описание доски"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{boardComplete.title}</h1>
              {boardComplete.description && (
                <p className="mt-1 text-sm text-gray-600">{boardComplete.description}</p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                Последнее обновление: {new Date(boardComplete.updated_at).toLocaleString()}
              </div>
            </div>
            <div className="flex space-x-2 mt-4 sm:mt-0">
              {checkPermission('edit') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Редактировать
                </motion.button>
              )}
              
              {checkPermission('delete') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteBoard}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                >
                  Удалить
                </motion.button>
              )}
              
              {/* Кнопка открытия боковой панели */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Настройки
              </motion.button>
              
              {/* Кнопка открытия панели пользователей */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsUsersSidebarOpen(true)}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Участники
              </motion.button>
            </div>
          </>
        )}
      </div>

      {/* Переключатель режимов просмотра */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Канбан
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Календарь
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Таблица
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Дашборд
          </button>
        </div>
      </div>

      {/* Содержимое доски с колонками и карточками */}
      <div className="mt-4">
        {viewMode === 'kanban' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            measuring={measuring}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-4 min-w-max">
              <SortableContext
                items={sortedColumns.map(col => createColumnId(col.id))}
                strategy={horizontalListSortingStrategy}
              >
                {sortedColumns.map(column => (
                  <SortableColumn
                    key={column.id}
                    id={createColumnId(column.id)}
                    column={column}
                    onDelete={() => handleDeleteColumn(column.id)}
                    onUpdateTitle={(title) => handleUpdateColumnTitle(column.id, title)}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                    onUpdateCard={(cardId, cardData) => {
                      console.log('CardDetailModal вызвал onUpdateCard с данными:', cardData);
                      handleUpdateCard(cardId, cardData);
                    }}
                    onToggleCompleted={handleToggleCardCompleted}
                    createCardId={createCardId}
                    canEdit={checkPermission('edit')}
                    canToggleComplete={checkPermission('toggle_complete')}
                    isDropTarget={dropTargetType === 'column' && dropTargetId === createColumnId(column.id)}
                    dropTargetId={dropTargetId || ''}
                    onOpenCardDetails={handleOpenCardDetails}
                    users={boardComplete?.members || []}
                  />
                ))}
              </SortableContext>
              
              {/* Кнопка добавления колонки */}
              {checkPermission('create_column') && (
                isAddingColumn ? (
                  <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="p-2">
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Название колонки"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            e.preventDefault();
                            setIsAddingColumn(false);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleCreateColumn();
                          }}
                          disabled={!newColumnTitle.trim()}
                          className={`px-3 py-1 rounded-md ${
                            newColumnTitle.trim()
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Добавить
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsAddingColumn(true);
                      }}
                      className="w-full py-2 px-3 text-sm text-gray-600 hover:bg-gray-200 rounded-md text-left"
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Добавить колонку
                      </span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
            
          {/* DragOverlay для перетаскиваемых элементов */}
          <DragOverlay>
            {activeColumn && (
              <div className="bg-gray-100 rounded-lg p-3 w-72 opacity-80 shadow-md">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-1">{activeColumn.title}</h3>
                <div className="overflow-y-auto max-h-[calc(100vh-240px)]">
                  {activeColumn.cards
                    .sort((a, b) => a.order - b.order)
                    .map(card => (
                      <div key={card.id} className="bg-white rounded-md shadow-sm mb-2 p-3">
                        <h4 className="text-sm font-medium text-gray-800">{card.title}</h4>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {activeCard && (
              <div className="bg-white rounded-md shadow-sm p-3 w-64 opacity-90">
                <h4 className="text-sm font-medium text-gray-800">{activeCard.title}</h4>
                {activeCard.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {activeCard.description.length > 50 
                      ? `${activeCard.description.substring(0, 50)}...` 
                      : activeCard.description}
                  </p>
                )}
              </div>
            )}
            {activeId && activeId.startsWith('user-') && boardComplete && (
              <div className="opacity-90">
                {(() => {
                  const userId = parseInt(activeId.replace('user-', ''));
                  const user = Array.isArray(boardComplete.members) ? 
                    boardComplete.members.find(member => member.id === userId) : 
                    null;
                  
                  if (user) {
                    return (
                      <UserAvatar
                        key={user.id}
                        username={user.username}
                        id={user.id}
                        size="md"
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </DragOverlay>
        </DndContext>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg shadow p-4">
            <CalendarView columns={sortedColumns} />
          </div>
        ) : viewMode === 'table' ? (
          <TableView 
            columns={sortedColumns} 
            onOpenCardDetails={handleOpenCardDetails}
            members={boardComplete?.members || []}
          />
        ) : (
          <DashboardView 
            columns={sortedColumns}
            boardId={parseInt(boardId || '0')}
          />
        )}
      </div>

      {/* Боковая панель и модальные окна */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenPermissionsModal={() => {
          setIsPermissionsModalOpen(true);
          setIsSidebarOpen(false);
        }}
        currentUserRole={currentUserRole}
      />
      
      {/* Боковая панель пользователей */}
      {user && (
        <UsersSidebar
          isOpen={isUsersSidebarOpen}
          members={Array.isArray(boardComplete?.members) ? boardComplete.members : []}
          currentUserId={user.id}
          onClose={() => setIsUsersSidebarOpen(false)}
        />
      )}
      
      {user && boardId && (
        <>
          <PermissionsModal 
            isOpen={isPermissionsModalOpen}
            onClose={() => setIsPermissionsModalOpen(false)}
            boardId={parseInt(boardId)}
            currentUserRole={currentUserRole}
            currentUserId={user.id}
            onBoardUpdate={handleBoardUpdate}
          />
          
          <CardDetailModal
            isOpen={isCardDetailModalOpen}
            onClose={() => setIsCardDetailModalOpen(false)}
            card={selectedCard}
            boardId={parseInt(boardId)}
            columnId={selectedCardColumnId || 0}
            columns={sortedColumns}
            users={boardComplete?.members || []}
            onUpdateCard={(cardId, cardData) => {
              console.log('CardDetailModal вызвал onUpdateCard с данными:', cardData);
              handleUpdateCard(cardId, cardData);
            }}
            onDeleteCard={handleDeleteCard}
            currentUserId={user.id}
            onCardChanged={handleCardDataChanged}
          />
        </>
      )}
    </div>
  );
};

export default BoardPage; 