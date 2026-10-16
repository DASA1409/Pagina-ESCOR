import { useMemo } from 'react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { formatUSD } from '../services/priceEstimate.js'
import { getVehicleImageUrl } from '../services/imaginStudio.js'

export default function FeaturedVehicles({ onOpenVehicle }) {
  const { allVehicles, loading } = useVehicleCatalog()

  const featured = useMemo(() => {
    return [...allVehicles].sort((a, b) => b.horsepower - a.horsepower).slice(0, 2)
  }, [allVehicles])

  if (loading || featured.length < 2) return null

  return (
    <section className="featured">
      <div className="container">
        <div className="featured__header">
          <span className="label label--gold">Selección Curada · Alto Desempeño</span>
          <h2>Ediciones destacadas del catálogo</h2>
        </div>

        <div className="featured__grid">
          {featured.map((vehicle) => (
            <article className="featured-card hairline" key={vehicle.id}>
              <div className="featured-card__image">
                <img src={getVehicleImageUrl(vehicle)} alt={vehicle.title} loading="lazy" />
              </div>
              <div className="featured-card__body">
                <span className="label label--gold">{vehicle.make}</span>
                <h3>{vehicle.title}</h3>
                <p>{vehicle.bodyType} · {vehicle.transmission} · {vehicle.location}</p>

                <div className="featured-card__specs">
                  <div>
                    <span className="featured-card__spec-value">{vehicle.horsepower}</span>
                    <span className="label">HP</span>
                  </div>
                  <div>
                    <span className="featured-card__spec-value">{vehicle.engine.split(' ')[0]}</span>
                    <span className="label">Motor</span>
                  </div>
                  <div>
                    <span className="featured-card__spec-value">{vehicle.mpg ? `${vehicle.mpg}` : '—'}</span>
                    <span className="label">MPG</span>
                  </div>
                </div>

                <div className="featured-card__footer">
                  <span className="featured-card__price">{formatUSD(vehicle.price)}</span>
                  <button className="btn btn-outline" onClick={() => onOpenVehicle(vehicle)}>
                    Ver ficha completa
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
