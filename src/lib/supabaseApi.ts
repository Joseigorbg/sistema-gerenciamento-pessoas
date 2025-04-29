/**
 * API para interagir com o Supabase usando fetch diretamente
 * Esta abordagem alternativa é usada devido a problemas com a instalação da biblioteca oficial
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL ou Anon Key não encontrados nas variáveis de ambiente.');
}

// Headers padrão para requisições autenticadas
const getAuthHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  
  return headers;
};

// Headers para operações administrativas (usando service role key)
const getServiceHeaders = () => {
  return {
    'apikey': SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
};

// Interface para Pessoa
export interface Pessoa {
  id?: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  documento?: string;
  cargo_funcao?: string;
  data_nascimento?: string;
  status?: 'Ativo' | 'Inativo';
  foto_perfil_url?: string;
  endereco_completo?: string;
  latitude?: number;
  longitude?: number;
  status_aprovacao?: 'Pendente' | 'Aprovado' | 'Rejeitado';
  cadastrante_id?: string;
  aprovador_id?: string;
  data_aprovacao?: string;
  created_at?: string;
  updated_at?: string;
}

// API para gerenciamento de pessoas
export const pessoasApi = {
  // Listar todas as pessoas (com filtros opcionais)
  listar: async (
    filtros?: { 
      nome?: string; 
      status?: string; 
      cargo?: string;
      status_aprovacao?: string;
    },
    token?: string
  ): Promise<Pessoa[]> => {
    let query = 'select=*';
    
    if (filtros) {
      if (filtros.nome) {
        query += `&nome_completo=ilike.${encodeURIComponent(`%${filtros.nome}%`)}`;
      }
      if (filtros.status) {
        query += `&status=eq.${encodeURIComponent(filtros.status)}`;
      }
      if (filtros.cargo) {
        query += `&cargo_funcao=ilike.${encodeURIComponent(`%${filtros.cargo}%`)}`;
      }
      if (filtros.status_aprovacao) {
        query += `&status_aprovacao=eq.${encodeURIComponent(filtros.status_aprovacao)}`;
      }
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?${query}`, {
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao listar pessoas: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Obter uma pessoa pelo ID
  obterPorId: async (id: string, token?: string): Promise<Pessoa> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}&select=*`, {
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao obter pessoa: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data[0];
  },
  
  // Criar uma nova pessoa
  criar: async (pessoa: Pessoa, token?: string): Promise<Pessoa> => {
    // Adiciona o ID do usuário atual como cadastrante_id se não for fornecido
    if (!pessoa.cadastrante_id && token) {
      // Em uma implementação real, extrairíamos o user_id do token JWT
      // Por enquanto, isso seria feito no frontend
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(pessoa),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar pessoa: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Atualizar uma pessoa existente
  atualizar: async (id: string, pessoa: Partial<Pessoa>, token?: string): Promise<Pessoa> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(pessoa),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar pessoa: ${response.statusText}`);
    }
    
    // Supabase PATCH não retorna o objeto atualizado, então precisamos buscá-lo
    return pessoasApi.obterPorId(id, token);
  },
  
  // Excluir uma pessoa
  excluir: async (id: string, token?: string): Promise<void> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir pessoa: ${response.statusText}`);
    }
  },
  
  // Aprovar ou rejeitar um cadastro (apenas para administradores)
  aprovarOuRejeitar: async (
    id: string, 
    status: 'Aprovado' | 'Rejeitado', 
    aprovadorId: string,
    token?: string
  ): Promise<Pessoa> => {
    const atualizacao = {
      status_aprovacao: status,
      aprovador_id: aprovadorId,
      data_aprovacao: new Date().toISOString(),
    };
    
    // Usa o service role key para garantir que a operação seja permitida
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'PATCH',
      headers: getServiceHeaders(),
      body: JSON.stringify(atualizacao),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao ${status === 'Aprovado' ? 'aprovar' : 'rejeitar'} cadastro: ${response.statusText}`);
    }
    
    return pessoasApi.obterPorId(id, token);
  },
  
  // Obter estatísticas para o dashboard
  obterEstatisticas: async (token?: string): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    pendentes: number;
    aprovados: number;
    rejeitados: number;
  }> => {
    // Esta é uma implementação simplificada que faz múltiplas chamadas
    // Em uma implementação real, poderíamos usar uma função RPC no Supabase
    
    const [todas, ativas, inativas, pendentes, aprovadas, rejeitadas] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?status=eq.Ativo&select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?status=eq.Inativo&select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?status_aprovacao=eq.Pendente&select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?status_aprovacao=eq.Aprovado&select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
      fetch(`${SUPABASE_URL}/rest/v1/pessoas?status_aprovacao=eq.Rejeitado&select=count`, {
        method: 'HEAD',
        headers: getAuthHeaders(token),
      }),
    ]);
    
    return {
      total: parseInt(todas.headers.get('content-range')?.split('/')[1] || '0'),
      ativos: parseInt(ativas.headers.get('content-range')?.split('/')[1] || '0'),
      inativos: parseInt(inativas.headers.get('content-range')?.split('/')[1] || '0'),
      pendentes: parseInt(pendentes.headers.get('content-range')?.split('/')[1] || '0'),
      aprovados: parseInt(aprovadas.headers.get('content-range')?.split('/')[1] || '0'),
      rejeitados: parseInt(rejeitadas.headers.get('content-range')?.split('/')[1] || '0'),
    };
  },
  
  // Obter dados para o mapa (locais com cadastros aprovados)
  obterDadosMapa: async (token?: string): Promise<{
    latitude: number;
    longitude: number;
    quantidade: number;
  }[]> => {
    // Em uma implementação real, usaríamos uma função SQL no Supabase para agrupar por localização
    // Aqui, vamos apenas buscar todos os cadastros aprovados com localização
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pessoas?status_aprovacao=eq.Aprovado&select=latitude,longitude&not.latitude=is.null&not.longitude=is.null`,
      {
        headers: getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao obter dados para mapa: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Agrupar por coordenadas (simplificado)
    const locais: Record<string, { latitude: number; longitude: number; quantidade: number }> = {};
    
    data.forEach((item: { latitude: number; longitude: number }) => {
      // Arredonda para 2 casas decimais para agrupar locais próximos
      const lat = Math.round(item.latitude * 100) / 100;
      const lng = Math.round(item.longitude * 100) / 100;
      const key = `${lat},${lng}`;
      
      if (!locais[key]) {
        locais[key] = { latitude: lat, longitude: lng, quantidade: 0 };
      }
      
      locais[key].quantidade += 1;
    });
    
    return Object.values(locais);
  },
  
  // Obter aniversariantes do mês atual
  obterAniversariantesMes: async (token?: string): Promise<Pessoa[]> => {
    const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0-11
    
    // Filtra por mês de aniversário (usando função EXTRACT do PostgreSQL via API)
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/obter_aniversariantes_mes`,
      {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ mes: mesAtual }),
      }
    );
    
    if (!response.ok) {
      // Fallback caso a função RPC não exista
      console.error('Função RPC não disponível, implementando fallback');
      // Implementação alternativa seria buscar todas as pessoas e filtrar no cliente
      // Mas isso seria ineficiente para grandes volumes de dados
      return [];
    }
    
    return response.json();
  },
};

// API para autenticação
export const authApi = {
  // Login com email e senha
  login: async (email: string, senha: string): Promise<{
    user: { id: string; email: string; role: string };
    session: { access_token: string; refresh_token: string };
  }> => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: senha }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao fazer login: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role || 'authenticated',
      },
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      },
    };
  },
  
  // Cadastro de novo usuário
  cadastrar: async (email: string, senha: string): Promise<{
    user: { id: string; email: string };
    session: null;
  }> => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: senha }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao cadastrar usuário: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: null, // Normalmente, o usuário precisa confirmar o email antes de obter uma sessão
    };
  },
  
  // Logout
  logout: async (token: string): Promise<void> => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao fazer logout: ${response.statusText}`);
    }
  },
  
  // Verificar se o usuário está autenticado
  verificarSessao: async (token: string): Promise<{
    user: { id: string; email: string; role: string } | null;
  }> => {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      return { user: null };
    }
    
    const data = await response.json();
    
    return {
      user: {
        id: data.id,
        email: data.email,
        role: data.role || 'authenticated',
      },
    };
  },
};

// API para upload de arquivos (fotos de perfil)
export const storageApi = {
  // Upload de foto de perfil
  uploadFotoPerfil: async (
    userId: string,
    file: File,
    token: string
  ): Promise<{ url: string }> => {
    // Cria um nome de arquivo único baseado no ID do usuário
    const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `fotos_perfil/${fileName}`;
    
    // Faz o upload do arquivo para o bucket 'fotos_perfil'
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos_perfil/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
      },
      body: file,
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao fazer upload da foto: ${response.statusText}`);
    }
    
    // Retorna a URL pública do arquivo
    return {
      url: `${SUPABASE_URL}/storage/v1/object/public/fotos_perfil/${filePath}`,
    };
  },
  
  // Excluir foto de perfil
  excluirFotoPerfil: async (url: string, token: string): Promise<void> => {
    // Extrai o caminho do arquivo da URL
    const filePath = url.split('/public/')[1];
    
    if (!filePath) {
      throw new Error('URL de arquivo inválida');
    }
    
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${filePath}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao excluir foto: ${response.statusText}`);
    }
  },
};

// Exporta todas as APIs
export const supabaseApi = {
  pessoas: pessoasApi,
  auth: authApi,
  storage: storageApi,
};

export default supabaseApi;
