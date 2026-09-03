// Importa hooks para carregar dados e controlar a tela.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import NewConsignmentForm from '../components/NewConsignmentForm.jsx'
import ConsignmentCard from '../components/ConsignmentCard.jsx'
import Notinha from '../components/Notinha.jsx'

// Exibe os dados de um cliente e suas consignações.
export default function ClientDetailPage() {
  const { clientId } = useParams()
  const [client, setClient] = useState(null)
  const [consignments, setConsignments] = useState([])
  const [itemsByConsignment, setItemsByConsignment] = useState({})
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [notinhaData, setNotinhaData] = useState(null)

  // Busca cliente, produtos, consignações e itens relacionados.
  async function loadAll() {
    setLoading(true)
    setError('')

    const [{ data: clientData, error: clientError }, { data: productsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('products').select('*').order('name'),
    ])

    if (clientError) { setError(clientError.message); setLoading(false); return }
    setClient(clientData)
    setProducts(productsData || [])

    const { data: consignmentsData, error: consignError } = await supabase
      .from('consignments')
      .select('*')
      .eq('client_id', clientId)
      .order('sent_date', { ascending: false })

    if (consignError) { setError(consignError.message); setLoading(false); return }
    setConsignments(consignmentsData || [])

    if (consignmentsData && consignmentsData.length > 0) {
      const ids = consignmentsData.map((c) => c.id)
      const { data: itemsData } = await supabase
        .from('consignment_items')
        .select('*')
        .in('consignment_id', ids)

      const grouped = {}
      for (const item of itemsData || []) {
        if (!grouped[item.consignment_id]) grouped[item.consignment_id] = []
        grouped[item.consignment_id].push(item)
      }
      setItemsByConsignment(grouped)
    }

    setLoading(false)
  }

  // Recarrega os dados quando o cliente da URL muda.
  useEffect(() => { loadAll() }, [clientId])

  const activeConsignments = consignments.filter((c) => c.status === 'ativo')
  const finishedConsignments = consignments.filter((c) => c.status === 'finalizado')

  if (loading) return <p className="text-wood-400">Carregando...</p>
  if (error) return <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
  if (!client) return null

  // Renderiza informações do cliente, consignações e a notinha aberta.
  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-sm text-sky-500 hover:underline">← Todos os clientes</Link>
        <h1 className="font-display font-700 text-2xl text-wood-900 mt-2">{client.name}</h1>
        <p className="text-wood-500 text-sm">
          {[client.phone, client.address].filter(Boolean).join(' • ') || 'Sem informações adicionais'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display font-600 text-wood-800">Consignações ativas</h2>
        <Button className="w-full sm:w-auto" onClick={() => setShowNewForm((v) => !v)}>
          {showNewForm ? 'Cancelar' : '+ Nova consignação'}
        </Button>
      </div>

      {showNewForm && (
        <Card className="p-5">
          <h3 className="font-display font-600 text-wood-800 mb-4">Enviar brinquedos para {client.name}</h3>
          <NewConsignmentForm
            clientId={clientId}
            products={products}
            onCancel={() => setShowNewForm(false)}
            onCreated={() => { setShowNewForm(false); loadAll() }}
          />
        </Card>
      )}

      {activeConsignments.length === 0 ? (
        <Card className="p-6 text-center text-wood-500">Nenhuma consignação ativa no momento.</Card>
      ) : (
        <div className="space-y-3">
          {activeConsignments.map((c) => (
            <ConsignmentCard
              key={c.id}
              consignment={c}
              items={itemsByConsignment[c.id] || []}
              onChanged={loadAll}
              onClosedSuccessfully={(consignment, items) => setNotinhaData({ consignment, items })}
              onViewNotinha={(consignment, items) => setNotinhaData({ consignment, items })}
            />
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display font-600 text-wood-800 mb-3">Histórico</h2>
        {finishedConsignments.length === 0 ? (
          <Card className="p-6 text-center text-wood-500">Nenhuma consignação finalizada ainda.</Card>
        ) : (
          <div className="space-y-3">
            {finishedConsignments.map((c) => (
              <ConsignmentCard
                key={c.id}
                consignment={c}
                items={itemsByConsignment[c.id] || []}
                onChanged={loadAll}
                onViewNotinha={(consignment, items) => setNotinhaData({ consignment, items })}
              />
            ))}
          </div>
        )}
      </div>

      {notinhaData && (
        <Notinha
          client={client}
          consignment={notinhaData.consignment}
          items={notinhaData.items}
          onClose={() => setNotinhaData(null)}
        />
      )}
    </div>
  )
}
