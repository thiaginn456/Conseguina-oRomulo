// Importa links de navegação e o local onde a página filha será exibida.
import { NavLink, Outlet } from 'react-router-dom'

// Monta as classes do menu conforme o link esteja ativo ou não.
const navItem = ({ isActive }) =>
  `px-4 py-2 rounded-full font-display font-600 text-sm transition-colors ${
    isActive
      ? 'bg-candy-500 text-white'
      : 'text-wood-700 hover:bg-wood-100'
  }`

// Define a moldura comum usada por todas as páginas.
export default function Layout() {
  // Renderiza cabeçalho, conteúdo da rota atual e rodapé.
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-wood-200 bg-white/90 backdrop-blur sticky top-0 z-10 no-print">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            <span className="bg-wood-800 text-white rounded-md px-2 py-1 text-xs sm:text-base font-bold shrink-0 leading-tight text-center" aria-hidden="true">RÔMULO CONSEGUINAÇÕES</span>
          </div>
          <nav aria-label="Navegação principal" className="flex items-center gap-2 w-full sm:w-auto">
            <NavLink to="/" end className={(props) => `${navItem(props)} flex-1 sm:flex-none text-center min-h-10`}>Clientes</NavLink>
            <NavLink to="/produtos" className={(props) => `${navItem(props)} flex-1 sm:flex-none text-center min-h-10`}>Estoque</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="no-print text-center text-xs text-wood-400 py-6">
        Feito para controlar consignação de brinquedos • dados salvos no Supabase
      </footer>
    </div>
  )
}
