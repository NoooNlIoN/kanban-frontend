import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const { login, isLoading, error: authError } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку валидации при изменении поля
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация перед отправкой
    if (!formData.username.trim()) {
      setValidationError('Введите имя пользователя');
      return;
    }
    
    if (!formData.password) {
      setValidationError('Введите пароль');
      return;
    }
    
    try {
      await login(formData);
      navigate('/boards');
    } catch (error) {
      // Ошибки обрабатываются в контексте аутентификации
      console.error('Ошибка входа:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(validationError || authError) && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-600 text-sm">{validationError || authError}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Имя пользователя
        </label>
        <input
          id="username"
          type="text"
          name="username"
          required
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Введите имя пользователя"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Введите пароль"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Запомнить меня
          </label>
        </div>
        
        <div>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
            Забыли пароль?
          </a>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Входим...' : 'Войти'}
      </button>
    </form>
  );
};

export default LoginForm; 