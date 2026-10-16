import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { formatUSD } from '../services/priceEstimate.js'
import { getVehicleImageUrl } from '../services/imaginStudio.js'

function getFlavorBadge(vehicle) {
  if (vehicle.isCollector) return 'Colección'
  const currentYear = new Date().getFullYear()
  if (vehicle.year >= currentYear - 1) return 'Recién llegado'
  if (vehicle.mileage < 20000) return 'Pocas unidades'
  return null
}

function getBlurb(vehicle) {
  if (vehicle.condition === 'Como nuevo') return 'Kilometraje excepcionalmente bajo, mantenimiento al día.'
  if (vehicle.condition === 'Excelente') return 'Historial de mantenimiento completo, listo para transferir.'
  return 'Mecánica revisada, ideal para uso diario sin sorpresas.'
}

export default function VehicleCard({ vehicle, onOpenVehicle }) {
  const { toggleCompare, compareIds } = useVehicleCatalog()
  const [saved, setSaved] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const isComparing = compareIds.includes(vehicle.id)
  const flavorBadge = getFlavorBadge(vehicle)
  const imageUrl = getVehicleImageUrl(vehicle)

  return (
    <article className="vehicle-card hairline">
      <div
        className="vehicle-card__image"
        role="button"
        tabIndex={0}
        onClick={() => onOpenVehicle(vehicle)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenVehicle(vehicle)
        }}
      >
        {!imageFailed ? (
          <img src={imageUrl} alt={vehicle.title} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="vehicle-card__image-fallback">
            <span className="font-serif">{vehicle.make}</span>
          </div>
        )}
        {flavorBadge && <span className={`vehicle-card__flavor ${vehicle.isCollector ? 'is-collector' : ''}`}>{flavorBadge}</span>}

        <button
          className={`vehicle-card__icon-btn vehicle-card__wishlist-btn ${saved ? 'is-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            setSaved((s) => !s)
          }}
          aria-label="Guardar en favoritos"
          title="Guardar en favoritos"
        >
          <Heart size={14} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="vehicle-card__body">
        <div className="vehicle-card__eyebrow">
          <span className="label label--gold">{vehicle.make}</span>
          <span className="label">{vehicle.year}</span>
        </div>

        <h3 className="vehicle-card__title">{vehicle.model}</h3>
        <span className="vehicle-card__subtitle label">{vehicle.bodyType} · {vehicle.location}</span>

        <div className="vehicle-card__spec-grid">
          <div>
            <span className="vehicle-card__spec-value">{vehicle.horsepower}</span>
            <span className="label">HP</span>
          </div>
          <div>
            <span className="vehicle-card__spec-value">{Math.round(vehicle.mileage / 1000)}K</span>
            <span className="label">KM</span>
          </div>
          <div>
            <span className="vehicle-card__spec-value">{vehicle.transmission === 'Automática' ? 'Auto' : vehicle.transmission}</span>
            <span className="label">Caja</span>
          </div>
        </div>

        <p className="vehicle-card__blurb">{getBlurb(vehicle)}</p>

        <div className="vehicle-card__price-row">
          <span className="vehicle-card__price">{formatUSD(vehicle.price)}</span>
          <span className="label">{vehicle.fuelType}</span>
        </div>

        <div className="vehicle-card__actions">
          <button className="btn btn-primary vehicle-card__detail-btn" onClick={() => onOpenVehicle(vehicle)}>
            Ver ficha
          </button>
          <button
            className={`btn vehicle-card__compare-btn ${isComparing ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => toggleCompare(vehicle.id)}
          >
            {isComparing ? 'Añadido' : 'Comparar'}
          </button>
        </div>
      </div>
    </article>
  )
}
