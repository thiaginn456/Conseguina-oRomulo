// Importa o estado usado para editar produtos e quantidades.
import { useState } from 'react'
// Importa a conexão com o banco.
import { supabase } from '../lib/supabaseClient.js'
// Importa o formatador monetário.
import { formatMoney } from '../lib/format.js'
import Button from './Button.jsx'

// Edita os itens de uma consignação ainda ativa, ajustando o estoque pela diferença.
export default function EditConsignmentForm({ consignment, items, products, onSaved, onCancel }) {
  // Uma linha por produto: já marcada e preenchida se o produto está na consignação.
  const [rows, setRows] = useState(
    products.map((p) => {
      const item = items.find((i) => i.product_id === p.id)
      return {
        product: p,
        item,
        checked: Boolean(item),
        quantity: item ? String(item.quantity_consigned) : '',
      }
    })
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

  // Valida as mudanças e aplica itens e estoque.
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const kept = rows.filter((r) => r.checked && Number(r.quantity) > 0)
    const untouchedItems = items.filter((i) => !products.some((p) => p.id === i.product_id))
    if (kept.length === 0 && untouchedItems.length === 0) {
      setError('A consignação precisa ter ao menos um brinquedo. Para desistir dela, cancele a edição.')
      return
    }
    for (const row of kept) {
      const diff = Number(row.quantity) - (row.item?.quantity_consigned || 0)
      if (diff > row.product.stock_quantity) {
        setError(`Estoque insuficiente de "${row.product.name}" (disponível para acrescentar: ${row.product.stock_quantity}).`)
        return
      }
    }

    setSaving(true)

    for (const row of rows) {
      const wanted = row.checked ? Number(row.quantity) || 0 : 0
      const old = row.item?.quantity_consigned || 0
      if (wanted === old) continue

      let opError = null
      if (row.item && wanted === 0) {
        ;({ error: opError } = await supabase.from('consignment_items').delete().eq('id', row.item.id))
      } else if (row.item) {
        ;({ error: opError } = await supabase
          .from('consignment_items')
          .update({ quantity_consigned: wanted })
          .eq('id', row.item.id))
      } else {
        ;({ error: opError } = await supabase.from('consignment_items').insert({
          consignment_id: consignment.id,
          product_id: row.product.id,
          product_name_snapshot: row.product.name,
          base_price_snapshot: row.product.base_price,
          quantity_consigned: wanted,
          quantity_sold: 0,
        }))
      }
      if (opError) {
        setSaving(false)
        setError(opError.message)
        return
      }

      // Ajusta o estoque pela diferença enviada ao cliente.
      await supabase
        .from('products')
        .update({ stock_quantity: row.product.stock_quantity - (wanted - old) })
        .eq('id', row.product.id)
    }

    setSaving(false)
    onSaved()
  }

  // Renderiza a lista de produtos e os controles do formulário.
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="space-y-2">
        {rows.map((row, i) => {
          const current = row.item?.quantity_consigned || 0
          const blocked = row.product.stock_quantity === 0 && !row.item
          return (
            <label
              key={row.product.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
                row.checked ? 'border-sky-500 bg-sky-500/5' : 'border-wood-200'
              } ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={row.checked}
                disabled={blocked}
                onChange={(e) => toggleRow(i, e.target.checked)}
              />
              <div className="flex-1">
                <p className="font-600 text-wood-900 text-sm">{row.product.name}</p>
                <p className="text-xs text-wood-500">
                  {formatMoney(row.product.base_price)} un. • {row.product.stock_quantity} em estoque
                  {current > 0 && ` • ${current} com o cliente`}
                </p>
              </div>
              {row.checked && (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Qtd."
                  className="w-20 rounded-lg border border-wood-200 px-2 py-1 text-sm"
                  value={row.quantity}
                  onChange={(e) => setQuantity(i, e.target.value.replace(/\D/g, ''))}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
      </div>
    </form>
  )
}
