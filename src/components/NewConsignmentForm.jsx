// Importa o estado usado para selecionar produtos e quantidades.
import { useState } from 'react'
// Importa a conexão com o banco.
import { supabase } from '../lib/supabaseClient.js'
// Importa o formatador monetário.
import { formatMoney } from '../lib/format.js'
import Button from './Button.jsx'

// Cria uma nova consignação para um cliente.
export default function NewConsignmentForm({ clientId, products, onCreated, onCancel }) {
  // Cria uma linha de seleção para cada produto disponível.
  const [rows, setRows] = useState(
    products.map((p) => ({ product: p, checked: false, quantity: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Marca ou desmarca um produto da consignação.
  function toggleRow(index, checked) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, checked } : row)))
  }

  // Atualiza a quantidade enviada de um produto.
  function setQuantity(index, quantity) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, quantity } : row)))
  }

  // Mantém somente produtos selecionados com quantidade válida.
  const selected = rows.filter((r) => r.checked && Number(r.quantity) > 0)

  // Valida a seleção, salva a consignação e baixa o estoque.
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (selected.length === 0) {
      setError('Escolha ao menos um brinquedo e a quantidade enviada.')
      return
    }
    for (const row of selected) {
      if (Number(row.quantity) > row.product.stock_quantity) {
        setError(`Estoque insuficiente de "${row.product.name}" (disponível: ${row.product.stock_quantity}).`)
        return
      }
    }

    setSaving(true)

    const { data: consignment, error: consignError } = await supabase
      .from('consignments')
      .insert({ client_id: clientId, status: 'ativo' })
      .select()
      .single()

    if (consignError) {
      setSaving(false)
      setError(consignError.message)
      return
    }

    const items = selected.map((row) => ({
      consignment_id: consignment.id,
      product_id: row.product.id,
      product_name_snapshot: row.product.name,
      base_price_snapshot: row.product.base_price,
      quantity_consigned: Number(row.quantity),
      quantity_sold: 0,
    }))

    const { error: itemsError } = await supabase.from('consignment_items').insert(items)
    if (itemsError) {
      setSaving(false)
      setError(itemsError.message)
      return
    }

    // Baixa o estoque próprio pelo que foi enviado ao cliente
    for (const row of selected) {
      await supabase
        .from('products')
        .update({ stock_quantity: row.product.stock_quantity - Number(row.quantity) })
        .eq('id', row.product.id)
    }

    setSaving(false)
    onCreated()
  }

  // Renderiza a lista de produtos e os controles do formulário.
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {products.length === 0 ? (
        <p className="text-wood-500 text-sm">Nenhum brinquedo em estoque. Cadastre produtos na aba Estoque primeiro.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <label
              key={row.product.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
                row.checked ? 'border-sky-500 bg-sky-500/5' : 'border-wood-200'
              } ${row.product.stock_quantity === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={row.checked}
                disabled={row.product.stock_quantity === 0}
                onChange={(e) => toggleRow(i, e.target.checked)}
              />
              <div className="flex-1">
                <p className="font-600 text-wood-900 text-sm">{row.product.name}</p>
                <p className="text-xs text-wood-500">{formatMoney(row.product.base_price)} un. • {row.product.stock_quantity} disponíveis</p>
              </div>
              {row.checked && (
                <input
                  type="text"
                  inputMode="numeric"
                  min="1"
                  max={row.product.stock_quantity}
                  placeholder="Qtd."
                  className="w-20 rounded-lg border border-wood-200 px-2 py-1 text-sm"
                  value={row.quantity}
                  onChange={(e) => setQuantity(i, e.target.value.replace(/\D/g, ''))}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving || products.length === 0}>
          {saving ? 'Enviando...' : 'Enviar consignação'}
        </Button>
      </div>
    </form>
  )
}
