// Importa a função que cria a conexão com o Supabase.
import { createClient } from '@supabase/supabase-js'

// Lê a URL do projeto a partir das variáveis de ambiente do Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Lê a chave pública usada pelo navegador.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Permite que a interface mostre uma orientação útil antes de tentar acessar o banco.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Exporta uma única conexão para ser usada em toda a aplicação.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
