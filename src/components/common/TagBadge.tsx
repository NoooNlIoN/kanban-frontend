import React from 'react';
import type { Tag } from '../../api/types';

interface TagBadgeProps {
  tag: Tag;
  size?: 'sm' | 'md';
  showRemove?: boolean;
  onRemove?: () => void;
  className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  size = 'sm', 
  showRemove = false, 
  onRemove,
  className = ''
}) => {
  // Обрезаем название тега до 10 символов
  const displayName = tag.name.length > 10 ? `${tag.name.substring(0, 10)}...` : tag.name;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${sizeClasses[size]} ${className}`}
      style={{ 
        backgroundColor: tag.color,
        color: getContrastColor(tag.color)
      }}
      title={tag.name} // Показываем полное название при наведении
    >
      <span>{displayName}</span>
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
          aria-label="Удалить тег"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

// Функция для определения контрастного цвета текста
function getContrastColor(hexColor: string): string {
  // Удаляем # если есть
  const hex = hexColor.replace('#', '');
  
  // Переводим в RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Вычисляем яркость
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Возвращаем черный для светлых цветов и белый для темных
  return brightness > 128 ? '#000000' : '#ffffff';
}

export default TagBadge; 