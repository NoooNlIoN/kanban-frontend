import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/v1';

// Создаем экземпляр axios с базовым URL
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена к запросам
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик для обработки ответов и ошибок
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 (неавторизован) и запрос не на обновление токена
    if (error.response.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // Если нет refresh токена, перенаправляем на страницу логина
          window.location.href = '/auth';
          return Promise.reject(error);
        }
        
        // Пытаемся обновить токен
        const response = await axios.post(`${API_URL}/auth/refresh`, 
          { refresh_token: refreshToken }, 
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.access_token) {
          // Сохраняем новый токен
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          
          // Обновляем заголовок и повторяем исходный запрос
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен, перенаправляем на логин
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    // Если ошибка 403 (запрещено) и пользователь неактивен
    if (error.response.status === 403) {
      // Можно показать уведомление о неактивном аккаунте
      console.error('Аккаунт неактивен');
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 