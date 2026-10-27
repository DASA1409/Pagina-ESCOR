import { useEffect, useState } from 'react'
import { Sparkles, SlidersHorizontal, Search, LayoutGrid } from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { parseNaturalLanguage } from '../chat/nlpParser.js'
import { mergeChatFilters } from '../chat/mergeChatFilters.js'
import { getModelsForSelectedMake } from '../services/vehicleCatalogService.js'
import { BODY_TYPE_OPTIONS, BUDGET_OPTIONS } from '../data/fallbackVehicles.js'

const QUICK_CHIPS = [
  { label: 'SUV familiar bajo COP $30K', text: 'SUV familiar bajo 30000' },
  { label: 'Sedán confiable', text: 'sedán confiable económico' },
  { label: 'Híbridos', text: 'híbrido' },
  { label: 'Pickup', text: 'pickup' },
  { label: 'Desde 2020', text: 'desde 2020' },
]

const TRANSMISSION_OPTIONS = ['Automática', 'Manual', 'CVT']

export default function SmartSearchPanel({ initialQuery, onQueryConsumed }) {
  const { makes, allVehicles, filters, onApplyFilters, clearFilters, resultsCount, loading } = useVehicleCatalog()
  const [nlQuery, setNlQuery] = useState(initialQuery || '')
  const models = getModelsForSelectedMake(allVehicles, filters.make)

  function applyNaturalLanguage(text) {
    const { filters: parsed } = parseNaturalLanguage(text)
    onApplyFilters(mergeChatFilters(filters, parsed))
  }

  useEffect(() => {
    if (initialQuery) {
      setNlQuery(initialQuery)
      applyNaturalLanguage(initialQuery)
      onQueryConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  function handleNlSubmit(e) {
    e.preventDefault()
    if (nlQuery.trim()) applyNaturalLanguage(nlQuery)
    onQueryConsumed?.()
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleFieldChange(field, value) {
    const next = { ...filters, [field]: value || undefined }
    if (field === 'make') next.model = undefined
    onApplyFilters(next)
  }

  return (
    <section id="concierge" className="search-panel">
      <div className="container">
        <div className="search-panel__card hairline-gold glass">
          <div className="search-panel__card-header">
            <div className="search-panel__title-group">
              <span className="search-panel__title-icon"><LayoutGrid size={16} strokeWidth={1.75} /></span>
              <div>
                <span className="label label--gold">Smart Vehicle Concierge Search</span>
                <h2>Describa lo que busca, en sus propias palabras</h2>
              </div>
            </div>

            <div className="search-panel__chips">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setNlQuery(chip.text)
                    applyNaturalLanguage(chip.text)
                  }}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                className={`chip ${filters.collectorOnly ? 'is-active' : ''}`}
                onClick={() => handleFieldChange('collectorOnly', filters.collectorOnly ? undefined : true)}
              >
                Autos de Colección
              </button>
              {Object.keys(filters).length > 0 && (
                <button type="button" className="chip chip--clear" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <form className="search-panel__nl hairline" onSubmit={handleNlSubmit}>
            <Sparkles size={18} strokeWidth={1.75} className="search-panel__nl-icon" />
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder='Ej. "SUV familiar bajo 30000" o "Toyota Corolla 2020 en adelante"'
            />
            <button type="submit" className="btn btn-primary">Buscar</button>
          </form>

          <div className="search-panel__grid hairline">
            <div className="search-panel__field">
              <span className="label">Marca</span>
              <select value={filters.make || ''} onChange={(e) => handleFieldChange('make', e.target.value)}>
                <option value="">Todas</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="search-panel__field">
              <span className="label">Modelo</span>
              <select
                value={filters.model || ''}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                disabled={!filters.make}
              >
                <option value="">{filters.make ? 'Todos' : 'Elija una marca'}</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="search-panel__field">
              <span className="label">Tipo de carrocería</span>
              <select value={filters.bodyType || ''} onChange={(e) => handleFieldChange('bodyType', e.target.value)}>
                <option value="">Todos</option>
                {BODY_TYPE_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="search-panel__field">
              <span className="label">Transmisión</span>
              <select value={filters.transmission || ''} onChange={(e) => handleFieldChange('transmission', e.target.value)}>
                <option value="">Todas</option>
                {TRANSMISSION_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="search-panel__field">
              <span className="label">Presupuesto máximo</span>
              <select
                value={filters.maxBudget || ''}
                onChange={(e) => handleFieldChange('maxBudget', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Sin límite</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>COP ${b.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div className="search-panel__field">
              <span className="label">Año mínimo</span>
              <input
                type="number"
                placeholder="2015"
                value={filters.minYear || ''}
                onChange={(e) => handleFieldChange('minYear', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <button type="button" className="btn btn-primary search-panel__submit" onClick={handleNlSubmit}>
            <Search size={16} strokeWidth={1.75} />
            Buscar vehículos disponibles
          </button>

          <div className="search-panel__footer">
            <SlidersHorizontal size={14} strokeWidth={1.75} />
            <span className="label">
              {loading ? 'Cargando catálogo…' : `${resultsCount} vehículos coinciden con su búsqueda`}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
