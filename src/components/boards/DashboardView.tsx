import React, { useState } from 'react';
import { DashboardProvider, useDashboard } from '../../contexts/DashboardContext';
import type { Column } from '../../api/types';
import CardDistributionChart from './dashboard/CardDistributionChart';
import DeadlineStatsChart from './dashboard/DeadlineStatsChart';
import UserWorkloadChart from './dashboard/UserWorkloadChart';
import UserActivityChart from './dashboard/UserActivityChart';
import DashboardFilters from './dashboard/DashboardFilters';

interface DashboardViewProps {
  columns: Column[];
  boardId: number;
}

const DashboardContent: React.FC = () => {
  const { 
    isLoading, 
    error,
    config, 
    updateConfig
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.showCardDistribution && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Распределение карточек по колонкам</h3>
              <button 
                onClick={() => updateConfig({ showCardDistribution: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <CardDistributionChart />
          </div>
        )}

        {config.showDeadlineStats && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Статистика дедлайнов</h3>
              <button 
                onClick={() => updateConfig({ showDeadlineStats: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <DeadlineStatsChart />
          </div>
        )}

        {config.showUserWorkload && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Нагрузка на пользователей</h3>
              <button 
                onClick={() => updateConfig({ showUserWorkload: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <UserWorkloadChart />
          </div>
        )}

        {config.showUserActivity && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Активность пользователей</h3>
              <button 
                onClick={() => updateConfig({ showUserActivity: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <UserActivityChart />
          </div>
        )}
      </div>

      {/* Панель для добавления скрытых виджетов */}
      <div className="flex flex-wrap gap-2">
        {!config.showCardDistribution && (
          <button 
            onClick={() => updateConfig({ showCardDistribution: true })}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            + Распределение карточек
          </button>
        )}
        {!config.showDeadlineStats && (
          <button 
            onClick={() => updateConfig({ showDeadlineStats: true })}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            + Статистика дедлайнов
          </button>
        )}
        {!config.showUserWorkload && (
          <button 
            onClick={() => updateConfig({ showUserWorkload: true })}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            + Нагрузка на пользователей
          </button>
        )}
        {!config.showUserActivity && (
          <button 
            onClick={() => updateConfig({ showUserActivity: true })}
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
          >
            + Активность пользователей
          </button>
        )}
      </div>
    </div>
  );
};

const DashboardView: React.FC<DashboardViewProps> = ({ columns, boardId }) => {
  return (
    <DashboardProvider boardId={boardId} columns={columns}>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Аналитика доски</h2>
        <DashboardContent />
      </div>
    </DashboardProvider>
  );
};

export default DashboardView; 