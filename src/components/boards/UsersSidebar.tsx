import React from 'react';
import UserAvatar from '../common/UserAvatar';
import type { Member } from '../../api/types';

interface UsersSidebarProps {
  members: Member[];
  currentUserId: number;
  isOpen: boolean;
  onClose: () => void;
}

const UsersSidebar: React.FC<UsersSidebarProps> = ({
  members = [],
  currentUserId,
  isOpen,
  onClose,
}) => {
  // Сортируем пользователей: текущий пользователь всегда первый, остальные по алфавиту
  const sortedMembers = React.useMemo(() => {
    if (!members || !Array.isArray(members) || members.length === 0) {
      return [];
    }
    
    return [...members].sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return a.username.localeCompare(b.username);
    });
  }, [members, currentUserId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden z-40" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0  transition-opacity" onClick={onClose}></div>
        
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Участники доски</h2>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Закрыть</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-8">
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-200">
                      {sortedMembers.length > 0 ? (
                        sortedMembers.map(member => (
                          <li key={member.id} className="py-3 flex items-center">
                            <div className="mr-3">
                              <UserAvatar
                                username={member.username}
                                id={member.id}
                                draggable={true}
                                size="md"
                                isAssigned={member.id === currentUserId}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{member.username}</p>
                              <p className="text-sm text-gray-500">{member.role || 'Участник'}</p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="py-3 text-center text-gray-500">
                          Нет доступных пользователей
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 italic">
                    Для назначения пользователя на карточку, перетащите аватар на необходимую карточку.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersSidebar; 