import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import boardService from '../api/boardService';
import type { Column, Card, Member, User } from '../api/types';

// Типы для аналитических данных
export interface CardDistribution {
  columnId: number;
  columnTitle: string;
  cardCount: number;
  color: string;
}

export interface DeadlineStats {
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  dueLater: number;
  noDeadline: number;
}

export interface UserWorkload {
  userId: number;
  username: string;
  assignedCards: number;
}

export interface UserActivity {
  userId: number;
  username: string;
  cardsCreated: number;
  cardsCompleted: number;
}

export interface DashboardFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'all';
  includeCompleted: boolean;
  users: number[]; // ID пользователей для фильтрации
}

export interface DashboardConfig {
  showCardDistribution: boolean;
  showDeadlineStats: boolean;
  showUserWorkload: boolean;
  showUserActivity: boolean;
}

interface DashboardContextType {
  isLoading: boolean;
  error: string | null;
  cardDistribution: CardDistribution[];
  deadlineStats: DeadlineStats;
  userWorkload: UserWorkload[];
  userActivity: UserActivity[];
  filters: DashboardFilters;
  config: DashboardConfig;
  columns: Column[];
  updateFilters: (newFilters: Partial<DashboardFilters>) => void;
  updateConfig: (newConfig: Partial<DashboardConfig>) => void;
  refreshData: () => Promise<void>;
}

const defaultDashboardFilters: DashboardFilters = {
  dateRange: 'week',
  includeCompleted: false,
  users: [],
};

const defaultDashboardConfig: DashboardConfig = {
  showCardDistribution: true,
  showDeadlineStats: true,
  showUserWorkload: true,
  showUserActivity: true,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  boardId: number;
  children: ReactNode;
  columns: Column[];
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ 
  boardId, 
  children,
  columns
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardDistribution, setCardDistribution] = useState<CardDistribution[]>([]);
  const [deadlineStats, setDeadlineStats] = useState<DeadlineStats>({
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
    dueLater: 0,
    noDeadline: 0,
  });
  const [userWorkload, setUserWorkload] = useState<UserWorkload[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [config, setConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [boardMembers, setBoardMembers] = useState<Member[]>([]);
  const [userMap, setUserMap] = useState<Map<number, string>>(new Map());

  // Функция для получения данных о пользователях доски
  const fetchBoardMembers = async () => {
    try {
      const response = await boardService.getBoardUsers(boardId);
      
      // Обрабатываем структуру ответа (проверяем наличие поля users)
      const members = 'users' in response ? response.users : response;
      setBoardMembers(Array.isArray(members) ? members : []);
      
      // Создаем карту ID -> имя пользователя для быстрого доступа
      const newUserMap = new Map<number, string>();
      if (Array.isArray(members)) {
        members.forEach(member => {
          newUserMap.set(member.id, member.username);
        });
      }
      setUserMap(newUserMap);
      
      return newUserMap;
    } catch (err: any) {
      console.error("Ошибка при получении списка пользователей:", err);
      return new Map<number, string>();
    }
  };

  // Функция для расчета распределения карточек по колонкам
  const calculateCardDistribution = (columns: Column[]): CardDistribution[] => {
    // Цвета для колонок (можно настроить или генерировать динамически)
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#8AC148', '#EA5F89', '#00D8B6', '#FFB88C'
    ];
    
    return columns.map((column, index) => ({
      columnId: column.id,
      columnTitle: column.title,
      cardCount: column.cards.length,
      color: colors[index % colors.length]
    }));
  };

  // Функция для расчета статистики по дедлайнам
  const calculateDeadlineStats = (columns: Column[]): DeadlineStats => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    
    let overdue = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    let dueLater = 0;
    let noDeadline = 0;
    
    // Проходим по всем карточкам всех колонок
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (!card.deadline) {
          noDeadline++;
          return;
        }
        
        const deadline = new Date(card.deadline);
        
        if (deadline < now && !card.completed) {
          overdue++;
        } else if (deadline <= endOfDay) {
          dueToday++;
        } else if (deadline <= endOfWeek) {
          dueThisWeek++;
        } else {
          dueLater++;
        }
      });
    });
    
    return {
      overdue,
      dueToday,
      dueThisWeek,
      dueLater,
      noDeadline
    };
  };

  // Функция для расчета нагрузки на пользователей
  const calculateUserWorkload = (columns: Column[], userMapping: Map<number, string>): UserWorkload[] => {
    const userWorkloadMap: Map<number, { userId: number; username: string; assignedCards: number }> = new Map();
    
    // Вспомогательная функция для добавления пользователя в Map
    const addOrUpdateUser = (userId: number, username: string) => {
      const userData = userWorkloadMap.get(userId);
      if (userData) {
        userData.assignedCards++;
      } else {
        userWorkloadMap.set(userId, {
          userId,
          username,
          assignedCards: 1
        });
      }
    };
    
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.assigned_users && card.assigned_users.length > 0) {
          card.assigned_users.forEach(user => {
            // Проверяем тип данных: объект User или просто ID
            if (typeof user === 'number') {
              // Если ID, то ищем никнейм в нашей карте пользователей
              const username = userMapping.get(user) || `ID:${user}`;
              addOrUpdateUser(user, username);
            } else {
              // Если объект User, используем его id и username
              addOrUpdateUser(user.id, user.username);
            }
          });
        }
      });
    });
    
    return Array.from(userWorkloadMap.values());
  };

  // Функция для расчета активности пользователей
  const calculateUserActivity = (columns: Column[], userMapping: Map<number, string>): UserActivity[] => {
    const userActivityMap: Map<number, { userId: number; username: string; cardsCreated: number; cardsCompleted: number }> = new Map();
    
    // Вспомогательная функция для добавления или обновления пользователя в Map
    const addOrUpdateUser = (userId: number, username: string, isCompleted: boolean) => {
      const userData = userActivityMap.get(userId);
      if (userData) {
        userData.cardsCreated++;
        if (isCompleted) {
          userData.cardsCompleted++;
        }
      } else {
        userActivityMap.set(userId, {
          userId,
          username,
          cardsCreated: 1,
          cardsCompleted: isCompleted ? 1 : 0
        });
      }
    };

    columns.forEach(column => {
      column.cards.forEach(card => {
        // Используем первого назначенного пользователя как создателя карточки, если они есть
        if (card.assigned_users && card.assigned_users.length > 0) {
          const user = card.assigned_users[0]; // Берём первого назначенного пользователя
          
          // Проверяем тип данных: объект User или просто ID
          if (typeof user === 'number') {
            // Если ID, то ищем никнейм в нашей карте пользователей
            const username = userMapping.get(user) || `ID:${user}`;
            addOrUpdateUser(user, username, !!card.completed);
          } else {
            // Если объект User, используем его id и username
            addOrUpdateUser(user.id, user.username, !!card.completed);
          }
        }
      });
    });
    
    return Array.from(userActivityMap.values());
  };

  // Функция для обновления всех аналитических данных
  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Получаем актуальный список пользователей
      const currentUserMap = await fetchBoardMembers();
      
      // Рассчитываем все метрики
      setCardDistribution(calculateCardDistribution(columns));
      setDeadlineStats(calculateDeadlineStats(columns));
      setUserWorkload(calculateUserWorkload(columns, currentUserMap));
      setUserActivity(calculateUserActivity(columns, currentUserMap));
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных дашборда');
      setIsLoading(false);
    }
  };

  // Обновляем данные при первой загрузке и при изменении boardId или фильтров
  useEffect(() => {
    refreshData();
  }, [boardId, filters, columns]);

  // Функция для обновления фильтров
  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Функция для обновления конфигурации
  const updateConfig = (newConfig: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const contextValue: DashboardContextType = {
    isLoading,
    error,
    cardDistribution,
    deadlineStats,
    userWorkload,
    userActivity,
    filters,
    config,
    columns,
    updateFilters,
    updateConfig,
    refreshData,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}; 