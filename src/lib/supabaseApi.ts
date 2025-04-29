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
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY não definida. Usando ANON_KEY para operações de serviço.');
  }
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
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao listar pessoas: ${errorData.message || response.statusText}`);
    }
    
    return response.json();
  },
  
  // Obter uma pessoa pelo ID
  obterPorId: async (id: string, token?: string): Promise<Pessoa | null> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}&select=*`, {
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      if (response.status === 404) return null; // Não encontrado
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao obter pessoa: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data[0] || null;
  },
  
  // Criar uma nova pessoa
  criar: async (pessoa: Pessoa, token?: string): Promise<Pessoa> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), Prefer: 'return=representation' }, // Adiciona Prefer para retornar o objeto criado
      body: JSON.stringify(pessoa),
    });
    
    if (!response.ok || response.status !== 201) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao criar pessoa: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data[0]; // Retorna o primeiro (e único) objeto do array
  },
  
  // Atualizar uma pessoa existente
  atualizar: async (id: string, pessoa: Partial<Pessoa>, token?: string): Promise<Pessoa> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(token), Prefer: 'return=representation' }, // Adiciona Prefer para retornar o objeto atualizado
      body: JSON.stringify(pessoa),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao atualizar pessoa: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data[0];
  },
  
  // Excluir uma pessoa
  excluir: async (id: string, token?: string): Promise<void> => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok && response.status !== 204) { // 204 No Content é sucesso para DELETE
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao excluir pessoa: ${errorData.message || response.statusText}`);
    }
  },
  
  // Aprovar ou rejeitar um cadastro (apenas para administradores)
  aprovarOuRejeitar: async (
    id: string, 
    status: 'Aprovado' | 'Rejeitado', 
    aprovadorId: string,
    token?: string // Token do admin logado (para buscar o objeto atualizado)
  ): Promise<Pessoa> => {
    const atualizacao = {
      status_aprovacao: status,
      aprovador_id: aprovadorId,
      data_aprovacao: new Date().toISOString(),
    };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...getServiceHeaders(), Prefer: 'return=representation' }, // Usa service key e retorna o objeto
      body: JSON.stringify(atualizacao),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao ${status === 'Aprovado' ? 'aprovar' : 'rejeitar'} cadastro: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data[0];
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
    const fetchCount = async (filter: string = '') => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/pessoas?${filter}&select=count`, {
        method: 'HEAD',
        headers: { ...getAuthHeaders(token), 'Range-Unit': 'items' }, // Range-Unit é necessário para HEAD com count
      });
      if (!response.ok) return 0;
      const range = response.headers.get('content-range');
      return parseInt(range?.split('/')[1] || '0');
    };

    const [total, ativos, inativos, pendentes, aprovados, rejeitados] = await Promise.all([
      fetchCount(),
      fetchCount('status=eq.Ativo'),
      fetchCount('status=eq.Inativo'),
      fetchCount('status_aprovacao=eq.Pendente'),
      fetchCount('status_aprovacao=eq.Aprovado'),
      fetchCount('status_aprovacao=eq.Rejeitado'),
    ]);
    
    return { total, ativos, inativos, pendentes, aprovados, rejeitados };
  },
  
  // Obter dados para o mapa (locais com cadastros aprovados)
  obterDadosMapa: async (token?: string): Promise<{
    latitude: number;
    longitude: number;
    quantidade: number;
  }[]> => {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/pessoas?status_aprovacao=eq.Aprovado&select=latitude,longitude&not.latitude=is.null&not.longitude=is.null`,
      {
        headers: getAuthHeaders(token),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao obter dados para mapa: ${errorData.message || response.statusText}`);
    }
    
    const data: { latitude: number; longitude: number }[] = await response.json();
    
    const locais: Record<string, { latitude: number; longitude: number; quantidade: number }> = {};
    
    data.forEach((item) => {
      if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return;
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
  
  // Obter aniversariantes do mês atual (usando RPC)
  obterAniversariantesMes: async (token?: string): Promise<Pessoa[]> => {
    const mesAtual = new Date().getMonth() + 1;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/obter_aniversariantes_mes`,
      {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ p_mes: mesAtual }), // Nome do parâmetro conforme definido na função RPC
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('Erro ao chamar RPC obter_aniversariantes_mes:', errorData.message || response.statusText);
      // Fallback: Retorna array vazio em caso de erro na RPC
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
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || `Erro ao fazer login: ${response.statusText}`);
    }
    
    if (!data.user || !data.access_token || !data.refresh_token) {
      throw new Error('Resposta inválida do servidor de autenticação.');
    }

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
    
    const data = await response.json();

    // Verifica se a resposta foi OK (status 2xx)
    if (!response.ok) {
      // Se não foi OK, lança um erro com a mensagem do Supabase ou o statusText
      throw new Error(data.msg || data.message || `Erro ao cadastrar usuário: ${response.statusText}`);
    }
    
    // Verifica se a resposta contém o objeto 'user' e suas propriedades esperadas
    if (!data || !data.user || !data.user.id || !data.user.email) {
      // Se a resposta for OK mas não contiver os dados esperados, lança um erro
      // Isso pode acontecer se a confirmação de email estiver habilitada e o Supabase não retornar o usuário imediatamente
      console.warn('Cadastro iniciado, mas dados do usuário não retornados imediatamente (pode exigir confirmação de email).');
      // Retorna um objeto indicando sucesso parcial ou necessidade de confirmação
      // Ou lança um erro, dependendo de como você quer lidar com isso no frontend
      // throw new Error('Resposta inesperada do servidor após cadastro.'); 
      // Por ora, vamos retornar um objeto com ID e email vazios para evitar o erro 'reading id'
      // O frontend já exibe a mensagem para verificar o email.
      return {
        user: { id: '', email: '' }, // Retorna objeto vazio para evitar erro
        session: null,
      };
    }
    
    // Se tudo deu certo e os dados estão presentes
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: null, // Cadastro não gera sessão automaticamente
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
    
    if (!response.ok && response.status !== 204) { // 204 No Content é sucesso
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao fazer logout: ${errorData.message || response.statusText}`);
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
      return { user: null }; // Token inválido ou expirado
    }
    
    const data = await response.json();

    if (!data || !data.id || !data.email) {
        return { user: null }; // Resposta inesperada
    }
    
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
    const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `fotos_perfil/${fileName}`;
    
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos_perfil/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
        'x-upsert': 'true' // Permite sobrescrever se o arquivo já existir (opcional)
      },
      body: file,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Erro ao fazer upload da foto: ${errorData.message || response.statusText}`);
    }
    
    // Retorna a URL pública do arquivo
    // Certifique-se de que o bucket 'fotos_perfil' está configurado como público no Supabase
    return {
      url: `${SUPABASE_URL}/storage/v1/object/public/fotos_perfil/${filePath}`,
    };
  },
  
  // Excluir foto de perfil
  excluirFotoPerfil: async (url: string, token: string): Promise<void> => {
    const filePath = url.split('/public/')[1];
    
    if (!filePath) {
      throw new Error('URL de arquivo inválida');
    }
    
    const response = await fetch(`${SUPABAS
(Content truncated due to size limit. Use line ranges to read in chunks)
