import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=2400&auto=format&fit=crop'

export default function Hero() {
  const { allVehicles, makes } = useVehicleCatalog()

  const avgPrice = allVehicles.length
    ? Math.round(allVehicles.reduce((sum, v) => sum + v.price, 0) / allVehicles.length)
    : 0

  return (
    <section className="hero">
      <div className="hero__bg" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
      <div className="hero__gradient" />
      <div className="container hero__content">
        <span className="label label--gold">Showroom Digital · Curaduría Inteligente</span>
        <h1 className="hero__title">
          El arte de encontrar<br />su próximo vehículo
        </h1>
        <p className="hero__subtitle">
          ESCOR reúne opciones para distintos estilos de vida y un concierge de inteligencia
          artificial para acompañarle hasta el vehículo que necesita.
        </p>
        <div className="hero__cta">
          <a href="#concierge" className="btn btn-primary">Iniciar búsqueda inteligente</a>
          <a href="#catalogo" className="btn btn-outline">Ver catálogo completo</a>
        </div>

        <div className="hero__metrics hairline">
          <div className="hero__metric">
            <span className="hero__metric-value">{allVehicles.length || '—'}</span>
            <span className="label">Vehículos en catálogo</span>
          </div>
          <div className="hero__metric">
            <span className="hero__metric-value">{makes.length || '—'}</span>
            <span className="label">Marcas disponibles</span>
          </div>
          <div className="hero__metric">
            <span className="hero__metric-value">{avgPrice ? `$${Math.round(avgPrice / 1000)}K` : '—'}</span>
            <span className="label">Precio promedio</span>
          </div>
          <div className="hero__metric">
            <span className="hero__metric-value">Gemini 3</span>
            <span className="label">Familia de modelos usada</span>
          </div>
        </div>
      </div>
    </section>
  )
}
