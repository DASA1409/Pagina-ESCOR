import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { sortVehicles } from '../services/vehicleCatalogService.js'
import VehicleCard from './VehicleCard.jsx'

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'year-desc', label: 'Año: más reciente' },
  { value: 'mileage-asc', label: 'Kilometraje: menor primero' },
]

const PAGE_SIZE = 12

export default function VehicleGrid({ onOpenVehicle }) {
  const { vehicles, filters, loading, error } = useVehicleCatalog()
  const [sortKey, setSortKey] = useState('relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const sorted = useMemo(
    () => (sortKey === 'relevance' ? vehicles : sortVehicles(vehicles, sortKey)),
    [vehicles, sortKey],
  )

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortKey])

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <section id="catalogo" className="catalog">
      <div className="container">
        <div className="catalog__header">
          <div>
            <span className="label label--gold">Catálogo Curado</span>
            <h2>Inventario disponible</h2>
          </div>
          <div className="catalog__sort">
            <span className="label">Ordenar por</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="catalog__notice hairline">
            No se pudo conectar con la API del catálogo. Verifique que la base de datos y el servidor estén activos.
          </div>
        )}

        {loading && (
          <div className="catalog__grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="vehicle-card vehicle-card--skeleton hairline" />
            ))}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="catalog__empty hairline">
            No encontramos vehículos con esos criterios. Intente ajustar el presupuesto, año o tipo de carrocería.
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <>
            <div className="catalog__grid">
              {visible.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onOpenVehicle={onOpenVehicle} />
              ))}
            </div>

            {hasMore && (
              <div className="catalog__load-more">
                <button className="btn btn-outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Mostrar más <ChevronDown size={16} strokeWidth={1.75} />
                </button>
                <span className="label">{visible.length} de {sorted.length} vehículos</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
