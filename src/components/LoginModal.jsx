import { useState } from 'react'
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react'
import { login, register } from '../services/authService.js'

export default function LoginModal({ onClose, onLogin, mode = 'login', onModeChange }) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (isRegister && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      const data = isRegister
        ? await register(name, email, password)
        : await login(email, password)
      onLogin(data.user)
      onClose()
    } catch (authError) {
      setError(authError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__brand"><img className="brand-logo brand-logo--login" src="/escor-logo.svg" alt="ESCOR Motors Atelier" /></div>
      <div className="auth-modal glass hairline-gold">
        <button type="button" className="auth-page__back" onClick={onClose}><ArrowLeft size={15} /> Volver al catálogo</button>
        <span className="label label--gold">ESCOR</span>
        <h2 id="login-title">{isRegister ? 'Crear cuenta' : 'Acceso al portal'}</h2>
        <p className="auth-modal__intro">
          {isRegister ? 'Regístrese para guardar su cuenta y acceder a las funciones disponibles.' : 'Inicie sesión para gestionar su cuenta o el inventario.'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <label className="auth-form__field">
              <span className="label">Usuario</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                autoComplete="name"
              />
            </label>
          )}
          <label className="auth-form__field">
            <span className="label">Correo</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="auth-form__field">
            <span className="label">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>
          {isRegister && (
            <label className="auth-form__field">
              <span className="label">Confirmar contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && <p className="auth-form__error">{error}</p>}
          <button className="btn btn-primary auth-form__submit" disabled={submitting}>
            {isRegister ? <UserPlus size={15} /> : <LogIn size={15} />}
            {submitting ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="auth-modal__switch">
          {isRegister ? '¿Ya tiene una cuenta?' : '¿Aún no tiene una cuenta?'}{' '}
          <button type="button" onClick={() => onModeChange(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </p>
      </div>
    </main>
  )
}
