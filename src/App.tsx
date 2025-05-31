import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/landing/LandingPage'
import AuthPage from './components/auth/AuthPage'
import BoardsPage from './components/boards/BoardsPage'
import BoardPage from './components/boards/BoardPage'
import ProfilePage from './components/profile/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'

// Компонент приложения
function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Защищенные маршруты */}
          <Route path="/boards" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar currentPage="boards" />
                <BoardsPage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/boards/:boardId" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <BoardPage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar currentPage="profile" />
                <ProfilePage />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Перенаправление на главную страницу для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
