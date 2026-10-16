import { Fragment } from 'react'
import { X, GitCompareArrows, Plus } from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { getVehicleById } from '../services/vehicleCatalogService.js'
import { formatUSD } from '../services/priceEstimate.js'
import Vehicle3DBox from './Vehicle3DBox.jsx'
import { getVehicleImageUrl } from '../services/imaginStudio.js'

const ROWS = [
  { label: 'Precio', display: (v) => formatUSD(v.price), raw: (v) => v.price, better: 'lower' },
  { label: 'Año', display: (v) => v.year, raw: (v) => v.year, better: 'higher' },
  { label: 'Motor', display: (v) => v.engine },
  { label: 'Potencia', display: (v) => `${v.horsepower} hp`, raw: (v) => v.horsepower, better: 'higher' },
  { label: 'Transmisión', display: (v) => v.transmission },
  { label: 'Tracción', display: (v) => v.drivetrain },
  { label: 'Combustible', display: (v) => v.fuelType },
  { label: 'Rendimiento', display: (v) => (v.mpg ? `${v.mpg} mpg` : 'N/A'), raw: (v) => v.mpg, better: 'higher' },
  { label: 'Kilometraje', display: (v) => `${v.mileage.toLocaleString()} km`, raw: (v) => v.mileage, better: 'lower' },
  { label: 'Carrocería', display: (v) => v.bodyType },
  { label: 'Condición', display: (v) => v.condition },
]

const DIM_ROWS = [
  ['lengthMm', 'Largo'],
  ['widthMm', 'Ancho'],
  ['heightMm', 'Alto'],
]

function getWinnerIndex(row, vehicles) {
  if (!row.better || vehicles.length !== 2) return -1
  const a = row.raw(vehicles[0])
  const b = row.raw(vehicles[1])
  if (a == null || b == null || a === b) return -1
  if (row.better === 'lower') return a < b ? 0 : 1
  return a > b ? 0 : 1
}

export default function Comparator() {
  const { allVehicles, compareIds, toggleCompare, clearCompare } = useVehicleCatalog()
  const vehicles = compareIds.map((id) => getVehicleById(allVehicles, id)).filter(Boolean)
  const showPlaceholder = vehicles.length === 1
  const dataCols = vehicles.length + (showPlaceholder ? 1 : 0)

  return (
    <section id="comparador" className="comparator">
      <div className="container">
        <div className="comparator__header">
          <div>
            <span className="label label--gold">Comparador</span>
            <h2>Comparación lado a lado</h2>
          </div>
          {vehicles.length > 0 && (
            <button className="btn btn-ghost" onClick={clearCompare}>Limpiar comparación</button>
          )}
        </div>

        {vehicles.length === 0 && (
          <div className="comparator__empty hairline">
            <GitCompareArrows size={22} strokeWidth={1.5} />
            <p>
              Su comparador está vacío. Use el botón <strong>Comparar</strong> en cualquier vehículo del catálogo
              (hasta 2) para verlos aquí lado a lado, incluyendo sus dimensiones en 3D y quién gana cada categoría.
            </p>
          </div>
        )}

        {vehicles.length === 1 && (
          <div className="comparator__notice hairline">
            Añadió {vehicles[0].title}. Seleccione un segundo vehículo desde el catálogo para completar la comparación.
          </div>
        )}

        {vehicles.length === 2 && (
          <div className="dim-compare hairline">
            <Vehicle3DBox vehicle={vehicles[0]} />
            <div className="dim-compare__stats">
              <span className="label label--gold">Dimensiones</span>
              {DIM_ROWS.map(([key, label]) => {
                const a = vehicles[0].dimensions?.[key]
                const b = vehicles[1].dimensions?.[key]
                return (
                  <div className="dim-compare__row" key={key}>
                    <span className={a && b && a >= b ? 'is-winner' : ''}>{a ? `${(a / 1000).toFixed(2)} m` : '—'}</span>
                    <span className="label">{label}</span>
                    <span className={a && b && b >= a ? 'is-winner' : ''}>{b ? `${(b / 1000).toFixed(2)} m` : '—'}</span>
                  </div>
                )
              })}
            </div>
            <Vehicle3DBox vehicle={vehicles[1]} mirror />
          </div>
        )}

        {vehicles.length > 0 && (
          <div
            className="comparator__table hairline"
            style={{ gridTemplateColumns: `150px repeat(${dataCols}, minmax(200px, 1fr))` }}
          >
            <div className="comparator__cell comparator__cell--head comparator__cell--corner" />
            {vehicles.map((vehicle) => (
              <div className="comparator__cell comparator__cell--head" key={`head-${vehicle.id}`}>
                <img src={getVehicleImageUrl(vehicle)} alt={vehicle.title} />
                <span className="comparator__title">{vehicle.title}</span>
                <span className="comparator__head-price">{formatUSD(vehicle.price)}</span>
                <button className="modal__close" onClick={() => toggleCompare(vehicle.id)} aria-label="Quitar">
                  <X size={14} strokeWidth={1.75} />
                </button>
              </div>
            ))}
            {showPlaceholder && (
              <div className="comparator__cell comparator__cell--head comparator__cell--placeholder">
                <span className="comparator__placeholder-icon"><Plus size={18} strokeWidth={1.75} /></span>
                <span className="label">Añadir vehículo a comparar</span>
              </div>
            )}

            {ROWS.map((row, i) => (
              <Fragment key={row.label}>
                <div className={`comparator__cell label ${i % 2 === 1 ? 'is-alt' : ''}`}>{row.label}</div>
                {vehicles.map((vehicle, colIndex) => {
                  const winnerIdx = getWinnerIndex(row, vehicles)
                  const isWinner = winnerIdx === colIndex
                  return (
                    <div
                      className={`comparator__cell ${i % 2 === 1 ? 'is-alt' : ''} ${isWinner ? 'is-winner' : ''}`}
                      key={vehicle.id}
                    >
                      {row.display(vehicle)}
                      {isWinner && <span className="comparator__pill">Líder</span>}
                    </div>
                  )
                })}
                {showPlaceholder && (
                  <div className={`comparator__cell comparator__cell--dash ${i % 2 === 1 ? 'is-alt' : ''}`}>—</div>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
