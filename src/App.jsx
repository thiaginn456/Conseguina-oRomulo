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

// Define todas as rotas principais da aplicação.
export default function App() {
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
