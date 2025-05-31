import { type FC, useState } from 'react';
import { motion } from 'framer-motion';

const screenshots = [
  {
    title: "Доска канбан с карточками",
    description: "Визуализируйте рабочий процесс с помощью интуитивно понятных досок.",
    image: "images/kanban.png",
    placeholder: "https://placehold.co/800x500/e5e7eb/475569?text=Канбан+доска"
  },
  {
    title: "Детальный просмотр карточки",
    description: "Просматривайте и редактируйте все детали задачи в удобном интерфейсе.",
    image: "images/card.png",
    placeholder: "https://placehold.co/800x500/e5e7eb/475569?text=Детали+карточки"
  },
  {
    title: "Аналитика и отчеты",
    description: "Отслеживайте производительность команды с помощью встроенной аналитики.",
    image: "images/dashboard.png",
    placeholder: "https://placehold.co/800x500/e5e7eb/475569?text=Аналитика"
  }
];

const ScreenshotsSection: FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((current) => (current === screenshots.length - 1 ? 0 : current + 1));
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current === 0 ? screenshots.length - 1 : current - 1));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = screenshots[activeIndex].placeholder;
  };

  return (
    <section id="screenshots" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Посмотрите как это работает
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Интуитивный интерфейс DSTU-Kanban делает управление проектами простым и эффективным
          </motion.p>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          <div className="overflow-hidden rounded-2xl shadow-2xl h-[500px]">
            <motion.div 
              className="flex transition-transform duration-300 ease-in-out h-full"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {screenshots.map((screenshot, index) => (
                <div key={index} className="w-full flex-shrink-0 h-full">
                  <div className="relative h-full">
                    <img 
                      src={screenshot.image} 
                      alt={screenshot.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                      <h3 className="text-xl font-semibold mb-2">{screenshot.title}</h3>
                      <p className="text-white/80">{screenshot.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
          
          <button 
            className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-900 hover:bg-white shadow-md z-10"
            onClick={prevSlide}
            aria-label="Предыдущий слайд"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-gray-900 hover:bg-white shadow-md z-10"
            onClick={nextSlide}
            aria-label="Следующий слайд"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <div className="flex justify-center mt-6 space-x-2">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === activeIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Перейти к слайду ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScreenshotsSection; 