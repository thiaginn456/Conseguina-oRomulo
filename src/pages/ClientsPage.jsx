// Importa hooks para carregar clientes e controlar o formulário.
import { useEffect, useState } from 'react'
// Importa o link usado para abrir os detalhes do cliente.
import { Link } from 'react-router-dom'
// Importa conexão e componentes visuais reutilizáveis.
import { supabase } from '../lib/supabaseClient.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

// Exibe, cadastra, pesquisa e exclui clientes.
export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '' })

  // Busca os clientes do Supabase em ordem alfabética.
  async function loadClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setClients(data)
    setLoading(false)
  }

  // Faz a primeira busca quando a página é montada.
  useEffect(() => { loadClients() }, [])

  // Valida e salva um novo cliente.
  async function handleAddClient(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert({
      name: form.name.trim(),
      phone: form.phone || null,
      address: form.address.trim() || null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setForm({ name: '', phone: '', address: '' })
    setShowForm(false)
    loadClients()
  }

  // Exclui o cliente depois que o diálogo de confirmação foi aceito.
  async function handleDeleteClient(client) {
    setError('')
    setSaving(true)
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    setSaving(false)
    if (error) { setError(error.message); return }
    setClients((current) => current.filter((item) => item.id !== client.id))
    setClientToDelete(null)
  }

  // Normaliza o texto digitado para comparar sem diferença de maiúsculas.
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  // Filtra clientes por nome, telefone ou endereço.
  const filteredClients = clients.filter((client) =>
    [client.name, client.phone, client.address]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-700 text-2xl text-wood-900">Clientes consignados</h1>
          <p className="text-wood-500 mt-1">Escolha um cliente para ver ou lançar consignações.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : '+ Novo cliente'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {showForm && (
        <Card className="p-5">
          <h2 className="font-display font-600 text-wood-800 mb-4">Cadastrar cliente</h2>
          <form onSubmit={handleAddClient} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-600 text-wood-500 mb-1">Nome</label>
              <input
                className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-wood-500 mb-1">Telefone</label>
              <input
                className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-600 text-wood-500 mb-1">Endereço</label>
              <input
                className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>Salvar cliente</Button>
            </div>
          </form>
        </Card>
      )}

      {!loading && clients.length > 0 && (
        <div>
          <label htmlFor="client-search" className="block text-xs font-600 text-wood-500 mb-1">Pesquisar clientes</label>
          <input
            id="client-search"
            type="search"
            className="w-full rounded-xl border border-wood-200 bg-white px-3 py-2 focus:border-sky-500"
            placeholder="Digite nome, telefone ou endereço"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <p className="text-wood-400">Carregando...</p>
      ) : clients.length === 0 ? (
        <Card className="p-8 text-center text-wood-500">
          Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card className="p-8 text-center text-wood-500">
          Nenhum cliente encontrado para essa pesquisa.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filteredClients.map((c) => (
            <Card key={c.id} className="p-4 hover:border-sky-500 transition-colors h-full">
              <div className="flex items-start justify-between gap-3">
                <Link className="min-w-0 flex-1" to={`/clientes/${c.id}`}>
                  <p className="font-display font-600 text-wood-900 truncate">{c.name}</p>
                  {c.phone && <p className="text-sm text-wood-500 truncate">{c.phone}</p>}
                  {c.address && <p className="text-sm text-wood-400 truncate">{c.address}</p>}
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  className="shrink-0 px-2 py-1 text-xs border border-wood-200"
                  disabled={saving}
                  onClick={() => setClientToDelete(c)}
                  aria-label={`Apagar cliente ${c.name}`}
                >
                  Apagar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {clientToDelete && (
        <ConfirmDialog
          title="Confirmar exclusão"
          message={`Apagar o cliente "${clientToDelete.name}" e todo o histórico dele?`}
          onCancel={() => setClientToDelete(null)}
          onConfirm={() => handleDeleteClient(clientToDelete)}
          saving={saving}
        />
      )}
    </div>
  )
}
