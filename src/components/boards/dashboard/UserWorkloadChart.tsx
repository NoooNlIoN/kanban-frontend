import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import Chart from 'chart.js/auto';

const UserWorkloadChart: React.FC = () => {
  const { userWorkload } = useDashboard();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || userWorkload.length === 0) return;

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Сортируем пользователей по количеству назначенных карточек
    const sortedUsers = [...userWorkload].sort((a, b) => b.assignedCards - a.assignedCards);
    
    // Ограничиваем количество отображаемых пользователей
    const displayUsers = sortedUsers.slice(0, 8);
    
    const labels = displayUsers.map(item => item.username);
    const data = displayUsers.map(item => item.assignedCards);

    // Генерируем разные цвета для каждого пользователя
    const backgroundColors = [
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)',
    ];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Назначено карточек',
          data: data,
          backgroundColor: backgroundColors.slice(0, displayUsers.length),
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')).slice(0, displayUsers.length),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // horizontal bar
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Карточек: ${context.raw as number}`
            }
          }
        },
        scales: {
          x: {
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
  }, [userWorkload]);

  if (userWorkload.length === 0) {
    return <div className="text-gray-500 text-center py-10">Нет данных для отображения</div>;
  }

  return (
    <div className="h-72">
      <canvas ref={chartRef} />
    </div>
  );
};

export default UserWorkloadChart; 