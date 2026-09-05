import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      setError(result.error.message)
    } else if (isSignUp && !result.data.session) {
      setMessage('Cadastro criado. Verifique seu e-mail para confirmar a conta.')
    }

    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 text-center">
          <span className="inline-block bg-wood-800 text-white rounded-md px-3 py-2 font-bold text-sm">
            RÔMULO CONSEGUINAÇÕES
          </span>
          <h1 className="font-display font-700 text-2xl text-wood-900 mt-6">
            {isSignUp ? 'Criar acesso' : 'Entrar no sistema'}
          </h1>
          <p className="mt-2 text-sm text-wood-500">
            {isSignUp ? 'Cadastre seu e-mail para começar.' : 'Acesse seus clientes e seu estoque.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-600 text-wood-700">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-wood-200 px-3 py-3 text-wood-900 focus:border-candy-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-600 text-wood-700">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              className="mt-1 w-full rounded-md border border-wood-200 px-3 py-3 text-wood-900 focus:border-candy-500 focus:outline-none"
            />
          </label>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full min-h-11">
            {isSubmitting ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 w-full text-sm font-600 text-candy-600 hover:underline"
          onClick={() => {
            setIsSignUp((value) => !value)
            setError('')
            setMessage('')
          }}
        >
          {isSignUp ? 'Já tenho uma conta' : 'Ainda não tenho uma conta'}
        </button>
      </Card>
    </main>
  )
}
