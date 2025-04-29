'use client';

import React from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RequireAuth adminOnly>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Área do Administrador</CardTitle>
            <CardDescription>
              Esta página só pode ser acessada por administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Você está autenticado como: <strong>{user?.email}</strong></p>
            <p className="mb-4">Função: <strong>{user?.role}</strong></p>
            <p className="mb-4">É administrador: <strong>{isAdmin() ? 'Sim' : 'Não'}</strong></p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </CardFooter>
        </Card>
      </div>
    </RequireAuth>
  );
}
