import axiosClient from './axiosClient';

// Типы данных
export interface RegisterPayload {
  email: string;
  username: string; 
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
}

const authService = {
  /**
   * Регистрация нового пользователя
   */
  register: async (userData: RegisterPayload): Promise<User> => {
    console.log('Отправляем данные для регистрации:', userData);
    
    const response = await axiosClient.post('/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Получен ответ:', response.data);
    return response.data;
  },

  /**
   * Вход пользователя
   */
  login: async (credentials: LoginPayload): Promise<AuthTokens> => {
    console.log('Отправляем данные для входа:', credentials);
    
    // Создаем FormData для отправки данных
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await axiosClient.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Получен ответ:', response.data);
    
    // Сохраняем токены в localStorage
    const { access_token, refresh_token, token_type } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('token_type', token_type);
    
    return response.data;
  },

  /**
   * Обновление токена
   */
  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await axiosClient.post('/auth/refresh', 
      { refresh_token: refreshToken }, 
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Обновляем токены в localStorage
    const { access_token, refresh_token, token_type } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('token_type', token_type);
    
    return response.data;
  },

  /**
   * Получение информации о текущем пользователе
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get('/auth/me');
    
    // Сохраняем информацию о пользователе
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return response.data;
  },

  /**
   * Выход пользователя
   */
  logout: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
  },

  /**
   * Проверка аутентификации пользователя
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  /**
   * Получение данных пользователя из localStorage
   */
  getUserFromStorage: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (e) {
        return null;
      }
    }
    return null;
  },
};

export default authService; 