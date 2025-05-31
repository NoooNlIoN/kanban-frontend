import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { Card, User } from '../../api/types';
import { CheckCircle, Circle } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

interface SortableCardProps {
  id: string;
  card: Card;
  columnId?: number;
  onDelete: (cardId: number) => void;
  onUpdate: (cardId: number, cardData: { 
    title?: string; 
    description?: string; 
    deadline?: string;
    assigned_users?: number[];
  }) => void;
  onToggleCompleted: (cardId: number, columnId?: number) => void;
  canEdit: boolean;
  canToggleComplete: boolean;
  isDropTarget?: boolean;
  onOpenCardDetails?: (card: Card, columnId: number) => void;
  users?: User[];
}

export function SortableCard({ 
  id,
  card, 
  columnId,
  onDelete, 
  onUpdate,
  onToggleCompleted,
  canEdit,
  canToggleComplete,
  isDropTarget = false,
  onOpenCardDetails,
  users = []
}: SortableCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');

  if (columnId === undefined) {
    console.error(`SortableCard (id: ${id}, card: ${card.id}) - columnId не определен!`);
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    data: {
      type: 'card',
      columnId,
      card
    },
    disabled: isEditing || !canEdit,
  });

  // Настраиваем droppable для перетаскивания пользователей на карточку
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `card-droppable-${card.id}`,
    data: {
      type: 'card-droppable',
      cardId: card.id,
      columnId
    }
  });

  // Объединяем оба ref
  const setNodeRefCombined = (node: HTMLElement | null) => {
    setDroppableRef(node);
    // Также устанавливаем ref для sortable
    if (node) {
      setNodeRef(node);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: (!isEditing && canEdit) ? (isDragging ? 'grabbing' : 'grab') : 'default',
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту карточку?')) {
      onDelete(card.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onUpdate(card.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    
    setIsEditing(false);
  };

  const handleToggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompleted(card.id, columnId);
  };

  const handleCardClick = () => {
    if (columnId !== undefined && onOpenCardDetails && !isEditing) {
      onOpenCardDetails(card, columnId);
    }
  };

  const cardClassName = `
    rounded-md shadow-sm p-3 mb-2 group 
    ${card.color ? card.color : 'bg-white'} 
    ${card.completed ? 'bg-opacity-50' : ''}
    ${canEdit ? 'cursor-grab' : ''}
    ${isDropTarget || isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    ${isDragging ? 'opacity-50' : 'opacity-100'}
    transition-all duration-200
    ${onOpenCardDetails ? 'hover:shadow-md' : ''}
  `;

  if (isEditing) {
    return (
      <div
        ref={setNodeRefCombined}
        style={style}
        className="bg-white rounded-md shadow-sm p-3 mb-2 group"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Название карточки"
              autoFocus
              required
            />
          </div>
          <div className="mb-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Описание (опционально)"
              rows={3}
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-600 text-sm hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className={`px-3 py-1 text-sm rounded-md ${
                title.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRefCombined}
      style={style}
      className={cardClassName}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleCardClick}
      {...(canEdit && !isEditing ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex justify-between items-start">
        <div className={`flex-1 ${isHovering ? 'pl-4' : ''} transition-all duration-200`}>
          <h4 className={`text-sm font-medium text-gray-800 ${card.completed ? 'line-through text-gray-500' : ''}`}>
            {card.title}
          </h4>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 overflow-hidden text-ellipsis">
              {card.description}
            </p>
          )}
        </div>
        
        {isHovering && (
          <div className="flex">
            {canToggleComplete && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleToggleCompleted}
                className={`
                  w-6 h-6 mr-1 flex items-center justify-center rounded-full 
                  ${card.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} 
                  hover:bg-opacity-80
                `}
                aria-label={card.completed ? "Отметить как невыполненное" : "Отметить как выполненное"}
              >
                {card.completed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </motion.button>
            )}
            
            {canEdit && (
              <>
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleEditClick}
                  className="w-6 h-6 mr-1 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                  aria-label="Редактировать карточку"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </motion.button>
                
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleDeleteClick}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  aria-label="Удалить карточку"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </>
            )}
          </div>
        )}
      </div>
      
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap mt-2 gap-1">
          {card.labels.map(label => (
            <div 
              key={label.id} 
              className="h-2 w-10 rounded-sm" 
              style={{ backgroundColor: label.color }}
            />
          ))}
        </div>
      )}
      
      {card.deadline && (
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(card.deadline).toLocaleDateString()}
        </div>
      )}
      
      {card.assigned_users && card.assigned_users.length > 0 && (
        <div className="flex flex-wrap mt-2 -space-x-2 overflow-hidden">
          {card.assigned_users.map(userIdOrObject => {
            // Определяем ID пользователя
            const userId = typeof userIdOrObject === 'object' ? userIdOrObject.id : userIdOrObject;
            
            // Ищем пользователя в массиве users
            const userFromList = users.find(u => u.id === userId);
            const username = userFromList ? userFromList.username : `User ${userId}`;
            
            return (
              <UserAvatar 
                key={`avatar-${userId}`}
                username={username}
                id={userId}
                size="sm"
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 