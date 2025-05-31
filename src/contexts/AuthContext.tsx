import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import type { User, LoginPayload, RegisterPayload } from '../api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(authService.getUserFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    // Проверяем аутентификацию при загрузке страницы
    const checkAuth = async () => {
      if (isAuthenticated && !user) {
        setIsLoading(true);
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Ошибка при получении данных пользователя:', err);
          authService.logout();
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, user]);

  // Функция для входа пользователя
  const login = async (credentials: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Отправляем данные для входа
      const tokens = await authService.login({
        username: credentials.username,
        password: credentials.password
      });
      
      // Получаем данные пользователя
      const userData = await authService.getCurrentUser();
      setUser(userData);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          'Произошла ошибка при входе. Пожалуйста, попробуйте снова.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для регистрации пользователя
  const register = async (userData: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Отправляем данные для регистрации
      const registeredUser = await authService.register({
        email: userData.email,
        username: userData.username,
        password: userData.password
      });
      
      // Автоматически входим после успешной регистрации
      await authService.login({
        username: userData.username,
        password: userData.password
      });
      
      setUser(registeredUser);
      navigate('/dashboard');
    } catch (err: any) {
      // Обрабатываем разные типы ошибок
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        if (errorData.detail === 'REGISTER_USER_ALREADY_EXISTS') {
          setError('Пользователь с таким email или именем уже существует.');
        } else {
          setError('Ошибка при регистрации. Проверьте введенные данные.');
        }
      } else {
        setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте снова.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода пользователя
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/auth');
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 