// Importa o React para habilitar o modo estrito.
import React from 'react'
// Importa o método que cria a raiz da aplicação.
import ReactDOM from 'react-dom/client'
// Permite que as páginas naveguem usando URLs.
import { BrowserRouter } from 'react-router-dom'
// Importa o componente raiz.
import App from './App.jsx'
// Carrega os estilos globais.
import './index.css'

// Inicia o React no elemento root definido no HTML.
ReactDOM.createRoot(document.getElementById('root')).render(
  // O modo estrito ajuda a encontrar problemas durante o desenvolvimento.
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
