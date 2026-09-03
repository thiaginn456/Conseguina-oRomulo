// Formata um valor numérico como moeda brasileira.
export function formatMoney(value) {
  // Converte valores vazios para zero antes de formatar.
  const n = Number(value ?? 0)
  // Retorna a representação monetária em reais.
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Formata uma data no padrão brasileiro curto.
export function formatDate(value) {
  // Mostra um traço quando não existe data.
  if (!value) return '—'
  // Converte o texto ou timestamp recebido para um objeto Date.
  const d = new Date(value)
  // Retorna dia, mês e ano com dois dígitos.
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Formata uma data com horário no padrão brasileiro.
export function formatDateTime(value) {
  // Mostra um traço quando não existe data.
  if (!value) return '—'
  // Converte o valor recebido para um objeto Date.
  const d = new Date(value)
  // Retorna data e hora formatadas.
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
