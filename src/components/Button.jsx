// Define as combinações de cores disponíveis para o botão.
const variants = {
  primary: 'bg-candy-500 hover:bg-candy-600 text-white',
  secondary: 'bg-wood-100 hover:bg-wood-200 text-wood-800',
  success: 'bg-leaf-500 hover:bg-leaf-600 text-white',
  ghost: 'bg-transparent hover:bg-wood-100 text-wood-700',
  danger: 'bg-transparent hover:bg-red-50 text-red-600',
}

// Renderiza um botão reutilizável com estilo e propriedades configuráveis.
export default function Button({ variant = 'primary', className = '', children, ...props }) {
  // Junta o estilo padrão, a variação escolhida e classes adicionais.
  return (
    <button
      className={`font-display font-600 text-sm rounded-md px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
