import axiosClient from './axiosClient';
import boardService from './boardService';

// Интерфейсы для работы с сервисом пользователей
export interface UserUpdate {
  email?: string;
  username?: string;
  password?: string;
}

// Отдельный интерфейс для статистики, экспортируемый отдельно
export interface UserStatistics {
  completed_tasks: number;
  active_days_streak: number;
  total_completed_tasks: number;
  total_created_tasks: number;
  total_comments: number;
  id: number;
  user_id: number;
}

const userService = {
  /**
   * Получение текущего профиля пользователя
   */
  getCurrentProfile: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  /**
   * Обновление данных пользователя
   */
  updateUser: async (userId: number, userData: UserUpdate) => {
    const response = await axiosClient.patch(`/users/${userId}`, userData);
    // Обновляем информацию в localStorage
    if (response.data) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
    return response.data;
  },

  /**
   * Получение статистики пользователя с сервера
   */
  getUserStatistics: async (userId: number): Promise<UserStatistics> => {
    const response = await axiosClient.get(`/users/${userId}/statistics`);
    return response.data;
  },
  
  /**
   * Расчет статистики пользователя на фронтенде на основе всех досок
   */
  calculateUserStatistics: async (userId: number): Promise<UserStatistics> => {
    // Получаем список всех досок пользователя
    try {
      // Первым делом получаем список всех досок
      const response = await boardService.getBoards(0, 1000); // Получаем максимальное количество досок
      const boards = response.boards;
      
      // Для хранения статистики
      let totalCreatedTasks = 0;
      let totalCompletedTasks = 0;
      let totalComments = 0;
      let completedTasksToday = 0;
      
      // Для подсчета серии активных дней
      const activeDaysSet = new Set<string>();
      
      // Проходим по каждой доске для получения детальной информации
      const boardDetailsPromises = boards.map(board => boardService.getBoardComplete(board.id));
      const boardsDetails = await Promise.all(boardDetailsPromises);
      
      // Дата сегодняшнего дня в формате YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Анализируем каждую доску
      boardsDetails.forEach(board => {
        // Проходим по всем колонкам
        board.columns.forEach(column => {
          // Проходим по всем карточкам
          column.cards.forEach(card => {
            // Увеличиваем общее количество задач
            totalCreatedTasks++;
            
            // Проверяем завершенные задачи
            if (card.completed) {
              totalCompletedTasks++;
              
              // Проверяем, завершена ли задача сегодня
              const updatedDate = new Date(card.updated_at).toISOString().split('T')[0];
              if (updatedDate === today) {
                completedTasksToday++;
              }
            }
            
            // Если у карточки есть дата обновления, добавляем ее в множество активных дней
            if (card.updated_at) {
              const dayKey = new Date(card.updated_at).toISOString().split('T')[0];
              activeDaysSet.add(dayKey);
            }
            
            // Если у карточки есть комментарии, считаем их
            if (card.comments) {
              totalComments += card.comments.length;
            }
          });
        });
      });
      
      // Вычисляем серию активных дней (упрощенный алгоритм)
      // В реальном приложении нужно было бы искать непрерывные дни активности
      let activeDaysStreak = 0;
      
      // Получаем текущую дату
      const currentDate = new Date();
      
      // Проверяем последние 30 дней
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(currentDate.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        if (activeDaysSet.has(dateString)) {
          activeDaysStreak++;
        } else {
          // Если нашли день без активности, прерываем серию
          break;
        }
      }
      
      // Формируем объект статистики
      const stats: UserStatistics = {
        completed_tasks: completedTasksToday,
        active_days_streak: activeDaysStreak,
        total_completed_tasks: totalCompletedTasks,
        total_created_tasks: totalCreatedTasks,
        total_comments: totalComments,
        id: 0, // Будет заменено реальным ID при синхронизации с бэкендом
        user_id: userId
      };
      
      return stats;
    } catch (error) {
      console.error('Ошибка при расчете статистики:', error);
      
      // В случае ошибки возвращаем пустую статистику
      return {
        completed_tasks: 0,
        active_days_streak: 0,
        total_completed_tasks: 0,
        total_created_tasks: 0,
        total_comments: 0,
        id: 0,
        user_id: userId
      };
    }
  }
};

export default userService; 