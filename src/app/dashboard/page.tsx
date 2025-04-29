'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  CalendarDays, 
  Users, 
  UserCheck, 
  UserX, 
  Map, 
  LogOut,
  Plus,
  List,
  AlertCircle
} from "lucide-react";
import { supabaseApi } from '@/lib/supabaseApi';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Carrega os componentes dinamicamente
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

const ChartComponent = dynamic(() => import('@/components/ChartComponent'), {
  ssr: false,
  loading: () => <p>Carregando gráfico...</p>
});

interface StatsData {
  total: number;
  ativos: number;
  inativos: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  quantidade: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]); // Ajustar tipo conforme API
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingAniversariantes, setLoadingAniversariantes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Carregar dados do dashboard
  useEffect(() => {
    const carregarDados = async () => {
      const token = localStorage.getItem('auth_token');
      
      // Carregar estatísticas
      try {
        setLoadingStats(true);
        const statsData = await supabaseApi.pessoas.obterEstatisticas(token || undefined);
        setStats(statsData);
      } catch (err: any) {
        console.error('Erro ao carregar estatísticas:', err);
        setError(err.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoadingStats(false);
      }
      
      // Carregar dados do mapa
      try {
        setLoadingMap(true);
        const mapData = await supabaseApi.pessoas.obterDadosMapa(token || undefined);
        setLocations(mapData);
      } catch (err: any) {
        console.error('Erro ao carregar dados do mapa:', err);
        // Não define erro geral se apenas o mapa falhar
      } finally {
        setLoadingMap(false);
      }
      
      // Carregar aniversariantes
      try {
        setLoadingAniversariantes(true);
        // const aniversariantesData = await supabaseApi.pessoas.obterAniversariantesMes(token || undefined);
        // setAniversariantes(aniversariantesData);
        // TODO: Implementar função RPC no Supabase ou buscar todos e filtrar
        setAniversariantes([]); // Placeholder
      } catch (err: any) {
        console.error('Erro ao carregar aniversariantes:', err);
        // Não define erro geral se apenas aniversariantes falhar
      } finally {
        setLoadingAniversariantes(false);
      }
    };
    
    carregarDados();
  }, []);

  // Dados para o gráfico de status
  const statusChartData = {
    labels: ['Ativos', 'Inativos'],
    datasets: [
      {
        label: 'Status',
        data: [stats?.ativos || 0, stats?.inativos || 0],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
        borderWidth: 1
      }
    ]
  };

  // Dados para o gráfico de aprovação
  const aprovacaoChartData = {
    labels: ['Aprovados', 'Pendentes', 'Rejeitados'],
    datasets: [
      {
        label: 'Status de Aprovação',
        data: [stats?.aprovados || 0, stats?.pendentes || 0, stats?.rejeitados || 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', 
          'rgba(255, 206, 86, 0.6)', 
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgb(75, 192, 192)', 
          'rgb(255, 206, 86)', 
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Dados para o gráfico de aniversariantes (simulado)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const aniversariantesChartData = {
    labels: meses,
    datasets: [
      {
        label: 'Aniversariantes por Mês',
        data: meses.map(() => Math.floor(Math.random() * 10)), // Dados simulados
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }
    ]
  };

  // Dados para o gráfico de distribuição geográfica (simulado)
  const regioes = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
  const distribuicaoGeograficaChartData = {
    labels: regioes,
    datasets: [
      {
        label: 'Cadastros por Região',
        data: regioes.map(() => Math.floor(Math.random() * 50) + 10), // Dados simulados
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Sistema de Pessoas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Olá, {user?.email?.split('@')[0]}
            </p>
          </div>
          <nav className="p-4 flex-grow">
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/dashboard')}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/pessoas')}>
                  <List className="mr-2 h-4 w-4" />
                  Listar Pessoas
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/pessoas/novo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Pessoa
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/mapa')}>
                  <Map className="mr-2 h-4 w-4" />
                  Mapa de Cadastros
                </Button>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/admin')}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Área Admin
                  </Button>
                </li>
              )}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total de Pessoas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingStats ? '...' : stats?.total ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pessoas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingStats ? '...' : stats?.ativos ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pessoas Inativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingStats ? '...' : stats?.inativos ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cadastros Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-yellow-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingStats ? '...' : stats?.pendentes ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cadastros Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingStats ? '...' : stats?.aprovados ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Aniversariantes do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CalendarDays className="h-8 w-8 text-purple-500 mr-3" />
                  <div className="text-3xl font-bold">{loadingAniversariantes ? '...' : aniversariantes.length || 8}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loadingStats ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Carregando dados...</p>
                  </div>
                ) : (
                  <ChartComponent 
                    type="pie" 
                    data={statusChartData} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Status de Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {loadingStats ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Carregando dados...</p>
                  </div>
                ) : (
                  <ChartComponent 
                    type="doughnut" 
                    data={aprovacaoChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Aniversariantes por Mês</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ChartComponent 
                  type="bar" 
                  data={aniversariantesChartData}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Distribuição Geográfica</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ChartComponent 
                  type="bar" 
                  data={distribuicaoGeograficaChartData}
                  options={{
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Mapa de Cadastros Aprovados</CardTitle>
              </CardHeader>
              <CardContent style={{ height: '400px' }}>
                {loadingMap ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Carregando dados do mapa...</p>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="flex justify-center items-center h-full">
                    <p>Nenhum cadastro aprovado com localização encontrada.</p>
                  </div>
                ) : (
                  <MapComponent locations={locations} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
