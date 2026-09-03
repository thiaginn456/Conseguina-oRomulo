// Importa a função que cria a conexão com o Supabase.
import { createClient } from '@supabase/supabase-js'

// Lê a URL do projeto a partir das variáveis de ambiente do Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Lê a chave pública usada pelo navegador.
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Avisa durante o desenvolvimento quando a configuração está incompleta.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variáveis de ambiente não encontradas. ' +
    'Crie um arquivo .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. ' +
    'Veja o README.md para o passo a passo.'
  )
}

// Exporta uma única conexão para ser usada em toda a aplicação.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
