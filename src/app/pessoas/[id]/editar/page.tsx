
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, RequireAuth } from '@/lib/authContext';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Users, 
  LogOut,
  Plus,
  List,
  Map,
  UserCheck,
  Save,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabaseApi, Pessoa } from '@/lib/supabaseApi';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditarPessoaPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para os campos do formulário
  const [formData, setFormData] = useState<Partial<Pessoa>>({});
  
  // Estado para o arquivo de foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUrlAtual, setFotoUrlAtual] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Carregar dados da pessoa para edição
  useEffect(() => {
    if (!id) return;
    
    const carregarPessoa = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const data = await supabaseApi.pessoas.obterPorId(id, token || undefined);
        
        // Formata a data para o input type="date"
        if (data.data_nascimento) {
          data.data_nascimento = data.data_nascimento.split('T')[0];
        }
        
        setFormData(data);
        setFotoUrlAtual(data.foto_perfil_url || null);
        setFotoPreview(data.foto_perfil_url || null);
      } catch (err: any) {
        console.error('Erro ao carregar pessoa para edição:', err);
        setError(err.message || 'Erro ao carregar pessoa');
      } finally {
        setLoading(false);
      }
    };
    
    carregarPessoa();
  }, [id]);
  
  // Função para atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Função para atualizar selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Função para lidar com upload de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Função para remover foto
  const removerFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setFormData(prev => ({ ...prev, foto_perfil_url: undefined }));
  };
  
  // Função para obter coordenadas do endereço (geocoding)
  const obterCoordenadas = async () => {
    if (!formData.endereco_completo) {
      setError('Informe um endereço para obter as coordenadas');
      return;
    }
    
    try {
      setLoading(true);
      // Simulação de geocoding
      const lat = -23.5505 + (Math.random() - 0.5) * 2;
      const lng = -46.6333 + (Math.random() - 0.5) * 2;
      
      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
      }));
      
      setSuccess('Coordenadas obtidas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao obter coordenadas. Verifique o endereço.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para salvar as alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_completo || !formData.email) {
      setError('Nome e email são campos obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      let fotoUrlParaSalvar = formData.foto_perfil_url;

      // 1. Lidar com a foto
      if (fotoFile) {
        // Se tem novo arquivo, faz upload
        const uploadResult = await supabaseApi.storage.uploadFotoPerfil(
          id,
          fotoFile,
          token || ''
        );
        fotoUrlParaSalvar = uploadResult.url;
        
        // Se tinha foto antiga e a URL mudou, deleta a antiga
        if (fotoUrlAtual && fotoUrlAtual !== fotoUrlParaSalvar) {
          try {
            await supabaseApi.storage.excluirFotoPerfil(fotoUrlAtual, token || '');
          } catch (deleteError) {
            console.warn('Falha ao deletar foto antiga:', deleteError);
          }
        }
      } else if (fotoUrlAtual && !fotoPreview) {
        // Se não tem novo arquivo e não tem preview (foi removida), deleta a antiga
        try {
          await supabaseApi.storage.excluirFotoPerfil(fotoUrlAtual, token || '');
        } catch (deleteError) {
          console.warn('Falha ao deletar foto antiga:', deleteError);
        }
        fotoUrlParaSalvar = undefined; // Define como undefined no banco
      }

      // 2. Prepara os dados para atualização (excluindo ID e campos de controle)
      const dadosParaAtualizar: Partial<Pessoa> = {
        ...formData,
        foto_perfil_url: fotoUrlParaSalvar,
      };
      delete dadosParaAtualizar.id;
      delete dadosParaAtualizar.created_at;
      delete dadosParaAtualizar.updated_at;
      delete dadosParaAtualizar.cadastrante_id;
      delete dadosParaAtualizar.aprovador_id;
      delete dadosParaAtualizar.data_aprovacao;
      // Não permite alterar status de aprovação aqui
      delete dadosParaAtualizar.status_aprovacao;

      // 3. Atualiza o registro da pessoa
      await supabaseApi.pessoas.atualizar(id, dadosParaAtualizar, token || undefined);
      
      setSuccess('Pessoa atualizada com sucesso!');
      
      // Redireciona para a página de detalhes após 2 segundos
      setTimeout(() => {
        router.push(`/pessoas/${id}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Erro ao atualizar pessoa:', err);
      setError(err.message || 'Erro ao atualizar pessoa');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.id) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }

  if (error && !formData.id) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

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
            <h1 className="text-2xl font-bold">Editar Pessoa</h1>
            <Button variant="outline" onClick={() => router.push(`/pessoas/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Detalhes
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-500 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      name="nome_completo"
                      value={formData.nome_completo || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
                    <Input
                      id="documento"
                      name="documento"
                      value={formData.documento || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      name="data_nascimento"
                      type="date"
                      value={formData.data_nascimento || ''}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Informações Profissionais e Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Profissionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_funcao">Cargo/Função</Label>
                    <Input
                      id="cargo_funcao"
                      name="cargo_funcao"
                      value={formData.cargo_funcao || ''}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status || 'Ativo'} 
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="foto">Foto de Perfil</Label>
                    <Input
                      id="foto"
                      name="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                    />
                    {fotoPreview && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img 
                          src={fotoPreview} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-full border"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={removerFoto}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Localização */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Localização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco_completo">Endereço Completo</Label>
                    <Textarea
                      id="endereco_completo"
                      name="endereco_completo"
                      value={formData.endereco_completo || ''}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={obterCoordenadas}
                      disabled={loading || !formData.endereco_completo}
                    >
                      Obter Coordenadas
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        name="latitude"
                        type="number"
                        step="0.000001"
                        value={formData.latitude !== undefined ? formData.latitude : ''}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        name="longitude"
                        type="number"
                        step="0.000001"
                        value={formData.longitude !== undefined ? formData.longitude : ''}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push(`/pessoas/${id}`)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                    {!loading && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </RequireAuth>
  );
}

