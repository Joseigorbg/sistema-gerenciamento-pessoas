'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './supabaseApi';

// Definição do tipo de usuário
interface User {
  id: string;
  email: string;
  role: string;
}

// Definição do contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

// Criação do contexto com valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  isAdmin: () => false,
});

// Hook para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Chave para armazenar o token no localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Provedor de autenticação
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Recupera o token do localStorage
        const token = localStorage.getItem(TOKEN_KEY);
        
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Verifica se o token é válido
        const { user: authUser } = await authApi.verificarSessao(token);
        
        if (authUser) {
          setUser(authUser);
          // Atualiza o usuário no localStorage
          localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        } else {
          // Token inválido, limpa o localStorage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setError('Erro ao verificar autenticação');
        // Limpa o localStorage em caso de erro
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Função para fazer login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: authUser, session } = await authApi.login(email, password);
      
      // Armazena o token e o usuário no localStorage
      localStorage.setItem(TOKEN_KEY, session.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      
      setUser(authUser);
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      setError(err.message || 'Erro ao fazer login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para cadastrar novo usuário
  const signup = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authApi.cadastrar(email, password);
      
      // Não faz login automático após o cadastro, pois pode ser necessário confirmar o email
      // Exibe mensagem de sucesso
      setError('Cadastro realizado com sucesso! Verifique seu email para confirmar o cadastro.');
    } catch (err: any) {
      console.error('Erro ao cadastrar:', err);
      setError(err.message || 'Erro ao cadastrar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (token) {
        await authApi.logout(token);
      }
      
      // Limpa o localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      setUser(null);
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      setError(err.message || 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se o usuário é administrador
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Valor do contexto
  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Componente para proteger rotas que exigem autenticação
export const RequireAuth: React.FC<{ 
  children: React.ReactNode;
  adminOnly?: boolean;
}> = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redireciona para a página de login se não estiver autenticado
      setRedirecting(true);
      window.location.href = '/login';
    } else if (!loading && adminOnly && !isAdmin()) {
      // Redireciona para a página inicial se não for administrador
      setRedirecting(true);
      window.location.href = '/';
    }
  }, [user, loading, adminOnly, isAdmin]);

  if (loading || redirecting) {
    return <div>Carregando...</div>;
  }

  return <>{children}</>;
};

export default AuthProvider;
