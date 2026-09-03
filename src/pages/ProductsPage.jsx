// Importa hooks para carregar produtos e controlar os formulários.
import { useEffect, useState } from 'react'
// Importa a conexão com o banco e os componentes visuais.
import { supabase } from '../lib/supabaseClient.js'
import { formatMoney } from '../lib/format.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

// Define produtos de exemplo usados quando o estoque está vazio.
const SEED_PRODUCTS = [
  { name: 'Carrinho de Corrida', base_price: 12, stock_quantity: 20 },
  { name: 'Boneca Articulada', base_price: 25, stock_quantity: 15 },
  { name: 'Jogo de Tabuleiro - Trilha', base_price: 35, stock_quantity: 8 },
  { name: 'Quebra-Cabeça 100 peças', base_price: 18, stock_quantity: 12 },
  { name: 'Bicho de Pelúcia', base_price: 22, stock_quantity: 10 },
  { name: 'Blocos de Montar (kit)', base_price: 40, stock_quantity: 6 },
]

// Exibe e administra o estoque de brinquedos.
export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', base_price: '', stock_quantity: '' })
  const [saving, setSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', base_price: '', stock_quantity: '' })
  const [productToDelete, setProductToDelete] = useState(null)

  // Busca os produtos do Supabase em ordem alfabética.
  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setProducts(data)
    setLoading(false)
  }

  // Carrega o estoque ao abrir a página.
  useEffect(() => { loadProducts() }, [])

  // Cadastra um novo produto no estoque.
  async function handleAddProduct(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('products').insert({
      name: form.name.trim(),
      base_price: Number(form.base_price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setForm({ name: '', base_price: '', stock_quantity: '' })
    loadProducts()
  }

  // Insere os produtos de exemplo no banco.
  async function handleSeed() {
    setSaving(true)
    const { error } = await supabase.from('products').insert(SEED_PRODUCTS)
    setSaving(false)
    if (error) { setError(error.message); return }
    loadProducts()
  }

  // Preenche o formulário inline com os dados do produto escolhido.
  function startEditing(product) {
    setEditingProduct(product.id)
    setEditForm({
      name: product.name,
      base_price: product.base_price,
      stock_quantity: product.stock_quantity,
    })
    setError('')
  }

  // Salva alterações de nome, preço e quantidade.
  async function handleEditProduct(e) {
    e.preventDefault()
    if (!editForm.name.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('products')
      .update({
        name: editForm.name.trim(),
        base_price: Number(editForm.base_price) || 0,
        stock_quantity: Number(editForm.stock_quantity) || 0,
      })
      .eq('id', editingProduct)
      .select()
      .single()
    setSaving(false)
    if (error) { setError(error.message); return }
    setProducts((current) => current.map((product) => product.id === editingProduct ? data : product))
    setEditingProduct(null)
  }

  // Exclui um produto após a confirmação visual.
  async function handleDeleteProduct(product) {
    setError('')
    setSaving(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setSaving(false)
    if (error) { setError(`Não foi possível apagar este produto. Ele pode estar ligado a uma consignação. ${error.message}`); return }
    setProducts((current) => current.filter((item) => item.id !== product.id))
    setProductToDelete(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-700 text-2xl text-wood-900">Estoque de brinquedos</h1>
        <p className="text-wood-500 mt-1">Cadastre os brinquedos que você tem disponíveis para consignar.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <Card className="p-5">
        <h2 className="font-display font-600 text-wood-800 mb-4">Novo brinquedo</h2>
        <form onSubmit={handleAddProduct} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] items-end">
          <div>
            <label className="block text-xs font-600 text-wood-500 mb-1">Nome do brinquedo</label>
            <input
              className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
              placeholder="Ex: Carrinho de Corrida"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-600 text-wood-500 mb-1">Preço base (R$)</label>
            <input
              type="text" inputMode="decimal" min="0" step="0.01"
              className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
              placeholder="0,00"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') })}
            />
          </div>
          <div>
            <label className="block text-xs font-600 text-wood-500 mb-1">Qtd. em estoque</label>
            <input
              type="text" inputMode="numeric" min="0" step="1"
              className="w-full rounded-xl border border-wood-200 px-3 py-2 focus:border-sky-500"
              placeholder="0"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <Button className="w-full md:w-auto" type="submit" disabled={saving}>Adicionar</Button>
        </form>
      </Card>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="font-display font-600 text-wood-800">Brinquedos cadastrados</h2>
          {!loading && products.length === 0 && (
            <Button variant="secondary" onClick={handleSeed} disabled={saving}>
              Popular com brinquedos de teste
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-wood-400">Carregando...</p>
        ) : products.length === 0 ? (
          <Card className="p-8 text-center text-wood-500">
            Nenhum brinquedo cadastrado ainda. Adicione um acima ou use os dados de teste.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <Card key={p.id} className="p-4">
                {editingProduct === p.id ? (
                  <form onSubmit={handleEditProduct} className="space-y-3">
                    <div>
                      <label className="block text-xs font-600 text-wood-500 mb-1">Nome do brinquedo</label>
                      <input
                        className="w-full rounded-xl border border-wood-200 px-3 py-2 text-sm focus:border-sky-500"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-600 text-wood-500 mb-1">Preço base (R$)</label>
                        <input
                          type="text" inputMode="decimal" min="0" step="0.01"
                          className="w-full rounded-xl border border-wood-200 px-3 py-2 text-sm focus:border-sky-500"
                          value={editForm.base_price}
                          onChange={(e) => setEditForm({ ...editForm, base_price: e.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-600 text-wood-500 mb-1">Qtd. em estoque</label>
                        <input
                          type="text" inputMode="numeric" min="0" step="1"
                          className="w-full rounded-xl border border-wood-200 px-3 py-2 text-sm focus:border-sky-500"
                          value={editForm.stock_quantity}
                          onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value.replace(/\D/g, '') })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                      <Button type="submit" disabled={saving}>Salvar alterações</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-600 text-wood-900 truncate">{p.name}</p>
                      <p className="text-sm text-wood-500">{formatMoney(p.base_price)} un.</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className={`text-sm font-700 rounded-full px-3 py-1 ${p.stock_quantity > 0 ? 'bg-leaf-500/10 text-leaf-600' : 'bg-red-50 text-red-600'}`}>
                        {p.stock_quantity} em estoque
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => startEditing(p)}>Editar</Button>
                        <Button type="button" variant="danger" className="px-2 py-1 text-xs border border-wood-200" disabled={saving} onClick={() => setProductToDelete(p)}>Apagar</Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {productToDelete && (
        <ConfirmDialog
          title="Confirmar exclusão"
          message={`Apagar o produto "${productToDelete.name}" do estoque?`}
          onCancel={() => setProductToDelete(null)}
          onConfirm={() => handleDeleteProduct(productToDelete)}
          saving={saving}
        />
      )}
    </div>
  )
}
