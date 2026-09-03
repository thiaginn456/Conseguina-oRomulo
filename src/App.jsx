// Importa os componentes de roteamento do React Router.
import { Routes, Route } from 'react-router-dom'
// Importa a estrutura compartilhada das páginas.
import Layout from './components/Layout.jsx'
// Importa a página inicial de clientes.
import ClientsPage from './pages/ClientsPage.jsx'
// Importa a página de detalhes de um cliente.
import ClientDetailPage from './pages/ClientDetailPage.jsx'
// Importa a página de estoque.
import ProductsPage from './pages/ProductsPage.jsx'
import { isSupabaseConfigured } from './lib/supabaseClient.js'

// Define todas as rotas principais da aplicação.
export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 text-center">
        <div className="max-w-md">
          <h1 className="font-display font-700 text-2xl text-wood-900">Configuração pendente</h1>
          <p className="mt-2 text-wood-500">
            Cadastre VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente da Vercel e faça um novo deploy.
          </p>
        </div>
      </main>
    )
  }

  // Monta as rotas dentro do layout comum.
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ClientsPage />} />
        <Route path="/clientes/:clientId" element={<ClientDetailPage />} />
        <Route path="/produtos" element={<ProductsPage />} />
      </Route>
    </Routes>
  )
}
