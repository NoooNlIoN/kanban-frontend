import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import boardService from '../../api/boardService';
import type { Board } from '../../api/types';
import { motion } from 'framer-motion';

const BoardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await boardService.getBoards();
      setBoards(response.boards);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке досок');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const board = await boardService.createBoard(newBoard);
      setBoards(prev => [...prev, board]);
      setNewBoard({ title: '', description: '' });
      setIsCreating(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании доски');
    }
  };

  const handleDeleteBoard = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту доску?')) {
      try {
        await boardService.deleteBoard(id);
        setBoards(prev => prev.filter(board => board.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка при удалении доски');
      }
    }
  };

  const handleBoardClick = (boardId: number) => {
    navigate(`/boards/${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мои доски</h1>
            <p className="mt-2 text-sm text-gray-600">
              Привет, {user?.username}! Здесь вы можете управлять своими досками.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Создать доску
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {isCreating && (
          <div className="fixed inset-0  flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-semibold mb-4">Создать новую доску</h2>
              <form onSubmit={handleCreateBoard}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newBoard.title}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={newBoard.description}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <motion.div
              key={board.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
              onClick={() => handleBoardClick(board.id)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{board.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{board.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Создано: {new Date(board.created_at).toLocaleDateString()}</span>
                  <span>Обновлено: {new Date(board.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {boards.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет досок</h3>
            <p className="mt-1 text-sm text-gray-500">Создайте свою первую доску, чтобы начать работу.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardsPage; 