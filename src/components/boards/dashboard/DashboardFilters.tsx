import React from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

const DashboardFilters: React.FC = () => {
  const { filters, updateFilters } = useDashboard();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Фильтры</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Выбор временного периода */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Период
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilters({ dateRange: e.target.value as any })}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
            <option value="quarter">За квартал</option>
            <option value="all">За всё время</option>
          </select>
        </div>
        
        {/* Включение завершенных карточек */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={filters.includeCompleted}
              onChange={(e) => updateFilters({ includeCompleted: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            Включать выполненные карточки
          </label>
        </div>
        
        {/* Кнопка сброса фильтров */}
        <div className="flex items-end">
          <button
            onClick={() => updateFilters({
              dateRange: 'week',
              includeCompleted: false,
              users: []
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters; 