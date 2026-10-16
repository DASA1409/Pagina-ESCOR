import { useState } from 'react'
import { LogIn, ArrowLeft } from 'lucide-react'
import { login } from '../services/authService.js'

export default function LoginModal({ onClose, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await login(email, password)
      onLogin(data.user)
      onClose()
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__brand"><img className="brand-logo brand-logo--login" src="/escor-logo.svg" alt="ESCOR Motors Atelier" /></div>
      <div className="auth-modal glass hairline-gold">
        <button className="auth-page__back" onClick={onClose}><ArrowLeft size={15} /> Volver al catálogo</button>
        <span className="label label--gold">ESCOR</span>
        <h2 id="login-title">Acceso al portal</h2>
        <p className="auth-modal__intro">Inicie sesión para gestionar su cuenta o el inventario.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-form__field">
            <span className="label">Correo</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="auth-form__field">
            <span className="label">Contraseña</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          </label>
          {error && <p className="auth-form__error">{error}</p>}
          <button className="btn btn-primary auth-form__submit" disabled={submitting}>
            <LogIn size={15} /> {submitting ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </main>
  )
}
