// Importa o estado local que controla expansão e fechamento.
import { useState } from 'react'
// Importa os formatadores de data e dinheiro.
import { formatDate, formatMoney } from '../lib/format.js'
// Importa os componentes visuais reutilizáveis.
import Card from './Card.jsx'
import Button from './Button.jsx'
import CloseConsignmentForm from './CloseConsignmentForm.jsx'

// Exibe uma consignação e permite consultar ou fechar seus itens.
export default function ConsignmentCard({ consignment, items, onChanged, onClosedSuccessfully, onViewNotinha }) {
  // Mantém o cartão aberto para consignações ativas.
  const [expanded, setExpanded] = useState(consignment.status === 'ativo')
  const [closing, setClosing] = useState(false)

  const totalConsigned = items.reduce((s, i) => s + i.quantity_consigned, 0)
  const isActive = consignment.status === 'ativo'

  // Renderiza resumo, itens, status financeiro e ações disponíveis.
  return (
    <Card className="p-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="font-display font-600 text-wood-900">
            Consignação de {formatDate(consignment.sent_date)}
          </p>
          <p className="text-sm text-wood-500">{totalConsigned} itens enviados</p>
        </div>
        <span className={`text-xs font-700 rounded-full px-3 py-1 ${
          isActive ? 'bg-sky-500/10 text-sky-500' : 'bg-leaf-500/10 text-leaf-600'
        }`}>
          {isActive ? 'Ativo' : 'Finalizado'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-wood-500 border-b border-wood-200">
                <th className="pb-1">Brinquedo</th>
                <th className="pb-1 text-center">Consig.</th>
                <th className="pb-1 text-center">Sobrou</th>
                <th className="pb-1 text-center">Vendido</th>
                <th className="pb-1 text-right">Unit.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-wood-100 last:border-0">
                  <td className="py-1">{item.product_name_snapshot}</td>
                  <td className="py-1 text-center">{item.quantity_consigned}</td>
                  <td className="py-1 text-center">{item.quantity_consigned - item.quantity_sold}</td>
                  <td className="py-1 text-center">{item.quantity_sold}</td>
                  <td className="py-1 text-right">
                    {item.unit_sale_price != null ? formatMoney(item.unit_sale_price) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {!isActive && (
            <div className="flex flex-wrap justify-between items-center gap-2 text-sm bg-wood-50 rounded-xl p-3">
              <span>Total: <strong>{formatMoney(consignment.total_amount)}</strong></span>
              <span className="text-wood-700">Vendedor ({Number(consignment.seller_percentage || 0)}%): <strong>{formatMoney(consignment.seller_profit_amount)}</strong></span>
              <span className="text-leaf-600">Consignador: <strong>{formatMoney(consignment.profit_amount)}</strong></span>
              <span className={consignment.payment_status === 'pago' ? 'text-leaf-600' : 'text-candy-600'}>
                {consignment.payment_status === 'pago' && 'Pago'}
                {consignment.payment_status === 'fiado' && 'Fiado (em aberto)'}
                {consignment.payment_status === 'parcial' && `Parcial (falta ${formatMoney(consignment.total_amount - consignment.amount_paid)})`}
              </span>
            </div>
          )}

          {isActive && !closing && (
            <div className="flex justify-end">
              <Button className="w-full sm:w-auto" variant="success" onClick={() => setClosing(true)}>
                Registrar vendas / Fechar
              </Button>
            </div>
          )}

          {isActive && closing && (
            <CloseConsignmentForm
              consignment={consignment}
              items={items}
              onCancel={() => setClosing(false)}
              onClosed={(updatedConsignment, updatedItems) => {
                setClosing(false)
                onChanged()
                onClosedSuccessfully(updatedConsignment, updatedItems)
              }}
            />
          )}

          {!isActive && (
            <div className="flex justify-end">
              <Button className="w-full sm:w-auto" variant="secondary" onClick={() => onViewNotinha(consignment, items)}>
                Ver / imprimir notinha
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
