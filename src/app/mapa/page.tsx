
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Users, 
  LogOut,
  Plus,
  List,
  Map,
  UserCheck,
  ArrowLeft
} from "lucide-react";
import { supabaseApi } from '@/lib/supabaseApi';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Carrega o componente do mapa dinamicamente para evitar problemas com SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <p>Carregando mapa...</p>
});

interface LocationData {
  latitude: number;
  longitude: number;
  quantidade: number;
}

export default function MapaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Carregar dados do mapa
  useEffect(() => {
    const carregarDadosMapa = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const data = await supabaseApi.pessoas.obterDadosMapa(token || undefined);
        setLocations(data);
      } catch (err: any) {
        console.error('Erro ao carregar dados do mapa:', err);
        setError(err.message || 'Erro ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDadosMapa();
  }, []);

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-md">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">Sistema de Pessoas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Olá, {user?.email?.split('@')[0]}
            </p>
          </div>
          <nav className="p-4">
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
              <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" className="w-full justify-start text-red-500" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Mapa de Cadastros Aprovados</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Geográfica</CardTitle>
            </CardHeader>
            <CardContent style={{ height: '600px' }}>
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p>Carregando dados do mapa...</p>
                </div>
              ) : (
                <MapComponent locations={locations} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}

