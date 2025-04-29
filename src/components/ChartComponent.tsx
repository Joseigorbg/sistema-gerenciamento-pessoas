'use client';

// Declaração para o objeto Chart global do Chart.js (carregado via CDN)
declare global {
  interface Window {
    Chart: any;
  }
}

import React, { useEffect, useRef, useState } from 'react';

interface ChartComponentProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  options?: any;
  height?: number;
  width?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  type, 
  data, 
  options = {}, 
  height = 300,
  width = 100
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [isChartJsLoaded, setIsChartJsLoaded] = useState(false);

  // Verifica se o Chart.js foi carregado via CDN
  useEffect(() => {
    const checkChartJs = () => {
      if (typeof window !== 'undefined' && window.Chart) {
        setIsChartJsLoaded(true);
      } else {
        // Tenta novamente após um pequeno atraso
        setTimeout(checkChartJs, 100);
      }
    };
    checkChartJs();
  }, []);

  // Inicializa o gráfico quando o Chart.js estiver carregado
  useEffect(() => {
    if (!isChartJsLoaded || !chartRef.current) return;

    // Destrói o gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Cria um novo gráfico
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new window.Chart(ctx, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      });
    }

    // Limpeza ao desmontar o componente
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [isChartJsLoaded, type, data, options]);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      {!isChartJsLoaded ? (
        <div style={{ 
          height: '100%', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          Carregando gráfico...
        </div>
      ) : (
        <canvas ref={chartRef} />
      )}
    </div>
  );
};

export default ChartComponent;
