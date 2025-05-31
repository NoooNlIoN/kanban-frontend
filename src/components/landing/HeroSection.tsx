import { FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection: FC = () => {
  return (
    <section className="py-16 md:py-24 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Управляйте задачами <span className="text-blue-600">эффективно</span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto lg:mx-0">
              DSTU-Kanban — это гибкий и удобный инструмент для управления проектами, который помогает командам организовать работу, 
              визуализировать прогресс и повысить продуктивность.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/auth" className="block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 transition-colors">
                  Попробовать
                </Link>
              </motion.div>
              <motion.button 
                className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Узнать больше
              </motion.button>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30"></div>
              <div className="relative bg-white p-2 rounded-xl shadow-2xl">
                <img 
                  src="images/dashboard.png" 
                  alt="DSTU-Kanban интерфейс" 
                  className="rounded-lg w-full h-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x400/e5e7eb/475569?text=DSTU-Kanban+Dashboard";
                  }}
                />
              </div>
              
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-yellow-400 rounded-full blur-xl opacity-70"></div>
              <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-32 h-32 bg-blue-400 rounded-full blur-xl opacity-70"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 