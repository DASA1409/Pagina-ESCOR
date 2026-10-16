import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'

export default function Navbar({ user, onLogin, onLogout, onOpenAdmin }) {
  const { compareIds } = useVehicleCatalog()

  return (
    <header className="navbar glass hairline">
      <div className="container navbar__inner">
        <div className="navbar__brand">
          <img className="brand-logo brand-logo--nav" src="/escor-logo.svg" alt="ESCOR Motors Atelier" />
        </div>

        <nav className="navbar__links">
          <a href="#catalogo">Catálogo</a>
          <a href="#concierge">Búsqueda</a>
          <a href="#coleccion">Colección</a>
          <a href="#comparador">
            Comparador
            {compareIds.length > 0 && <span className="navbar__badge navbar__badge--inline">{compareIds.length}</span>}
          </a>
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              {user.role === 'admin' && <button className="btn btn-outline navbar__admin-btn" onClick={onOpenAdmin}>Panel admin</button>}
              <button className="navbar__user" onClick={onLogout} title="Cerrar sesión">{user.name} · Salir</button>
            </>
          ) : (
            <button className="btn btn-outline navbar__admin-btn" onClick={onLogin}>Iniciar sesión</button>
          )}
          <a href="#asesoria" className="btn btn-primary navbar__cta">Asesoría Presencial</a>
        </div>
      </div>
    </header>
  )
}
