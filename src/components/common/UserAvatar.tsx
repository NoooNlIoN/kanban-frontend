import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface UserAvatarProps {
  username: string;
  id: number;
  size?: 'sm' | 'md' | 'lg';
  isAssigned?: boolean;
  draggable?: boolean;
  onClick?: () => void;
}

const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '??';
  
  const trimmedName = name.trim();
  if (trimmedName.length <= 2) return trimmedName.toUpperCase();
  
  const parts = trimmedName.split(' ');
  if (parts.length > 1) {
    // Если несколько слов, берем первые буквы первых двух слов
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  } else {
    // Если одно слово, берем первые две буквы
    return trimmedName.substring(0, 2).toUpperCase();
  }
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  id,
  size = 'md',
  isAssigned = false,
  draggable = false,
  onClick
}) => {
  // Генерируем уникальный цвет на основе ID пользователя
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = id % colors.length;
  const bgColor = colors[colorIndex];
  
  // Определяем размер аватарки
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Настраиваем draggable элементы с помощью dnd-kit
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `user-${id}`,
    data: {
      type: 'user',
      userId: id,
      username
    },
    disabled: !draggable
  });

  const initials = getInitials(username || '');

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      onClick={onClick}
      className={`
        ${sizeClasses[size]} 
        ${bgColor} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-medium 
        ${draggable ? 'cursor-grab' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
        ${isAssigned ? 'ring-2 ring-white ring-offset-2 ring-offset-blue-300' : ''}
        ${onClick && !draggable ? 'cursor-pointer hover:opacity-80' : ''}
        transition-all
      `}
      title={username}
    >
      {initials}
    </div>
  );
};

export default UserAvatar; 