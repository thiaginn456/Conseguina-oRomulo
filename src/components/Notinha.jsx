// Importa funções para exibir data e valores no padrão brasileiro.
import { formatMoney, formatDate } from '../lib/format.js'
// Importa o botão reutilizável.
import Button from './Button.jsx'

// Exibe o comprovante e oferece impressão normal ou térmica.
export default function Notinha({ client, consignment, items, onClose }) {
  // Soma a quantidade enviada para o resumo do comprovante.
  const totalConsigned = items.reduce((sum, i) => sum + i.quantity_consigned, 0)
  // Soma a quantidade efetivamente vendida.
  const totalSold = items.reduce((sum, i) => sum + i.quantity_sold, 0)
  // Calcula o valor correspondente ao vendedor: venda menos lucro.
  const sellerAmount = Number(consignment.total_amount || 0) - Number(consignment.profit_amount || 0)

  // Ativa temporariamente o layout específico da impressora térmica.
  function printThermal() {
    document.body.classList.add('thermal-print')
    window.print()
    window.setTimeout(() => document.body.classList.remove('thermal-print'), 1000)
  }

  // Renderiza os dados do cliente, itens, valores e ações de impressão.
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center overflow-y-auto py-4 sm:py-8 z-20 no-print-bg">
      <div className="bg-white rounded-2xl w-full max-w-md mx-3 sm:mx-4 shadow-xl">
        <div id="notinha-print" className="p-6">
          <div className="text-center mb-4">
            <h2 className="font-display font-700 text-lg text-wood-900">Comprovante de Consignação</h2>
            <p className="text-xs text-wood-400">{formatDate(consignment.closed_at || consignment.sent_date)}</p>
          </div>

          <div className="text-sm text-wood-700 border-t border-b border-dashed border-wood-300 py-3 mb-3 space-y-0.5">
            <p><span className="font-600">Cliente:</span> {client.name}</p>
            {client.phone && <p><span className="font-600">Telefone:</span> {client.phone}</p>}
            {client.address && <p><span className="font-600">Endereço:</span> {client.address}</p>}
          </div>

          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-left text-xs text-wood-500 border-b border-wood-200">
                <th className="pb-1">Brinquedo</th>
                <th className="pb-1 text-center">Consig.</th>
                <th className="pb-1 text-center">Vendido</th>
                <th className="pb-1 text-right">Unit.</th>
                <th className="pb-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-wood-100 last:border-0">
                  <td className="py-1 pr-1">{item.product_name_snapshot}</td>
                  <td className="py-1 text-center">{item.quantity_consigned}</td>
                  <td className="py-1 text-center">{item.quantity_sold}</td>
                  <td className="py-1 text-right">{formatMoney(item.unit_sale_price)}</td>
                  <td className="py-1 text-right">{formatMoney((item.unit_sale_price || 0) * item.quantity_sold)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-wood-300 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-wood-500">
              <span>Itens consignados</span>
              <span>{totalConsigned}</span>
            </div>
            <div className="flex justify-between text-wood-500">
              <span>Itens vendidos</span>
              <span>{totalSold}</span>
            </div>
            <div className="flex justify-between font-700 text-wood-900 text-base pt-1">
              <span>Total da venda</span>
              <span>{formatMoney(consignment.total_amount)}</span>
            </div>
            <div className="flex justify-between text-wood-700 font-600">
              <span>Valor do vendedor</span>
              <span>{formatMoney(sellerAmount)}</span>
            </div>
            <div className="flex justify-between text-wood-500">
              <span>Pago até agora</span>
              <span>{formatMoney(consignment.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-leaf-600 font-600">
              <span>Lucro</span>
              <span>{formatMoney(consignment.profit_amount)}</span>
            </div>
            <div className="flex justify-between text-wood-500 pt-1">
              <span>Situação do pagamento</span>
              <span className="font-600">
                {consignment.payment_status === 'pago' && 'Pago'}
                {consignment.payment_status === 'fiado' && 'Fiado (em aberto)'}
                {consignment.payment_status === 'parcial' && `Parcial (pago ${formatMoney(consignment.amount_paid)})`}
              </span>
            </div>
            {consignment.payment_status !== 'pago' && (
              <div className="flex justify-between text-candy-600 font-700">
                <span>Saldo devedor</span>
                <span>{formatMoney(consignment.total_amount - consignment.amount_paid)}</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-wood-400 mt-4">Obrigado pela parceria !</p>
        </div>

        <div className="no-print flex flex-col sm:flex-row sm:justify-end gap-2 p-4 border-t border-wood-100">
          <Button className="w-full sm:w-auto" variant="ghost" onClick={onClose}>Fechar</Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => window.print()}>Imprimir normal</Button>
          <Button className="w-full sm:w-auto" onClick={printThermal}>Imprimir térmica</Button>
        </div>
      </div>
    </div>
  )
}
