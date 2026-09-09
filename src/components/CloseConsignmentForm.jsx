// Importa os hooks usados para guardar o formulário e calcular os totais.
import { useMemo, useState } from 'react'
// Importa o cliente que conversa com o banco Supabase.
import { supabase } from '../lib/supabaseClient.js'
// Importa a função que formata valores como moeda brasileira.
import { formatMoney } from '../lib/format.js'
// Importa o botão padronizado da aplicação.
import Button from './Button.jsx'

// Exibe o formulário usado para registrar as vendas e finalizar uma consignação.
export default function CloseConsignmentForm({ consignment, items, onClosed, onCancel }) {
  // Cria uma cópia editável dos itens recebidos pelo componente.
  const [rows, setRows] = useState(
    // Mantém os dados originais e define valores iniciais para venda e preço.
    items.map((item) => ({
      ...item,
      quantity_sold: item.quantity_sold || 0,
      quantity_remaining: Math.max(0, item.quantity_consigned - (item.quantity_sold || 0)),
      unit_sale_price: item.base_price_snapshot,
    }))
  )
  // Guarda a porcentagem do valor da venda que pertence ao vendedor.
  const [sellerPercentage, setSellerPercentage] = useState(consignment.seller_percentage ?? '')
  // Guarda a opção de pagamento escolhida pelo usuário.
  const [paymentStatus, setPaymentStatus] = useState('pago')
  // Guarda o valor digitado quando o pagamento é parcial.
  const [amountPaidInput, setAmountPaidInput] = useState('')
  // Indica que uma operação está sendo enviada ao banco.
  const [saving, setSaving] = useState(false)
  // Guarda uma mensagem de validação ou erro do Supabase.
  const [error, setError] = useState('')

  // Atualiza um campo de uma linha específica do formulário.
  function updateRow(index, field, value) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  // Recalcula os valores derivados sempre que alguma linha é alterada.
  const totals = useMemo(() => {
    // Inicializa os totais financeiros e as quantidades do fechamento.
    let totalAmount = 0
    let sellerProfitAmount = 0
    let totalSold = 0
    let totalRemaining = 0
    // Percorre cada produto informado no fechamento.
    for (const row of rows) {
      // A sobra é informada; o vendido é o consignado menos a sobra.
      const remaining = Number(row.quantity_remaining) || 0
      const qty = Number(row.quantity_consigned) - remaining
      // O preço cadastrado é fixo para a venda.
      const price = Number(row.base_price_snapshot) || 0
      // Soma o faturamento deste produto ao total da consignação.
      totalAmount += qty * price
      // Soma as quantidades derivadas para exibir o resumo.
      totalSold += qty
      totalRemaining += remaining
    }
    sellerProfitAmount = totalAmount * ((Number(sellerPercentage) || 0) / 100)
    const ownerProfitAmount = totalAmount - sellerProfitAmount
    // Retorna todos os valores calculados para o formulário.
    return { totalAmount, sellerProfitAmount, ownerProfitAmount, totalSold, totalRemaining }
  }, [rows, sellerPercentage])

  // Valida os dados e grava o fechamento da consignação.
  async function handleSubmit(e) {
    // Impede o recarregamento padrão do formulário HTML.
    e.preventDefault()
    // Limpa um erro anterior antes de começar uma nova tentativa.
    setError('')

    // Verifica se alguma quantidade restante ultrapassa o que foi consignado.
    for (const row of rows) {
      const remaining = Number(row.quantity_remaining) || 0
      if (remaining > row.quantity_consigned) {
        setError(`"${row.product_name_snapshot}": quantidade que sobrou não pode passar da consignada (${row.quantity_consigned}).`)
        return
      }
      if (remaining < 0) {
        setError('Quantidade que sobrou não pode ser negativa.')
        return
      }
    }
    const percentage = Number(sellerPercentage) || 0
    if (percentage < 0 || percentage > 100) {
      setError('A porcentagem do vendedor deve estar entre 0% e 100%.')
      return
    }

    // Define quanto foi pago de acordo com a situação escolhida.
    let amountPaid = 0
    if (paymentStatus === 'pago') amountPaid = totals.totalAmount
    else if (paymentStatus === 'fiado') amountPaid = 0
    else {
      amountPaid = Number(amountPaidInput) || 0
      if (amountPaid > totals.totalAmount) {
        setError('O valor pago não pode ser maior que o total a receber.')
        return
      }
    }

    // Desativa os controles enquanto as alterações são gravadas.
    setSaving(true)

    // Atualiza cada item consignado com a quantidade e o preço efetivamente vendidos.
    for (const row of rows) {
      const { error: itemError } = await supabase
        .from('consignment_items')
        .update({
          quantity_sold: Number(row.quantity_consigned) - (Number(row.quantity_remaining) || 0),
          unit_sale_price: Number(row.base_price_snapshot) || 0,
        })
        .eq('id', row.id)
      if (itemError) {
        setSaving(false)
        setError(itemError.message)
        return
      }

      // Devolve ao estoque geral as unidades que não foram vendidas.
      const unsold = Number(row.quantity_remaining) || 0
      if (unsold > 0) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', row.product_id)
          .single()
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: product.stock_quantity + unsold })
            .eq('id', row.product_id)
        }
      }
    }

    // Registra o momento exato em que a consignação foi finalizada.
    const closedAt = new Date().toISOString()
    // Atualiza o resumo financeiro e o status da consignação no banco.
    const { data: updatedConsignment, error: closeError } = await supabase
      .from('consignments')
      .update({
        status: 'finalizado',
        total_amount: totals.totalAmount,
        profit_amount: totals.ownerProfitAmount,
        seller_percentage: percentage,
        seller_profit_amount: totals.sellerProfitAmount,
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        closed_at: closedAt,
      })
      .eq('id', consignment.id)
      .select()
      .single()

    setSaving(false)
    // Interrompe o fluxo caso a atualização principal tenha falhado.
    if (closeError) { setError(closeError.message); return }

    // Normaliza os valores das linhas antes de enviá-los ao componente pai.
    const updatedItems = rows.map((row) => ({
      ...row,
      quantity_sold: Number(row.quantity_consigned) - (Number(row.quantity_remaining) || 0),
      quantity_remaining: Number(row.quantity_remaining) || 0,
      unit_sale_price: Number(row.base_price_snapshot) || 0,
    }))

    onClosed(updatedConsignment, updatedItems)
  }

  // Renderiza os campos de fechamento, o resumo financeiro e as ações finais.
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.id} className="rounded-xl border border-wood-200 p-3">
              <p className="font-600 text-wood-900 text-sm mb-2">
              {row.product_name_snapshot} <span className="text-wood-400 font-400">• {row.quantity_consigned} consignados</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-600 text-wood-500 mb-1">Quantidade que sobrou</label>
                <input
                  type="text" inputMode="numeric" min="0" max={row.quantity_consigned}
                  className="w-full rounded-lg border border-wood-200 px-3 py-1.5 text-sm focus:border-sky-500"
                  value={row.quantity_remaining}
                  onChange={(e) => updateRow(i, 'quantity_remaining', e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-wood-500 mb-1">Preço fixo (unit.)</label>
                <div className="w-full rounded-lg border border-wood-100 bg-wood-50 px-3 py-1.5 text-sm text-wood-600">
                  {formatMoney(row.base_price_snapshot)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-600 text-wood-500 mb-1">Porcentagem do vendedor</label>
        <div className="flex items-center gap-2">
          <input
            type="text" inputMode="decimal" min="0" max="100" step="0.01"
            className="w-full rounded-lg border border-wood-200 px-3 py-1.5 text-sm focus:border-sky-500"
            value={sellerPercentage}
            onChange={(e) => setSellerPercentage(e.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
          />
          <span className="text-sm text-wood-500">%</span>
        </div>
      </div>

      <div className="rounded-xl bg-wood-50 border border-wood-200 p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Total que sobrou</span><span>{totals.totalRemaining}</span></div>
        <div className="flex justify-between"><span>Total vendido (itens)</span><span>{totals.totalSold}</span></div>
        <div className="flex justify-between font-700 text-wood-900"><span>Valor a receber</span><span>{formatMoney(totals.totalAmount)}</span></div>
        <div className="flex justify-between text-wood-700 font-600"><span>Lucro do vendedor</span><span>{formatMoney(totals.sellerProfitAmount)}</span></div>
        <div className="flex justify-between text-leaf-600 font-600"><span>Lucro do consignador</span><span>{formatMoney(totals.ownerProfitAmount)}</span></div>
      </div>

      <div>
        <label className="block text-xs font-600 text-wood-500 mb-1">Situação do pagamento</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'pago', label: 'Pago à vista' },
            { value: 'fiado', label: 'Fiado (nada pago ainda)' },
            { value: 'parcial', label: 'Pagamento parcial' },
          ].map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setPaymentStatus(opt.value)}
              className={`text-sm rounded-full px-3 py-1.5 border transition-colors ${
                paymentStatus === opt.value
                  ? 'bg-sky-500 border-sky-500 text-white'
                  : 'border-wood-200 text-wood-600 hover:bg-wood-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {paymentStatus === 'parcial' && (
          <input
            type="text" inputMode="decimal" min="0" step="0.01" max={totals.totalAmount}
            placeholder="Valor pago agora (R$)"
            className="mt-2 w-full rounded-lg border border-wood-200 px-3 py-1.5 text-sm focus:border-sky-500"
            value={amountPaidInput}
            onChange={(e) => setAmountPaidInput(e.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="success" disabled={saving}>
          {saving ? 'Salvando...' : 'Fechar consignação e gerar notinha'}
        </Button>
      </div>
    </form>
  )
}
