
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Users, 
  LogOut,
  Plus,
  List,
  Map,
  UserCheck,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle, 
  XCircle
} from "lucide-react";
import { supabaseApi, Pessoa } from '@/lib/supabaseApi';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function PessoaDetalhePage() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Carregar dados da pessoa
  useEffect(() => {
    if (!id) return;
    
    const carregarPessoa = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const data = await supabaseApi.pessoas.obterPorId(id, token || undefined);
        setPessoa(data);
      } catch (err: any) {
        console.error('Erro ao carregar pessoa:', err);
        setError(err.message || 'Erro ao carregar pessoa');
      } finally {
        setLoading(false);
      }
    };
    
    carregarPessoa();
  }, [id]);

  // Função para excluir pessoa
  const excluirPessoa = async () => {
    if (!pessoa?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      await supabaseApi.pessoas.excluir(pessoa.id, token || undefined);
      setConfirmDeleteOpen(false);
      router.push('/pessoas');
    } catch (err: any) {
      console.error('Erro ao excluir pessoa:', err);
      setError(err.message || 'Erro ao excluir pessoa');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para aprovar cadastro
  const aprovarCadastro = async () => {
    if (!pessoa?.id || !user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const pessoaAtualizada = await supabaseApi.pessoas.aprovarOuRejeitar(
        pessoa.id, 
        'Aprovado', 
        user.id,
        token || undefined
      );
      setPessoa(pessoaAtualizada);
      setConfirmApproveOpen(false);
    } catch (err: any) {
      console.error('Erro ao aprovar cadastro:', err);
      setError(err.message || 'Erro ao aprovar cadastro');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para rejeitar cadastro
  const rejeitarCadastro = async () => {
    if (!pessoa?.id || !user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const pessoaAtualizada = await supabaseApi.pessoas.aprovarOuRejeitar(
        pessoa.id, 
        'Rejeitado', 
        user.id,
        token || undefined
      );
      setPessoa(pessoaAtualizada);
      setConfirmRejectOpen(false);
    } catch (err: any) {
      console.error('Erro ao rejeitar cadastro:', err);
      setError(err.message || 'Erro ao rejeitar cadastro');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar data
  const formatarData = (dataString?: string) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

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
            <h1 className="text-2xl font-bold">Detalhes da Pessoa</h1>
            <Button variant="outline" onClick={() => router.push('/pessoas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <p>Carregando...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !pessoa ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>Pessoa não encontrada.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Esquerda: Foto e Ações */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    {pessoa.foto_perfil_url ? (
                      <img 
                        src={pessoa.foto_perfil_url} 
                        alt={`Foto de ${pessoa.nome_completo}`} 
                        className="w-48 h-48 object-cover rounded-full border"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Users className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Ações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => router.push(`/pessoas/${pessoa.id}/editar`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Ações de Admin: Aprovar/Rejeitar */}
                {isAdmin() && pessoa.status_aprovacao === 'Pendente' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Aprovação de Cadastro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        onClick={() => setConfirmApproveOpen(true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={() => setConfirmRejectOpen(true)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Coluna Direita: Detalhes */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{pessoa.nome_completo}</CardTitle>
                    <CardDescription>{pessoa.cargo_funcao || 'Cargo não informado'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <p>{pessoa.email}</p>
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <p>{pessoa.telefone || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Documento (CPF/CNPJ)</Label>
                        <p>{pessoa.documento || 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Data de Nascimento</Label>
                        <p>{formatarData(pessoa.data_nascimento)}</p>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <p>
                          <Badge variant={pessoa.status === 'Ativo' ? 'default' : 'secondary'}>
                            {pessoa.status || 'N/A'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label>Status Aprovação</Label>
                        <p>
                          <Badge 
                            variant={
                              pessoa.status_aprovacao === 'Aprovado' 
                                ? 'default' 
                                : pessoa.status_aprovacao === 'Pendente' 
                                  ? 'outline' 
                                  : 'destructive'
                            }
                          >
                            {pessoa.status_aprovacao || 'N/A'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label>Data de Cadastro</Label>
                        <p>{formatarData(pessoa.created_at)}</p>
                      </div>
                      <div>
                        <Label>Última Atualização</Label>
                        <p>{formatarData(pessoa.updated_at)}</p>
                      </div>
                      {pessoa.data_aprovacao && (
                        <div>
                          <Label>Data Aprovação/Rejeição</Label>
                          <p>{formatarData(pessoa.data_aprovacao)}</p>
                        </div>
                      )}
                      {/* TODO: Exibir nome do cadastrante e aprovador (requer JOIN ou busca adicional) */}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Label>Endereço</Label>
                      <p>{pessoa.endereco_completo || 'N/A'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude</Label>
                        <p>{pessoa.latitude !== undefined ? pessoa.latitude : 'N/A'}</p>
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <p>{pessoa.longitude !== undefined ? pessoa.longitude : 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Dialogs de confirmação */}
          <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir {pessoa?.nome_completo}? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={excluirPessoa} disabled={loading}>
                  {loading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar aprovação</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja aprovar o cadastro de {pessoa?.nome_completo}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={aprovarCadastro} disabled={loading}>
                  {loading ? 'Aprovando...' : 'Aprovar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={confirmRejectOpen} onOpenChange={setConfirmRejectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar rejeição</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja rejeitar o cadastro de {pessoa?.nome_completo}?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmRejectOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={rejeitarCadastro} disabled={loading}>
                  {loading ? 'Rejeitando...' : 'Rejeitar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RequireAuth>
  );
}

