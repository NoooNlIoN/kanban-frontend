import { useState, useEffect } from 'react';
import { boardService } from '../../api';
import type { UserBoardsStatsResponse, BoardFullStatsResponse } from '../../api/types';
import { toast } from 'react-hot-toast';

interface BoardStatsCardProps {
  board: BoardFullStatsResponse;
}

const BoardStatsCard: React.FC<BoardStatsCardProps> = ({ board }) => {
  const { statistics } = board;
  
  // Рассчитываем процент выполнения на фронтенде
  const calculateCompletionPercentage = () => {
    const totalCards = statistics.total_cards ?? 0;
    const completedCards = statistics.completed_cards ?? 0;
    
    if (totalCards === 0) return 0;
    return (completedCards / totalCards) * 100;
  };
  
  const completionPercentage = statistics.completion_percentage ?? calculateCompletionPercentage();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{board.title}</h3>
          {board.description && (
            <p className="text-sm text-gray-500 mt-1">{board.description}</p>
          )}
        </div>
        <span className="text-xs text-gray-400">
          Обновлено: {new Date(board.updated_at).toLocaleDateString('ru-RU')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{statistics.total_cards ?? 0}</div>
          <div className="text-sm text-gray-500">Всего карточек</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{statistics.completed_cards ?? 0}</div>
          <div className="text-sm text-gray-500">Выполнено</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{statistics.pending_cards ?? 0}</div>
          <div className="text-sm text-gray-500">В работе</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{statistics.overdue_cards ?? 0}</div>
          <div className="text-sm text-gray-500">Просрочено</div>
        </div>
      </div>
      
      {/* Прогресс-бар */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Прогресс выполнения</span>
          <span>{completionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Дополнительная статистика */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>Комментариев: <strong>{statistics.total_comments ?? 0}</strong></span>
        {statistics.avg_completion_time && (
          <span>Ср. время: <strong>{Math.round(statistics.avg_completion_time)} дн.</strong></span>
        )}
      </div>
    </div>
  );
};

const BoardsStatsComponent: React.FC = () => {
  const [stats, setStats] = useState<UserBoardsStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Функция для расчета общего процента выполнения
  const calculateGlobalCompletionPercentage = () => {
    if (!stats) return 0;
    
    const totalCards = stats.global_statistics.total_cards ?? 0;
    const completedCards = stats.global_statistics.completed_cards ?? 0;
    
    if (totalCards === 0) return 0;
    return (completedCards / totalCards) * 100;
  };

  const globalCompletionPercentage = stats ? 
    (stats.global_statistics.completion_percentage ?? calculateGlobalCompletionPercentage()) : 0;

  useEffect(() => {
    const loadBoardsStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await boardService.getUserBoardsFullStatistics();
        setStats(data);
      } catch (err: any) {
        console.error('Ошибка при загрузке статистики досок:', err);
        setError(err.response?.data?.detail || 'Не удалось загрузить статистику досок');
        toast.error('Не удалось загрузить статистику досок');
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardsStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-purple-800">Статистика досок</h3>
          <p className="text-sm text-gray-500 mt-1">
            Детальная статистика по всем вашим доскам и задачам.
          </p>
        </div>
        
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-500">Загрузка статистики досок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-purple-800">Статистика досок</h3>
          <p className="text-sm text-gray-500 mt-1">
            Детальная статистика по всем вашим доскам и задачам.
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.boards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-purple-800">Статистика досок</h3>
          <p className="text-sm text-gray-500 mt-1">
            Детальная статистика по всем вашим доскам и задачам.
          </p>
        </div>
        
        <div className="text-center py-8">
          <div className="text-6xl text-gray-300 mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет досок для анализа</h3>
          <p className="text-gray-500">Создайте свою первую доску, чтобы увидеть статистику.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium text-purple-800">Статистика досок</h3>
        <p className="text-sm text-gray-500 mt-1">
          Детальная статистика по всем вашим доскам и задачам.
        </p>
      </div>

      {/* Общая статистика */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <h4 className="text-xl font-bold mb-4">Общая статистика</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total_boards}</div>
            <div className="text-blue-100">Досок</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.global_statistics.total_cards ?? 0}</div>
            <div className="text-blue-100">Всего карточек</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.global_statistics.completed_cards ?? 0}</div>
            <div className="text-blue-100">Выполнено</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{globalCompletionPercentage.toFixed(1)}%</div>
            <div className="text-blue-100">Прогресс</div>
          </div>
        </div>
        
        {/* Общий прогресс-бар */}
        <div className="mt-4">
          <div className="w-full bg-blue-400/30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(globalCompletionPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Статистика по отдельным доскам */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Статистика по доскам</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.boards.map(board => (
            <BoardStatsCard key={board.id} board={board} />
          ))}
        </div>
      </div>

      {/* Дополнительная аналитика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.global_statistics.pending_cards ?? 0}
          </div>
          <div className="text-sm text-gray-600">Задач в работе</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">
            {stats.global_statistics.overdue_cards ?? 0}
          </div>
          <div className="text-sm text-gray-600">Просроченных задач</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.global_statistics.total_comments ?? 0}
          </div>
          <div className="text-sm text-gray-600">Комментариев</div>
        </div>
      </div>
    </div>
  );
};

export default BoardsStatsComponent; 