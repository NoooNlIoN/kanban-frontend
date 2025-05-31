import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Показываем индикатор загрузки, пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Если пользователь аутентифицирован, отображаем защищенное содержимое
  return <>{children}</>;
};

export default ProtectedRoute; 