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
      unit_sale_price: item.unit_sale_price ?? item.base_price_snapshot,
    }))
  )
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
    // Inicializa o total cobrado, o lucro e a quantidade vendida.
    let totalAmount = 0
    let profitAmount = 0
    let totalSold = 0
    // Percorre cada produto informado no fechamento.
    for (const row of rows) {
      // Converte a quantidade para número e usa zero quando o campo está vazio.
      const qty = Number(row.quantity_sold) || 0
      // Converte o preço de venda para número e usa zero quando necessário.
      const price = Number(row.unit_sale_price) || 0
      // Soma o faturamento deste produto ao total da consignação.
      totalAmount += qty * price
      // O lucro é a diferença entre o preço de venda e o preço-base.
      profitAmount += qty * (price - Number(row.base_price_snapshot))
      // Soma a quantidade vendida para exibir o resumo.
      totalSold += qty
    }
    // Retorna todos os valores calculados para o formulário.
    return { totalAmount, profitAmount, totalSold }
  }, [rows])

  // Valida os dados e grava o fechamento da consignação.
  async function handleSubmit(e) {
    // Impede o recarregamento padrão do formulário HTML.
    e.preventDefault()
    // Limpa um erro anterior antes de começar uma nova tentativa.
    setError('')

    // Verifica se alguma quantidade vendida ultrapassa o que foi consignado.
    for (const row of rows) {
      const qty = Number(row.quantity_sold) || 0
      if (qty > row.quantity_consigned) {
        setError(`"${row.product_name_snapshot}": quantidade vendida não pode passar da consignada (${row.quantity_consigned}).`)
        return
      }
      if (qty < 0) {
        setError('Quantidade vendida não pode ser negativa.')
        return
      }
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
          quantity_sold: Number(row.quantity_sold) || 0,
          unit_sale_price: Number(row.unit_sale_price) || 0,
        })
        .eq('id', row.id)
      if (itemError) {
        setSaving(false)
        setError(itemError.message)
        return
      }

      // Devolve ao estoque geral as unidades que não foram vendidas.
      const unsold = row.quantity_consigned - (Number(row.quantity_sold) || 0)
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
        profit_amount: totals.profitAmount,
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
      quantity_sold: Number(row.quantity_sold) || 0,
      unit_sale_price: Number(row.unit_sale_price) || 0,
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
                <label className="block text-xs font-600 text-wood-500 mb-1">Quantidade vendida</label>
                <input
                  type="text" inputMode="numeric" min="0" max={row.quantity_consigned}
                  className="w-full rounded-lg border border-wood-200 px-3 py-1.5 text-sm focus:border-sky-500"
                  value={row.quantity_sold}
                  onChange={(e) => updateRow(i, 'quantity_sold', e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="block text-xs font-600 text-wood-500 mb-1">Preço de venda (unit.)</label>
                <input
                  type="text" inputMode="decimal" min="0" step="0.01"
                  className="w-full rounded-lg border border-wood-200 px-3 py-1.5 text-sm focus:border-sky-500"
                  value={row.unit_sale_price}
                  onChange={(e) => updateRow(i, 'unit_sale_price', e.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-wood-50 border border-wood-200 p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Total vendido (itens)</span><span>{totals.totalSold}</span></div>
        <div className="flex justify-between font-700 text-wood-900"><span>Valor a receber</span><span>{formatMoney(totals.totalAmount)}</span></div>
        <div className="flex justify-between text-leaf-600 font-600"><span>Lucro</span><span>{formatMoney(totals.profitAmount)}</span></div>
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
