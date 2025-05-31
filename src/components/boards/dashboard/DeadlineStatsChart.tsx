import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import Chart from 'chart.js/auto';

const DeadlineStatsChart: React.FC = () => {
  const { deadlineStats } = useDashboard();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = [
      'Просроченные',
      'Сегодня',
      'На этой неделе',
      'Позже',
      'Без срока'
    ];

    const data = [
      deadlineStats.overdue,
      deadlineStats.dueToday,
      deadlineStats.dueThisWeek,
      deadlineStats.dueLater,
      deadlineStats.noDeadline
    ];

    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',  // красный для просроченных
      'rgba(255, 159, 64, 0.7)',  // оранжевый для сегодняшних
      'rgba(255, 205, 86, 0.7)',  // желтый для недельных
      'rgba(75, 192, 192, 0.7)',  // зеленый для будущих
      'rgba(201, 203, 207, 0.7)'  // серый для бессрочных
    ];

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Карточки',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Количество: ${context.raw as number}`
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
  }, [deadlineStats]);

  const hasData = Object.values(deadlineStats).some(value => value > 0);

  if (!hasData) {
    return <div className="text-gray-500 text-center py-10">Нет данных для отображения</div>;
  }

  return (
    <div className="h-72">
      <canvas ref={chartRef} />
    </div>
  );
};

export default DeadlineStatsChart; 