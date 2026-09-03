// Renderiza um contêiner visual padronizado para conteúdos relacionados.
export default function Card({ className = '', children }) {
  // Permite personalizar as classes sem perder o estilo base do cartão.
  return (
    <div className={`bg-white border border-wood-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  )
}
