import { FC } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import ScreenshotsSection from './ScreenshotsSection';
import FooterSection from './FooterSection';

const LandingPage: FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white py-4 shadow-sm fixed w-full z-10">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
            </svg>
            <span className="text-xl font-bold text-gray-900">dstu-kanban</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Возможности</a>
            <a href="#screenshots" className="text-gray-600 hover:text-blue-600 transition-colors">Скриншоты</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Документация</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Блог</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Войти
            </Link>
            <Link to="/boards" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Мои доски
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow pt-24">
        <HeroSection />
        <FeaturesSection />
        <ScreenshotsSection />
      </main>
      
      <FooterSection />
    </div>
  );
};

export default LandingPage; 