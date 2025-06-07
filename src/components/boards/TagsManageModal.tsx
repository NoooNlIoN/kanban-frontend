import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import boardService from '../../api/boardService';
import type { Tag, TagCreate, TagUpdate } from '../../api/types';
import TagBadge from '../common/TagBadge';

// Предустановленные цвета для тегов
const TAG_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
  '#84cc16', // lime-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#f43f5e', // rose-500
];

interface TagsManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  onTagsChanged?: () => void;
}

const TagsManageModal: React.FC<TagsManageModalProps> = ({
  isOpen,
  onClose,
  boardId,
  onTagsChanged
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  
  // Форма для создания/редактирования тега
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  // Предустановленные цвета
  const presetColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#84CC16', // lime
    '#EC4899', // pink
    '#6B7280'  // gray
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen, boardId]);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const boardTags = await boardService.getBoardTags(boardId);
      setTags(boardTags);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке тегов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Название тега обязательно');
      return;
    }

    try {
      setError(null);
      
      if (editingTag) {
        // Обновление существующего тега
        const updatedTag = await boardService.updateTag(editingTag.id, {
          name: formData.name.trim(),
          color: formData.color
        });
        
        setTags(prev => prev.map(tag => 
          tag.id === editingTag.id ? updatedTag : tag
        ));
        setEditingTag(null);
      } else {
        // Создание нового тега
        const newTag = await boardService.createTag({
          name: formData.name.trim(),
          color: formData.color,
          board_id: boardId
        });
        
        setTags(prev => [...prev, newTag]);
        setIsCreating(false);
      }
      
      // Сбрасываем форму
      setFormData({ name: '', color: '#3B82F6' });
      onTagsChanged?.();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении тега');
    }
  };

  const handleDelete = async (tagId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тег? Он будет удален со всех карточек.')) {
      return;
    }

    try {
      await boardService.deleteTag(tagId);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      onTagsChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении тега');
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setIsCreating(false);
    setFormData({ name: '', color: '#3B82F6' });
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
      >
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Управление тегами
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Форма создания/редактирования */}
          {(isCreating || editingTag) && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название тега
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название тега"
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цвет тега
                </label>
                
                {/* Предустановленные цвета */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        formData.color === color 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                {/* Кастомный выбор цвета */}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingTag ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          )}

          {/* Список тегов */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {tags.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Теги не созданы
                </p>
              ) : (
                tags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                    <TagBadge tag={tag} size="md" />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEdit(tag)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Редактировать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Кнопка добавления нового тега */}
        {!isCreating && !editingTag && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать новый тег
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TagsManageModal; 