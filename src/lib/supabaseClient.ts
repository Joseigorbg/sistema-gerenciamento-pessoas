import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

// Apesar dos problemas de instalação, vamos tentar criar o cliente.
// Se a instalação falhou, isso pode gerar um erro em tempo de execução.
// Caso contrário, podemos usar o cliente normalmente.
// Se falhar, precisaremos implementar chamadas fetch manuais para a API REST.

try {
  // Tenta criar o cliente usando a biblioteca (caso tenha sido instalada de alguma forma)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client created successfully using library.');
  // Exporta o cliente criado pela biblioteca
  // module.exports = { supabase }; // Comentado por enquanto
} catch (error) {
  console.error('Failed to create Supabase client using library:', error);
  console.log('Falling back to manual REST API calls (implementation needed).');

  // Implementação alternativa usando fetch (exemplo básico)
  const manualSupabaseClient = {
    from: (tableName) => ({
      select: async (columns = '*') => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=${columns}`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}` // Para RLS
          }
        });
        if (!response.ok) {
          throw new Error(`Supabase API error: ${response.statusText}`);
        }
        return response.json();
      },
      // Adicionar insert, update, delete, etc. aqui usando fetch
      insert: async (data) => { /* ... implementação fetch ... */ },
      update: async (data, filter) => { /* ... implementação fetch ... */ },
      delete: async (filter) => { /* ... implementação fetch ... */ },
    }),
    // Adicionar auth aqui usando fetch para os endpoints de auth
    auth: {
      signInWithPassword: async ({ email, password }) => { /* ... */ },
      signUp: async ({ email, password }) => { /* ... */ },
      // ... outros métodos de auth
    }
  };

  // Exporta o cliente manual
  // module.exports = { supabase: manualSupabaseClient }; // Comentado por enquanto
}

// Por enquanto, vamos apenas logar e não exportar nada funcional
// até resolvermos o problema da biblioteca ou implementarmos o fetch manual.

export {}; // Exporta um objeto vazio para evitar erros de módulo

