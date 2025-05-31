import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../api';
import type { UserUpdate, UserStatistics } from '../../api';
import { toast } from 'react-hot-toast';
import BoardsStatsComponent from './BoardsStatsComponent';

const ProfilePage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [formData, setFormData] = useState<UserUpdate>({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'statistics', или 'boards-stats'

  // Загрузка статистики пользователя
  useEffect(() => {
    if (user) {
      const loadStatistics = async () => {
        try {
          const data = await userService.getUserStatistics(user.id);
          setStatistics(data);
        } catch (error) {
          console.error('Ошибка при загрузке статистики:', error);
          toast.error('Не удалось загрузить статистику пользователя');
        }
      };
      
      loadStatistics();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверки перед отправкой
    if (formData.password && formData.password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    if (!user) {
      toast.error('Пользователь не авторизован');
      return;
    }
    
    // Отправляем только заполненные поля
    const updateData: UserUpdate = {};
    if (formData.username && formData.username !== user.username) {
      updateData.username = formData.username;
    }
    if (formData.email && formData.email !== user.email) {
      updateData.email = formData.email;
    }
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    // Если нет изменений, не отправляем запрос
    if (Object.keys(updateData).length === 0) {
      toast('Нет изменений для сохранения', {
        icon: 'ℹ️',
        style: {
          backgroundColor: '#EBF8FF',
          color: '#3182CE'
        }
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await userService.updateUser(user.id, updateData);
      toast.success('Профиль успешно обновлен');
      // Очищаем поле пароля после успешного обновления
      setFormData(prev => ({ ...prev, password: '' }));
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Ошибка при обновлении профиля';
      toast.error(errorMessage);
      console.error('Ошибка при обновлении профиля:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Личный кабинет</h1>
            
            {/* Вкладки */}
            <div className="flex justify-center mt-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Профиль
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Статистика
              </button>
              <button
                onClick={() => setActiveTab('boards-stats')}
                className={`px-4 py-2 font-medium text-sm ${
                  activeTab === 'boards-stats'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Статистика досок
              </button>
            </div>
            
            {/* Содержимое вкладок */}
            <div className="mt-8">
              {/* Профиль пользователя */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-blue-800">Информация о пользователе</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Здесь вы можете редактировать свои данные для входа в систему.
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Имя пользователя"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      minLength={3}
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Оставьте пустым, чтобы не менять"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      minLength={8}
                    />
                  </div>
                  
                  {formData.password && (
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Подтвердите новый пароль
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        minLength={8}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
                      ${isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Статистика пользователя */}
              {activeTab === 'statistics' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-yellow-800">Личная статистика</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ваша активность в системе и прогресс выполнения задач.
                    </p>
                  </div>
                  
                  {statistics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Текущая активность</h4>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center">
                            <span className="text-gray-600">Серия активных дней:</span>
                            <span className="font-semibold text-blue-600">{statistics.active_days_streak}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-600">Завершено задач сегодня:</span>
                            <span className="font-semibold text-blue-600">{statistics.completed_tasks}</span>
                          </li>
                          <li className="flex justify-between items-center bg-blue-50 p-3 rounded-md">
                            <span className="text-gray-700 font-medium">В работе сейчас:</span>
                            <span className="font-bold text-blue-700">
                              {(statistics.total_created_tasks - statistics.total_completed_tasks)}
                            </span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Общая статистика</h4>
                        <ul className="space-y-3">
                          <li className="flex justify-between items-center">
                            <span className="text-gray-600">Всего создано задач:</span>
                            <span className="font-semibold text-blue-600">{statistics.total_created_tasks}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-600">Всего завершено задач:</span>
                            <span className="font-semibold text-green-600">{statistics.total_completed_tasks}</span>
                          </li>
                          <li className="flex justify-between items-center">
                            <span className="text-gray-600">Комментариев оставлено:</span>
                            <span className="font-semibold text-blue-600">{statistics.total_comments}</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Добавляем графическое представление прогресса */}
                      <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Прогресс выполнения задач</h4>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                Выполнено
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-green-600">
                                {statistics.total_completed_tasks > 0 && statistics.total_created_tasks > 0 ? 
                                  Math.round((statistics.total_completed_tasks / statistics.total_created_tasks) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                            <div 
                              style={{ 
                                width: `${statistics.total_created_tasks > 0 ? 
                                  (statistics.total_completed_tasks / statistics.total_created_tasks) * 100 : 0}%` 
                              }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <p className="mt-2 text-gray-500">Загрузка статистики...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Статистика досок */}
              {activeTab === 'boards-stats' && (
                <BoardsStatsComponent />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 