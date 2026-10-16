export default function Footer() {
  return (
    <footer className="footer hairline">
      <div className="container footer__inner">
        <div className="footer__brand">
          <img className="brand-logo brand-logo--footer" src="/escor-logo.svg" alt="ESCOR Motors Atelier" />
        </div>
        <p className="footer__tagline">
          Marketplace de vehículos usados con inventario administrado desde la base de datos ESCOR.
          Los precios y especificaciones dependen de los datos registrados para cada vehículo y no
          constituyen una oferta de venta real.
        </p>
        <div className="footer__meta">
          <span className="label">© {new Date().getFullYear()} ESCOR</span>
          <span className="label">Hecho con React 19 + Vite</span>
        </div>
      </div>
    </footer>
  )
}
