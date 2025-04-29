'use client';

import React from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RequireAuth>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Página Protegida</h1>
          <p className="mb-4">Você está autenticado como: <strong>{user?.email}</strong></p>
          <p className="mb-4">Função: <strong>{user?.role}</strong></p>
          
          <div className="flex space-x-4 mt-6">
            <Button onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
