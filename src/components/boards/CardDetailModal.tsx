import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import boardService from '../../api/boardService';
import type { Card, Comment, User, Column, Tag } from '../../api/types';
import { CheckCircle, Circle, Calendar, User as UserIcon, MessageSquare, X } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import TagBadge from '../common/TagBadge';

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  boardId: number;
  columnId: number;
  columns: Column[];
  users: User[];
  onUpdateCard: (cardId: number, cardData: {
    title?: string;
    description?: string;
    color?: string;
    deadline?: string | null;
    completed?: boolean;
    assigned_users?: number[];
  }) => void;
  onDeleteCard: (cardId: number) => void;
  currentUserId: number;
  onCardChanged?: (updatedCard: Card | null) => void;
}

interface ServerComment {
  id: number;
  text: string;
  card_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  username: string;
}

const colors = [
  { name: 'Без цвета', value: '' },
  { name: 'Красный', value: 'bg-red-100' },
  { name: 'Зеленый', value: 'bg-green-100' },
  { name: 'Синий', value: 'bg-blue-100' },
  { name: 'Желтый', value: 'bg-yellow-100' },
  { name: 'Пурпурный', value: 'bg-purple-100' },
];

const CardDetailModal = ({
  isOpen,
  onClose,
  card,
  boardId,
  columnId,
  columns,
  users,
  onUpdateCard,
  onDeleteCard,
  currentUserId,
  onCardChanged
}: CardDetailModalProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [deadline, setDeadline] = useState('');
  const [completed, setCompleted] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<ServerComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number>(columnId);
  const [error, setError] = useState('');
  const [isMovingColumn, setIsMovingColumn] = useState(false);

  // Состояния для работы с тегами
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [cardTags, setCardTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);

  // Устанавливаем значения при открытии модального окна или изменении карточки
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setColor(card.color || '');
      setDeadline(card.deadline ? card.deadline.slice(0, 10) : '');
      setCompleted(card.completed || false);
      
      // Убедимся, что у нас всегда валидный массив ID
      let userIds: number[] = [];
      
      if (card.assigned_users && Array.isArray(card.assigned_users)) {
        // Проверяем, какого типа элементы в массиве
        userIds = card.assigned_users.map(user => {
          if (typeof user === 'number') {
            return user; // Это ID
          } else if (user && typeof user === 'object' && 'id' in user) {
            return Number(user.id); // Это объект с id
          }
          return NaN;
        }).filter(id => !isNaN(id));
      }
      
      console.log('Инициализированы ID назначенных пользователей:', userIds);
      setAssignedUsers(userIds);
      setSelectedColumn(columnId);
      
      if (isOpen) {
        fetchComments();
        fetchTags();
      }
      
      // Устанавливаем теги карточки
      setCardTags(card.tags || []);
    }
  }, [card, isOpen, boardId, columnId]);

  const fetchComments = async () => {
    if (!card) return;
    
    try {
      setIsLoading(true);
      const data = await boardService.getCardComments(boardId, columnId, card.id);
      
      // Преобразуем полученные данные в массив
      if (Array.isArray(data)) {
        setComments(data as unknown as ServerComment[]);
      } else if (data && typeof data === 'object') {
        // Если пришел объект, ищем в нем массив комментариев
        const responseObj = data as any; // Используем any для обхода проверки типов
        if (responseObj.comments && Array.isArray(responseObj.comments)) {
          setComments(responseObj.comments as ServerComment[]);
        } else {
          console.error('Неожиданный формат ответа API для комментариев:', data);
          setComments([]);
        }
      } else {
        console.error('Неожиданный формат ответа API для комментариев:', data);
        setComments([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке комментариев:', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      setIsLoadingTags(true);
      const boardTags = await boardService.getBoardTags(boardId);
      setAvailableTags(boardTags);
    } catch (error) {
      console.error('Ошибка при загрузке тегов доски:', error);
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleSaveTitle = () => {
    if (!card || !title.trim()) return;
    
    onUpdateCard(card.id, { title: title.trim() });
    setIsEditingTitle(false);
    
    if (onCardChanged) {
      const updatedCard = { ...card, title: title.trim() };
      onCardChanged(updatedCard);
    }
  };

  const handleSaveDescription = () => {
    if (!card) return;
    
    const newDescription = description.trim() || undefined;
    onUpdateCard(card.id, { description: newDescription });
    setIsEditingDescription(false);
    
    if (onCardChanged) {
      const updatedCard = { ...card, description: description.trim() || '' };
      onCardChanged(updatedCard);
    }
  };

  const handleToggleCompleted = () => {
    if (!card) return;
    
    const newStatus = !completed;
    setCompleted(newStatus);
    onUpdateCard(card.id, { completed: newStatus });
    
    if (onCardChanged) {
      const updatedCard = { ...card, completed: newStatus };
      onCardChanged(updatedCard);
    }
  };

  const handleColorChange = (newColor: string) => {
    if (!card) return;
    
    setColor(newColor);
    onUpdateCard(card.id, { color: newColor || undefined });
    
    if (onCardChanged) {
      const updatedCard = { ...card, color: newColor };
      onCardChanged(updatedCard);
    }
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!card) return;
    
    const newDate = e.target.value;
    setDeadline(newDate);
    
    // Проверяем, является ли поле пустым
    if (newDate && newDate.trim() !== '') {
      // Если дата указана, отправляем строку в формате ISO
      console.log('Устанавливаем дату:', newDate);
      // Добавляем время к дате, чтобы получить полный ISO формат
      const isoDateTime = new Date(`${newDate}T23:59:59`).toISOString();
      console.log('Отправляем дату в ISO формате:', isoDateTime);
      onUpdateCard(card.id, { deadline: isoDateTime });
      
      if (onCardChanged) {
        const updatedCard = { ...card, deadline: isoDateTime };
        onCardChanged(updatedCard);
      }
    } else {
      // Если поле очищено, отправляем null для очистки даты
      console.log('Очищаем дату');
      onUpdateCard(card.id, { deadline: null });
      
      if (onCardChanged) {
        const updatedCard = { ...card, deadline: null };
        onCardChanged(updatedCard);
      }
    }
  };

  const handleUserAssignment = (userId: number) => {
    if (!card) return;
    
    // Проверяем, что userId действительно число
    if (typeof userId !== 'number' || isNaN(userId)) {
      console.error('ID пользователя должен быть числом:', userId);
      return;
    }
    
    const newAssignedUsers = assignedUsers.includes(userId)
      ? assignedUsers.filter(id => id !== userId)
      : [...assignedUsers, userId];
    
    // Убедимся, что в массиве только числовые ID
    const validAssignedUsers = newAssignedUsers.filter(id => 
      typeof id === 'number' && !isNaN(id)
    );
    
    // Обновляем состояние до вызова API, чтобы интерфейс обновился быстрее
    setAssignedUsers(validAssignedUsers);
    
    // Создаем новый объект для локального обновления карточки
    const assignedUserObjects = users.filter(user => 
      validAssignedUsers.includes(user.id)
    );
    
    // Создаем обновленную копию карточки
    const updatedCard = { 
      ...card, 
      assigned_users: assignedUserObjects 
    };
    
    // Отправляем изменения на сервер
    onUpdateCard(card.id, { assigned_users: validAssignedUsers });
    
    // Принудительно обновляем карточку в родительском компоненте
    if (onCardChanged) {
      onCardChanged(updatedCard);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !newComment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      await boardService.createCardComment(
        boardId,
        columnId,
        card.id,
        { text: newComment.trim() }
      );
      
      // Обновляем список комментариев, получив свежие данные с сервера
      await fetchComments();
      setNewComment('');
      
      // Для комментариев не обновляем карточку, так как они загружаются отдельно
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!card) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      try {
        await boardService.deleteCardComment(boardId, columnId, card.id, commentId);
        setComments(comments.filter(comment => comment.id !== commentId));
        // Для комментариев не обновляем карточку, так как они загружаются отдельно
      } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
      }
    }
  };

  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newColumnId = Number(e.target.value);
    setSelectedColumn(newColumnId);
    
    if (!card || newColumnId === columnId) return; // Если колонка не изменилась, ничего не делаем
    
    // Отправляем запрос на перемещение карточки в новую колонку без показа лоадера
    try {
      // Определяем позицию в новой колонке (добавляем в конец)
      const targetColumn = columns.find(col => col.id === newColumnId);
      if (!targetColumn) return;
      
      const newPosition = targetColumn.cards.length;
      
      // Устанавливаем флаг перемещения, но не показываем лоадер
      setIsMovingColumn(true);
      
      // Вызываем API для перемещения без индикации загрузки
      boardService.moveCard(
        boardId,
        card.id,
        {
          column_id: newColumnId,
          order: newPosition
        }
      ).then(updatedCard => {
        // Если успешно, уведомляем родительский компонент об изменении
        if (onCardChanged) {
          onCardChanged(updatedCard);
        }
        setIsMovingColumn(false);
      }).catch(error => {
        console.error('Ошибка при перемещении карточки:', error);
        // Возвращаем исходное значение колонки
        setSelectedColumn(columnId);
        setIsMovingColumn(false);
      });
    } catch (error) {
      console.error('Ошибка при перемещении карточки:', error);
      // Возвращаем исходное значение колонки
      setSelectedColumn(columnId);
      setIsMovingColumn(false);
    }
  };

  const handleAssignTag = async (tag: Tag) => {
    if (!card) return;
    
    try {
      await boardService.assignTagToCard({ tag_id: tag.id, card_id: card.id });
      
      // Обновляем локальное состояние
      const newCardTags = [...cardTags, tag];
      setCardTags(newCardTags);
      
      // Обновляем карточку в родительском компоненте
      if (onCardChanged) {
        const updatedCard = { ...card, tags: newCardTags };
        onCardChanged(updatedCard);
      }
      
      setShowTagsDropdown(false);
    } catch (error: any) {
      console.error('Ошибка при назначении тега:', error);
      setError(error.response?.data?.detail || 'Ошибка при назначении тега');
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!card) return;
    
    try {
      await boardService.unassignTagFromCard({ tag_id: tagId, card_id: card.id });
      
      // Обновляем локальное состояние
      const newCardTags = cardTags.filter(tag => tag.id !== tagId);
      setCardTags(newCardTags);
      
      // Обновляем карточку в родительском компоненте
      if (onCardChanged) {
        const updatedCard = { ...card, tags: newCardTags };
        onCardChanged(updatedCard);
      }
    } catch (error: any) {
      console.error('Ошибка при удалении тега:', error);
      setError(error.response?.data?.detail || 'Ошибка при удалении тега');
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  };

  // Предотвращаем рендеринг, если карточка не выбрана
  if (!card) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0" onClick={onClose} />
          
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl z-10 overflow-hidden max-h-[90vh] flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Заголовок и кнопка закрытия */}
            <div className={`flex justify-between items-center p-6 ${color}`}>
              <div className="flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="px-3 py-2 text-xl font-bold w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Название карточки"
                      autoFocus
                      onBlur={handleSaveTitle}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                    />
                    <button 
                      onClick={handleSaveTitle}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <h2 
                    className="text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-100 hover:bg-opacity-50 p-2 rounded"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {title}
                  </h2>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  в колонке:{' '}
                  <select
                    value={selectedColumn}
                    onChange={handleColumnChange}
                    className={`border-none ${isMovingColumn ? 'opacity-50' : ''} bg-transparent focus:outline-none focus:ring-0 cursor-pointer hover:text-blue-600`}
                    disabled={isMovingColumn}
                  >
                    {columns.map(column => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                  {isMovingColumn && <span className="ml-2 text-xs text-blue-500">перемещение...</span>}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* Описание */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Описание
                    </h3>
                    
                    {isEditingDescription ? (
                      <div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Добавьте более подробное описание..."
                          rows={5}
                          autoFocus
                        />
                        <div className="flex mt-2">
                          <button
                            onClick={handleSaveDescription}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => {
                              setDescription(card.description || '');
                              setIsEditingDescription(false);
                            }}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsEditingDescription(true)}
                        className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                      >
                        {description ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                        ) : (
                          <p className="text-gray-400">Добавьте более подробное описание...</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Комментарии */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Комментарии
                    </h3>
                    
                    {/* Форма добавления комментария */}
                    <form onSubmit={handleSubmitComment} className="mb-4">
                      <div className="flex">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Напишите комментарий..."
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || isSubmittingComment}
                          className={`px-3 py-1 rounded-md ${
                            newComment.trim() && !isSubmittingComment
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isSubmittingComment ? 'Отправка...' : 'Добавить'}
                        </button>
                      </div>
                    </form>
                    
                    {/* Список комментариев */}
                    {isLoading && !isMovingColumn ? (
                      <div className="flex justify-center p-4">
                        <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!Array.isArray(comments) || comments.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            Нет комментариев
                          </p>
                        ) : (
                          comments.map(comment => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center mb-2">
                                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div className="ml-2">
                                    <span className="text-sm font-medium text-gray-800">
                                      {comment.username || 'Пользователь'}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Кнопка удаления (если комментарий пользователя или админ) */}
                                {comment.user_id === currentUserId && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap text-sm pl-10">
                                {comment.text || 'Пустой комментарий'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  {/* Боковая панель с дополнительными действиями */}
                  <div className="space-y-6">
                    {/* Статус */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Статус</h3>
                      <button
                        onClick={handleToggleCompleted}
                        className={`flex items-center p-2 w-full text-left rounded-md ${
                          completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        } hover:bg-opacity-80`}
                      >
                        {completed ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Выполнено
                          </>
                        ) : (
                          <>
                            <Circle className="w-5 h-5 mr-2" />
                            Не выполнено
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Дедлайн */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Срок выполнения</h3>
                      <div className="flex items-center relative">
                        <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                        <div className="flex-1 relative">
                          <input
                            type="date"
                            value={deadline || ''}
                            onChange={handleDeadlineChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {deadline && (
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Нажата кнопка очистки даты');
                                setDeadline(''); // Очищаем локальное состояние
                                
                                // Отправляем null для очистки даты
                                console.log('Отправляем запрос на очистку даты с deadline: null');
                                onUpdateCard(card.id, { deadline: null });
                                
                                if (onCardChanged) {
                                  console.log('Обновляем локальную карточку с deadline: null');
                                  const updatedCard = { ...card, deadline: null };
                                  onCardChanged(updatedCard);
                                }
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                              title="Очистить дату"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Теги */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Теги</h3>
                      
                      {/* Отображение назначенных тегов */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {cardTags.length > 0 ? (
                          cardTags.map(tag => (
                            <TagBadge
                              key={tag.id}
                              tag={tag}
                              size="sm"
                              showRemove={true}
                              onRemove={() => handleRemoveTag(tag.id)}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Теги не назначены</p>
                        )}
                      </div>
                      
                      {/* Кнопка добавления тега */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                          className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Добавить тег
                        </button>
                        
                        {/* Выпадающий список доступных тегов */}
                        {showTagsDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {isLoadingTags ? (
                              <div className="p-3 text-center">
                                <div className="w-4 h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
                              </div>
                            ) : (
                              <>
                                {availableTags
                                  .filter(tag => !cardTags.some(cardTag => cardTag.id === tag.id))
                                  .map(tag => (
                                    <button
                                      key={tag.id}
                                      onClick={() => handleAssignTag(tag)}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center"
                                    >
                                      <TagBadge tag={tag} size="sm" />
                                    </button>
                                  ))}
                                {availableTags.filter(tag => !cardTags.some(cardTag => cardTag.id === tag.id)).length === 0 && (
                                  <div className="p-3 text-sm text-gray-500 text-center">
                                    Все теги уже назначены
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Назначенные пользователи */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Ответственные</h3>
                      <div className="flex flex-wrap gap-2">
                        {card.assigned_users && card.assigned_users.length > 0 ? (
                          card.assigned_users.map(user => {
                            // Проверяем, является ли user объектом или числом
                            const userId = typeof user === 'object' ? user.id : user;
                            // Проверяем, что пользователь действительно назначен (по локальному состоянию)
                            if (!assignedUsers.includes(userId)) return null;
                            
                            // Ищем данные пользователя в списке всех пользователей
                            const userData = users.find(u => u.id === userId);
                            const username = userData ? userData.username : `Пользователь ${userId}`;
                            
                            return (
                              <div 
                                key={`assigned-${userId}-${Math.random()}`} 
                                className="flex items-center bg-gray-100 rounded-full pl-1 pr-2 py-1"
                              >
                                <UserAvatar
                                  username={username}
                                  id={userId}
                                  size="sm"
                                />
                                <span className="ml-2 text-sm text-gray-700">{username}</span>
                                <button
                                  onClick={() => handleUserAssignment(userId)}
                                  className="ml-2 text-gray-500 hover:text-red-500"
                                  title="Удалить назначение"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          }).filter(Boolean) // Фильтруем null-элементы
                        ) : (
                          <p className="text-sm text-gray-500">Нет назначенных пользователей</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Перетащите аватар пользователя из панели участников на карточку, чтобы назначить ответственного
                      </p>
                    </div>
                    
                    {/* Доступные пользователи */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Доступные пользователи</h3>
                      <div className="flex flex-wrap gap-2">
                        {users
                          .filter(user => !assignedUsers.includes(user.id))
                          .map(user => (
                            <div 
                              key={`available-${user.id}-${Math.random()}`}
                              onClick={() => handleUserAssignment(user.id)}
                              className="flex items-center bg-gray-100 rounded-full pl-1 pr-2 py-1 cursor-pointer hover:bg-gray-200"
                            >
                              <UserAvatar
                                username={user.username}
                                id={user.id}
                                size="sm"
                              />
                              <span className="ml-2 text-sm text-gray-700">{user.username}</span>
                              <button
                                className="ml-2 text-gray-500 hover:text-green-500"
                                title="Назначить ответственным"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        {users.filter(user => !assignedUsers.includes(user.id)).length === 0 && (
                          <p className="text-sm text-gray-500">Все пользователи уже назначены</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Цвет карточки */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Цвет</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {colors.map(colorOption => (
                          <div
                            key={colorOption.value}
                            onClick={() => handleColorChange(colorOption.value)}
                            className={`h-8 rounded-md cursor-pointer ${colorOption.value || 'border border-gray-300'} ${
                              color === colorOption.value ? 'ring-2 ring-blue-500' : ''
                            }`}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Кнопка удаления */}
                    <div>
                      <button
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите удалить эту карточку?')) {
                            onDeleteCard(card.id);
                            onClose();
                          }
                        }}
                        className="mt-4 w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        Удалить карточку
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CardDetailModal; 