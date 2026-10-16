import { useMemo } from 'react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { formatUSD } from '../services/priceEstimate.js'
import { getVehicleImageUrl } from '../services/imaginStudio.js'

export default function CollectorShowcase({ onOpenVehicle }) {
  const { allVehicles, loading } = useVehicleCatalog()

  const collectorCars = useMemo(() => allVehicles.filter((v) => v.isCollector), [allVehicles])

  if (loading || !collectorCars.length) return null

  return (
    <section id="coleccion" className="collection">
      <div className="container">
        <div className="collection__header">
          <span className="label label--gold">Piezas Únicas</span>
          <h2>Autos de colección</h2>
          <p>Unidades restauradas y verificadas, seleccionadas para el coleccionista exigente.</p>
        </div>

        <div className="collection__grid">
          {collectorCars.map((vehicle) => (
            <article className="collection-card hairline-gold" key={vehicle.id}>
              <div className="collection-card__image">
                <img src={getVehicleImageUrl(vehicle)} alt={vehicle.title} loading="lazy" />
                <span className="collection-card__badge">Colección</span>
              </div>
              <div className="collection-card__body">
                <span className="label label--gold">{vehicle.make}</span>
                <h3>{vehicle.title}</h3>
                <span className="label">{vehicle.condition} · {vehicle.mileage.toLocaleString()} km</span>
                <div className="collection-card__footer">
                  <span className="collection-card__price">{formatUSD(vehicle.price)}</span>
                  <button className="btn btn-outline" onClick={() => onOpenVehicle(vehicle)}>Ver ficha</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
