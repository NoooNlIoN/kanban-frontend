import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import Chart from 'chart.js/auto';

const CardDistributionChart: React.FC = () => {
  const { cardDistribution } = useDashboard();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || cardDistribution.length === 0) return;

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = cardDistribution.map(item => item.columnTitle);
    const data = cardDistribution.map(item => item.cardCount);
    const backgroundColors = cardDistribution.map(item => item.color);

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = data.reduce((acc, val) => acc + val, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              }
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
  }, [cardDistribution]);

  if (cardDistribution.length === 0) {
    return <div className="text-gray-500 text-center py-10">Нет данных для отображения</div>;
  }

  return (
    <div className="h-72">
      <canvas ref={chartRef} />
    </div>
  );
};

export default CardDistributionChart; 