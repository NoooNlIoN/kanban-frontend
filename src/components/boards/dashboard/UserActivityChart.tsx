import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import Chart from 'chart.js/auto';

const UserActivityChart: React.FC = () => {
  const { userActivity } = useDashboard();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || userActivity.length === 0) return;

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Сортируем пользователей по количеству созданных карточек
    const sortedUsers = [...userActivity].sort((a, b) => b.cardsCreated - a.cardsCreated);
    
    // Ограничиваем количество отображаемых пользователей
    const displayUsers = sortedUsers.slice(0, 6);
    
    const labels = displayUsers.map(item => item.username);
    const createdData = displayUsers.map(item => item.cardsCreated);
    const completedData = displayUsers.map(item => item.cardsCompleted);

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Создано карточек',
            data: createdData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Выполнено карточек',
            data: completedData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                return `${datasetLabel}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [userActivity]);

  if (userActivity.length === 0) {
    return <div className="text-gray-500 text-center py-10">Нет данных для отображения</div>;
  }

  return (
    <div className="h-72">
      <canvas ref={chartRef} />
    </div>
  );
};

export default UserActivityChart; 