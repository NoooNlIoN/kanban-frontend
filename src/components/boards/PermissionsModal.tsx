import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import boardService from '../../api/boardService';
import type { Member, UserRole, AddUserRequest } from '../../api/types';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  currentUserRole: UserRole;
  currentUserId: number;
  onBoardUpdate: () => void;
}

const PermissionsModal = ({ 
  isOpen, 
  onClose, 
  boardId, 
  currentUserRole, 
  currentUserId,
  onBoardUpdate 
}: PermissionsModalProps) => {
  const [users, setUsers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, boardId]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await boardService.getBoardUsers(boardId);
      console.log('Ответ сервера:', response); // Отладочный вывод
      
      // Проверяем структуру ответа - может быть массив или объект с полем users
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && 'users' in response && Array.isArray(response.users)) {
        // Если ответ - объект с полем users, которое является массивом
        setUsers(response.users);
      } else {
        console.warn('Ответ от сервера имеет неожиданный формат:', response);
        setUsers([]); // Используем пустой массив, если не получили данные в ожидаемом формате
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке пользователей');
      setUsers([]); // Сбрасываем пользователей при ошибке
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsAddingUser(true);
      setError(null);
      
      const userData: AddUserRequest = {
        email: email.trim(),
        role
      };
      
      await boardService.addUserToBoard(boardId, userData);
      await fetchUsers();
      setEmail('');
      setRole('member');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении пользователя');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя с доски?')) {
      try {
        setError(null);
        await boardService.removeUserFromBoard(boardId, { user_id: userId });
        setUsers(users.filter(user => user.id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при удалении пользователя');
      }
    }
  };

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    try {
      setError(null);
      await boardService.changeUserRole(boardId, { user_id: userId, role: newRole });
      
      // Обновляем локальный список пользователей
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при изменении роли пользователя');
    }
  };

  const handleTransferOwnership = async (newOwnerId: number) => {
    if (window.confirm('Вы уверены, что хотите передать права владельца этому пользователю? Это действие нельзя отменить.')) {
      try {
        setError(null);
        await boardService.transferBoardOwnership(boardId, { new_owner_id: newOwnerId });
        
        // Обновляем локальный список пользователей
        setUsers(users.map(user => {
          if (user.id === newOwnerId) return { ...user, role: 'owner' };
          if (user.id === currentUserId) return { ...user, role: 'admin' };
          return user;
        }));
        
        onBoardUpdate();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при передаче прав владельца');
      }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  };

  // Функция для закрытия модального окна с обновлением
  const handleClose = () => {
    // Вызываем обновление разрешений при закрытии
    onBoardUpdate();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={handleClose} />
          
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl z-10 overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Управление доступом к доске</h2>
              <button 
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Закрыть"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                <form onSubmit={handleAddUser} className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Добавить пользователя</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      placeholder="Email пользователя"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={currentUserRole !== 'owner'}
                    >
                      <option value="member">Участник</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                      disabled={isAddingUser || !email.trim()}
                    >
                      {isAddingUser ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}
              
              <div>
                <h3 className="text-lg font-medium mb-4">Пользователи доски</h3>
                
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Пользователь
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Роль
                          </th>
                          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Действия
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {currentUserRole === 'owner' && user.id !== currentUserId ? (
                                <select
                                  value={user.role}
                                  onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                                  className="p-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="member">Участник</option>
                                  <option value="admin">Администратор</option>
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role === 'owner' && 'Владелец'}
                                  {user.role === 'admin' && 'Администратор'}
                                  {user.role === 'member' && 'Участник'}
                                </span>
                              )}
                            </td>
                            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {currentUserRole === 'owner' && user.id !== currentUserId && (
                                  <button
                                    onClick={() => handleTransferOwnership(user.id)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                  >
                                    Сделать владельцем
                                  </button>
                                )}
                                
                                {((currentUserRole === 'owner' && user.id !== currentUserId) || 
                                   (currentUserRole === 'admin' && user.role === 'member')) && (
                                  <button
                                    onClick={() => handleRemoveUser(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Удалить
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                        
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                              Пользователи не найдены
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PermissionsModal; 