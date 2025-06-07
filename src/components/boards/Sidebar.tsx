
import { motion } from 'framer-motion';
import type { UserRole } from '../../api/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPermissionsModal: () => void;
  onOpenTagsModal?: () => void;
  currentUserRole: UserRole;
}

const Sidebar = ({ isOpen, onClose, onOpenPermissionsModal, onOpenTagsModal, currentUserRole }: SidebarProps) => {
  // Варианты анимации для боковой панели
  const variants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 },
  };

  return (
    <>

      
      {/* Боковая панель */}
      <motion.div
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-40 p-6 flex flex-col"
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={variants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Настройки доски</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Закрыть панель"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Метка текущей роли пользователя */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500">Ваша роль:</div>
            <div className="font-medium">
              {currentUserRole === 'owner' && 'Владелец'}
              {currentUserRole === 'admin' && 'Администратор'}
              {currentUserRole === 'member' && 'Участник'}
            </div>
          </div>

          {/* Кнопки действий */}
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <>
              <button
                onClick={onOpenPermissionsModal}
                className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Управление доступом</span>
              </button>
              
              {onOpenTagsModal && (
                <button
                  onClick={onOpenTagsModal}
                  className="flex items-center space-x-2 p-3 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>Управление тегами</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-auto text-sm text-gray-500">
          <div className="mb-2">Уровни доступа:</div>
          <ul className="space-y-2">
            <li><strong>Владелец</strong> - полный доступ ко всем функциям</li>
            <li><strong>Администратор</strong> - может изменять доску и управлять пользователями</li>
            <li><strong>Участник</strong> - может отмечать карточки как выполненные</li>
          </ul>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar; 