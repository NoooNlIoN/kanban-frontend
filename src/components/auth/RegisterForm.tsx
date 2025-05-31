import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { register, isLoading, error: authError } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Введите имя пользователя';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = 'Имя пользователя должно содержать от 3 до 50 символов';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Введите вашу электронную почту';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }
    
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Создаем объект с данными для регистрации без confirmPassword
    const { confirmPassword, ...registrationData } = formData;
    
    try {
      await register(registrationData);
    } catch (error) {
      // Ошибки обрабатываются в контексте аутентификации
      console.error('Ошибка регистрации:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-600 text-sm">{authError}</p>
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
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="От 3 до 50 символов"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Электронная почта
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="example@mail.ru"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
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
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Минимум 8 символов"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Подтверждение пароля
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Повторите пароль"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          id="terms"
          type="checkbox"
          required
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          Я согласен с <a href="#" className="text-blue-600 hover:text-blue-800">условиями использования</a> и <a href="#" className="text-blue-600 hover:text-blue-800">политикой конфиденциальности</a>
        </label>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
};

export default RegisterForm; 