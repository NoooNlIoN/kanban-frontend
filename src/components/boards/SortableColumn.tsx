import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column, Card, User } from '../../api/types';
import { SortableCard } from './SortableCard';

interface SortableColumnProps {
  id: string;
  column: Column;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
  onAddCard: (columnId: number, cardTitle: string, cardDescription: string) => void;
  onDeleteCard: (cardId: number) => void;
  onUpdateCard: (cardId: number, cardData: {
    title?: string;
    description?: string;
    deadline?: string;
    assigned_users?: number[];
  }) => void;
  onToggleCompleted: (cardId: number, columnId?: number) => void;
  createCardId: (id: number) => string;
  canEdit: boolean;
  canToggleComplete: boolean;
  isDropTarget?: boolean;
  dropTargetId?: string;
  onOpenCardDetails?: (card: Card, columnId: number) => void;
  users?: User[];
}

export function SortableColumn({
  id,
  column,
  onDelete,
  onUpdateTitle,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
  onToggleCompleted,
  createCardId,
  canEdit,
  canToggleComplete,
  isDropTarget = false,
  dropTargetId = '',
  onOpenCardDetails,
  users = []
}: SortableColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');

  // Отладка
  // console.log(`SortableColumn render: id=${id}, column.id=${column.id}, canEdit=${canEdit}`);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'column',
      column,
    },
    disabled: isEditingTitle || isAddingCard || !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: canEdit && !isEditingTitle && !isAddingCard ? (isDragging ? 'grabbing' : 'grab') : 'default',
    touchAction: 'none', // Важно для мобильных устройств
    width: '18rem', // Фиксированная ширина для предотвращения сжатия при перетаскивании
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onUpdateTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle, newCardDescription);
      setNewCardTitle('');
      setNewCardDescription('');
      setIsAddingCard(false);
    }
  };

  const sortedCards = [...column.cards].sort((a, b) => a.order - b.order);

  const columnClassName = `
    bg-gray-100 rounded-lg p-3 flex-shrink-0
    ${isDropTarget ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    ${isDragging ? 'opacity-50' : 'opacity-100'}
    transition-all duration-200 ease-in-out
    shadow-sm hover:shadow-md
  `;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={columnClassName}
      {...(canEdit ? { ...attributes, ...listeners } : {})}
      data-id={id}
      data-type="column"
    >
      {/* Заголовок колонки */}
      <div 
        className="flex justify-between items-center mb-3 group"
      >
        {isEditingTitle ? (
          <form 
            onSubmit={handleTitleSubmit} 
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onBlur={handleTitleSubmit}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTitle(column.title);
                  setIsEditingTitle(false);
                }
                e.stopPropagation();
              }}
            />
          </form>
        ) : (
          <div className="flex-1 flex items-center">
            <h3 
              className={`text-sm font-semibold text-gray-700 px-1 ${canEdit ? 'cursor-pointer hover:text-blue-600' : ''}`}
              onClick={(e) => {
                if (canEdit) {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }
              }}
            >
              {column.title}
            </h3>
            <span className="ml-2 text-xs text-gray-500">
              {column.cards.length}
            </span>
          </div>
        )}
        
        {!isEditingTitle && canEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Удалить колонку"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Список карточек */}
      <div className="overflow-y-auto max-h-[calc(100vh-240px)] px-1">
        <SortableContext
          items={sortedCards.map(card => createCardId(card.id))}
          strategy={verticalListSortingStrategy}
        >
          {sortedCards.map(card => (
            <SortableCard
              key={card.id}
              id={createCardId(card.id)}
              card={card}
              columnId={column.id}
              onDelete={onDeleteCard}
              onUpdate={onUpdateCard}
              onToggleCompleted={onToggleCompleted}
              canEdit={canEdit}
              canToggleComplete={canToggleComplete}
              isDropTarget={dropTargetId === createCardId(card.id)}
              onOpenCardDetails={onOpenCardDetails}
              users={users}
            />
          ))}
        </SortableContext>
      </div>

      {/* Форма добавления карточки */}
      {isAddingCard ? (
        <div 
          className="mt-2 bg-white rounded-md shadow-sm p-3" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto', touchAction: 'auto' }}
        >
          <form 
            onSubmit={handleAddCardSubmit} 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-2">
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Название карточки"
                autoFocus
                required
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="mb-2">
              <textarea
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Описание (опционально)"
                rows={3}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsAddingCard(false);
                  setNewCardTitle('');
                  setNewCardDescription('');
                }}
                className="text-gray-600 text-sm hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!newCardTitle.trim()}
                className={`px-3 py-1 text-sm rounded-md ${
                  newCardTitle.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      ) : (
        canEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingCard(true);
            }}
            className="w-full py-2 px-3 mt-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md text-left"
            aria-label="Добавить карточку"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Добавить карточку
            </span>
          </button>
        )
      )}
    </div>
  );
} 