'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart, 
  Users, 
  LogOut,
  Plus,
  List,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Map,
  UserCheck
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabaseApi, Pessoa } from '@/lib/supabaseApi';

export default function PessoasPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroAprovacao, setFiltroAprovacao] = useState('');
  const [pessoaParaExcluir, setPessoaParaExcluir] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Carregar pessoas ao montar o componente
  useEffect(() => {
    const carregarPessoas = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const filtros = {
          nome: filtroNome || undefined,
          status: filtroStatus || undefined,
          cargo: filtroCargo || undefined,
          status_aprovacao: filtroAprovacao || undefined
        };
        
        const data = await supabaseApi.pessoas.listar(filtros, token || undefined);
        setPessoas(data);
      } catch (err: any) {
        console.error('Erro ao carregar pessoas:', err);
        setError(err.message || 'Erro ao carregar pessoas');
      } finally {
        setLoading(false);
      }
    };
    
    carregarPessoas();
  }, [filtroNome, filtroStatus, filtroCargo, filtroAprovacao]);

  // Função para excluir pessoa
  const excluirPessoa = async () => {
    if (!pessoaParaExcluir) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      await supabaseApi.pessoas.excluir(pessoaParaExcluir, token || undefined);
      
      // Atualiza a lista removendo a pessoa excluída
      setPessoas(pessoas.filter(p => p.id !== pessoaParaExcluir));
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Erro ao excluir pessoa:', err);
      setError(err.message || 'Erro ao excluir pessoa');
    } finally {
      setLoading(false);
      setPessoaParaExcluir(null);
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
            <h1 className="text-2xl font-bold">Pessoas Cadastradas</h1>
            <Button onClick={() => router.push('/pessoas/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </div>
          
          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por nome"
                      className="pl-8"
                      value={filtroNome}
                      onChange={(e) => setFiltroNome(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Cargo</label>
                  <Input
                    placeholder="Filtrar por cargo"
                    value={filtroCargo}
                    onChange={(e) => setFiltroCargo(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Aprovação</label>
                  <Select value={filtroAprovacao} onValueChange={setFiltroAprovacao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabela de pessoas */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <p>Carregando...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center p-8 text-red-500">
                  <p>{error}</p>
                </div>
              ) : pessoas.length === 0 ? (
                <div className="flex justify-center items-center p-8 text-gray-500">
                  <p>Nenhuma pessoa encontrada com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aprovação</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pessoas.map((pessoa) => (
                        <TableRow key={pessoa.id}>
                          <TableCell className="font-medium">{pessoa.nome_completo}</TableCell>
                          <TableCell>{pessoa.email}</TableCell>
                          <TableCell>{pessoa.cargo_funcao || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={pessoa.status === 'Ativo' ? 'default' : 'secondary'}>
                              {pessoa.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>{formatarData(pessoa.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => router.push(`/pessoas/${pessoa.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => router.push(`/pessoas/${pessoa.id}/editar`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setPessoaParaExcluir(pessoa.id || '');
                                  setDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Dialog de confirmação de exclusão */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir esta pessoa? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={excluirPessoa}>
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RequireAuth>
  );
}
