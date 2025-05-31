import axiosClient from './axiosClient';
import type { 
  Board, 
  BoardsResponse, 
  BoardComplete, 
  Column, 
  Card, 
  Member, 
  AddUserRequest, 
  RemoveUserRequest, 
  TransferOwnershipRequest, 
  ChangeRoleRequest,
  UserRole,
  Comment,
  UserBoardsStatsResponse
} from './types';

// Интерфейсы для аналитических данных
export interface BoardAnalytics {
  cardDistribution: {
    columnId: number;
    columnTitle: string;
    cardCount: number;
  }[];
  deadlineStats: {
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    dueLater: number;
    noDeadline: number;
  };
  userWorkload: {
    userId: number;
    username: string;
    assignedCards: number;
  }[];
  userActivity: {
    userId: number;
    username: string;
    cardsCreated: number;
    cardsCompleted: number;
  }[];
}

// Функция для обработки ошибок API
const handleError = (error: any): never => {
  console.error('API Error:', error);
  if (error.response && error.response.data) {
    throw error.response.data;
  }
  throw new Error('Произошла ошибка при обращении к API');
};

const boardService = {
  /**
   * Получение списка досок пользователя
   */
  getBoards: async (skip: number = 0, limit: number = 10): Promise<BoardsResponse> => {
    const response = await axiosClient.get('/boards', {
      params: { skip, limit }
    });
    return response.data;
  },

  /**
   * Получение доски по ID
   */
  getBoard: async (id: number): Promise<Board> => {
    const response = await axiosClient.get(`/boards/${id}`);
    return response.data;
  },

  /**
   * Получение полной информации о доске (включая колонки и карточки)
   */
  getBoardComplete: async (id: number): Promise<BoardComplete> => {
    const response = await axiosClient.get(`/boards/${id}/complete`);
    return response.data;
  },

  /**
   * Получение списка всех пользователей доски
   */
  getBoardMembers: async (boardId: number): Promise<Member[]> => {
    try {
      const response = await axiosClient.get(`/boards/${boardId}/members`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Создание новой доски
   */
  createBoard: async (boardData: { title: string; description: string }): Promise<Board> => {
    const response = await axiosClient.post('/boards', boardData);
    return response.data;
  },

  /**
   * Обновление доски
   */
  updateBoard: async (id: number, boardData: { title?: string; description?: string }): Promise<Board> => {
    const response = await axiosClient.put(`/boards/${id}`, boardData);
    return response.data;
  },

  /**
   * Удаление доски
   */
  deleteBoard: async (id: number): Promise<void> => {
    await axiosClient.delete(`/boards/${id}`);
  },

  /**
   * Получение всех колонок доски
   */
  getColumns: async (boardId: number): Promise<Column[]> => {
    const response = await axiosClient.get(`/boards/${boardId}/columns`);
    return response.data;
  },

  /**
   * Получение колонки по ID
   */
  getColumn: async (boardId: number, columnId: number): Promise<Column> => {
    const response = await axiosClient.get(`/boards/${boardId}/columns/${columnId}`);
    return response.data;
  },

  /**
   * Создание новой колонки
   */
  createColumn: async (boardId: number, columnData: { title: string; order?: number }): Promise<Column> => {
    const response = await axiosClient.post(`/boards/${boardId}/columns`, columnData);
    return response.data;
  },

  /**
   * Обновление всех колонок (например, для обновления позиций)
   */
  updateColumns: async (
    boardId: number, 
    data: { column_order: number[] }
): Promise<{ message: string }> => {
    const response = await axiosClient.put(
        `/boards/${boardId}/columns/reorder`, 
        data
    );
    return response.data;
},
  /**
   * Обновление колонки
   */
  updateColumn: async (boardId: number, columnId: number, columnData: { title?: string; order?: number }): Promise<Column> => {
    const response = await axiosClient.put(`/boards/${boardId}/columns/${columnId}`, columnData);
    return response.data;
  },

  /**
   * Удаление колонки
   */
  deleteColumn: async (boardId: number, columnId: number): Promise<void> => {
    await axiosClient.delete(`/boards/${boardId}/columns/${columnId}`);
  },

  /**
   * Получение всех карточек колонки
   */
  getCards: async (boardId: number, columnId: number): Promise<Card[]> => {
    const response = await axiosClient.get(`/boards/${boardId}/columns/${columnId}/cards`);
    return response.data;
  },

  /**
   * Получение карточки по ID
   */
  getCard: async (boardId: number, cardId: number): Promise<Card> => {
    const response = await axiosClient.get(`/boards/${boardId}/cards/${cardId}`);
    return response.data;
  },

  /**
   * Создание новой карточки
   */
  createCard: async (
    boardId: number, 
    columnId: number, 
    cardData: { 
      title: string; 
      description?: string; 
      order?: number;
      color?: string;
      completed?: boolean;
      deadline?: string;
      assigned_users?: number[];
    }
  ): Promise<Card> => {
    const response = await axiosClient.post(
      `/boards/${boardId}/columns/${columnId}/cards`, 
      cardData
    );
    return response.data;
  },

  /**
   * Обновление всех карточек колонки (например, для сортировки)
   * Соответствует API: PUT /api/v1/boards/{board_id}/columns/{column_id}/cards
   * @param boardId ID доски
   * @param columnId ID колонки
   * @param data объект с массивом ID карточек в новом порядке { card_order: number[] }
   */
  updateCards: async (
    boardId: number, 
    columnId: number, 
    data: { card_order: number[] }
): Promise<{ message: string }> => {
    const response = await axiosClient.put(
        `/boards/${boardId}/columns/${columnId}/cards/reorder`, 
        data
    );
    return response.data;
  },

  /**
   * Обновление карточки
   */
  updateCard: async (
    boardId: number,
    cardId: number,
    columnId: number,
    cardData: { 
      title?: string; 
      description?: string; 
      order?: number;
      color?: string;
      completed?: boolean;
      deadline?: string | undefined | null;
      assigned_users?: number[];
    }
  ): Promise<Card> => {
    console.log('API updateCard вызван с данными:', cardData);
    
    // Клонируем объект, чтобы не изменять исходный
    const dataToSend = { ...cardData };
    
    // Если deadline явно установлен в null, удаляем его из запроса
    // Это нужно, так как бэкенд ожидает отсутствие поля для удаления дедлайна
    if (dataToSend.deadline === null) {
      console.log('boardService: удаляем поле deadline из запроса');
      delete dataToSend.deadline;
    }
    
    console.log('boardService: отправка данных после обработки:', dataToSend);
    
    const response = await axiosClient.put(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}`,
      dataToSend
    );
    return response.data;
  },

  /**
   * Перемещение карточки между колонками
   * Соответствует API: PUT /api/v1/boards/{board_id}/cards/{card_id}/move
   * @param boardId ID доски
   * @param cardId ID карточки
   * @param moveData объект CardMove { column_id: ID новой колонки; order: новая позиция карточки }
   */
  moveCard: async (
    boardId: number,
    cardId: number,
    moveData: { 
      column_id: number; 
      order: number 
    }
  ): Promise<Card> => {
    const response = await axiosClient.put(
      `/boards/${boardId}/cards/${cardId}/move`,
      moveData
    );
    return response.data;
  },

  /**
   * Удаление карточки
   */
  deleteCard: async (boardId: number, cardId: number, columnId: number): Promise<void> => {
    await axiosClient.delete(`/boards/${boardId}/columns/${columnId}/cards/${cardId}`);
  },

  /**
   * Назначить пользователя на карточку
   */
  assignUserToCard: async (boardId: number, columnId: number, cardId: number, userId: number): Promise<void> => {
    await axiosClient.post(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}/assign`,
      { user_id: userId }
    );
  },

  /**
   * Снять назначение пользователя с карточки
   */
  unassignUserFromCard: async (boardId: number, columnId: number, cardId: number, userId: number): Promise<void> => {
    await axiosClient.delete(`/boards/${boardId}/columns/${columnId}/cards/${cardId}/unassign/${userId}`);
  },

  /**
   * Переключение статуса выполнения карточки
   */
  toggleCardCompleted: async (boardId: number, columnId: number, cardId: number): Promise<Card> => {
    const response = await axiosClient.post(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}/toggle-completed`
    );
    return response.data;
  },

  /**
   * Получение списка пользователей доски
   */
  getBoardUsers: async (boardId: number): Promise<Member[] | { users: Member[] }> => {
    const response = await axiosClient.get(`/boards/${boardId}/permissions/users`);
    return response.data;
  },

  /**
   * Добавление пользователя на доску по email
   */
  addUserToBoard: async (boardId: number, userData: AddUserRequest): Promise<Member> => {
    const response = await axiosClient.post(
      `/boards/${boardId}/permissions/add-user-by-email`,
      userData
    );
    return response.data;
  },

  /**
   * Удаление пользователя с доски
   */
  removeUserFromBoard: async (boardId: number, userData: RemoveUserRequest): Promise<void> => {
    await axiosClient.delete(
      `/boards/${boardId}/permissions/remove-user`,
      { data: userData }
    );
  },

  /**
   * Передача прав владельца доски другому пользователю
   */
  transferBoardOwnership: async (boardId: number, data: TransferOwnershipRequest): Promise<void> => {
    await axiosClient.post(
      `/boards/${boardId}/permissions/transfer-ownership`,
      data
    );
  },

  /**
   * Изменение роли пользователя на доске
   */
  changeUserRole: async (boardId: number, data: ChangeRoleRequest): Promise<Member> => {
    const response = await axiosClient.post(
      `/boards/${boardId}/permissions/change-role`,
      data
    );
    return response.data;
  },

  /**
   * Получение комментариев карточки
   */
  getCardComments: async (boardId: number, columnId: number, cardId: number): Promise<Comment[]> => {
    const response = await axiosClient.get(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments`
    );
    return response.data;
  },

  /**
   * Создание комментария к карточке
   */
  createCardComment: async (
    boardId: number, 
    columnId: number, 
    cardId: number, 
    commentData: { text: string }
  ): Promise<Comment> => {
    const response = await axiosClient.post(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments`,
      { 
        text: commentData.text,
        card_id: cardId
      }
    );
    return response.data;
  },

  /**
   * Удаление комментария
   */
  deleteCardComment: async (
    boardId: number, 
    columnId: number, 
    cardId: number, 
    commentId: number
  ): Promise<void> => {
    await axiosClient.delete(
      `/boards/${boardId}/columns/${columnId}/cards/${cardId}/comments/${commentId}`
    );
  },

  // Методы аналитики
  getBoardAnalytics: async (boardId: number, filters?: {
    dateRange?: 'week' | 'month' | 'quarter' | 'all';
    includeCompleted?: boolean;
    userIds?: number[];
  }): Promise<BoardAnalytics> => {
    try {
      const response = await axiosClient.get(`/boards/${boardId}/analytics`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Получение полной статистики всех досок пользователя
   */
  getUserBoardsFullStatistics: async (): Promise<UserBoardsStatsResponse> => {
    const response = await axiosClient.get('/boards/stats/full');
    return response.data;
  },
};

export default boardService; 