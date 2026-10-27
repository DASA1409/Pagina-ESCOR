import { useState } from 'react'
import { CarFront, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { createVehicle, deleteVehicle, updateVehicle } from '../services/authService.js'

const initialForm = {
  make: '', model: '', year: new Date().getFullYear(), bodyType: 'Sedan', fuelType: 'Gasolina',
  transmission: 'Automática', drivetrain: 'FWD', color: '', engine: '', horsepower: 0, mpg: '',
  doors: 4, seats: 5, mileage: 0, price: 0, vin: '', location: '', condition: 'Excelente', imageUrl: '',
}

const fields = [
  ['make', 'Marca'], ['model', 'Modelo'], ['year', 'Año', 'number'], ['bodyType', 'Carrocería'],
  ['fuelType', 'Combustible'], ['transmission', 'Transmisión'], ['drivetrain', 'Tracción'], ['color', 'Color'],
  ['engine', 'Motor'], ['horsepower', 'Potencia (hp)', 'number'], ['mpg', 'Rendimiento (mpg)', 'number'],
  ['doors', 'Puertas', 'number'], ['seats', 'Asientos', 'number'], ['mileage', 'Kilometraje', 'number'],
  ['price', 'Precio', 'number'], ['vin', 'VIN'], ['location', 'Ubicación'], ['condition', 'Condición'], ['imageUrl', 'URL de imagen', 'url'],
]

function formFromVehicle(vehicle) {
  if (!vehicle) return initialForm
  return { ...initialForm, ...vehicle, mpg: vehicle.mpg ?? '' }
}

function normalizeVehicleName(name) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export default function AdminVehiclePanel({ open, onClose }) {
  const { allVehicles, refreshCatalog } = useVehicleCatalog()
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [view, setView] = useState('list')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  if (!open) return null

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function startCreate() {
    setForm(initialForm)
    setEditingId(null)
    setError('')
    setView('form')
  }

  function startEdit(vehicle) {
    setForm(formFromVehicle(vehicle))
    setEditingId(vehicle.id)
    setError('')
    setView('form')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) await updateVehicle({ ...form, id: editingId })
      else await createVehicle(form)
      await refreshCatalog()
      setForm(initialForm)
      setEditingId(null)
      setView('list')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(vehicle) {
    if (normalizeVehicleName(deleteConfirmation) !== normalizeVehicleName(vehicle.title) || saving) return

    setSaving(true)
    setError('')
    try {
      await deleteVehicle(vehicle.id, deleteConfirmation)
      await refreshCatalog()
      setDeletingId(null)
      setDeleteConfirmation('')
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="new-vehicle-title">
      <div className="admin-panel glass hairline-gold">
        <button className="modal__close" onClick={onClose} aria-label="Cerrar formulario"><X size={18} /></button>
        <div className="admin-panel__heading">
          <span className="insight-card__icon-wrap"><CarFront size={18} /></span>
          <div><span className="label label--gold">Administración</span><h2 id="new-vehicle-title">Panel de inventario</h2></div>
        </div>
        {view === 'list' ? (
          <>
            <div className="admin-panel__toolbar">
              <span className="label">{allVehicles.length} vehículos en inventario</span>
              <button className="btn btn-primary" onClick={startCreate}><Plus size={15} /> Nuevo vehículo</button>
            </div>
            <div className="admin-vehicle-list">
              {allVehicles.map((vehicle) => (
                <div className="admin-vehicle-row" key={vehicle.id}>
                  <div><strong>{vehicle.title}</strong><span className="label">{vehicle.vin} · {vehicle.location}</span></div>
                  <div className="admin-vehicle-row__actions">
                    <button className="btn btn-outline admin-vehicle-row__edit" onClick={() => startEdit(vehicle)}><Pencil size={14} /> Editar</button>
                    <button
                      className="btn btn-outline admin-vehicle-row__delete"
                      onClick={() => {
                        setDeletingId(vehicle.id)
                        setDeleteConfirmation('')
                        setError('')
                      }}
                    >
                      <Trash2 size={14} /> Borrar
                    </button>
                  </div>
                  {deletingId === vehicle.id && (
                    <div className="admin-vehicle-row__confirm">
                      <label className="auth-form__field">
                        <span className="label">Escriba <strong>{vehicle.title.trim().replace(/\s+/g, ' ')}</strong> para confirmar el borrado</span>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(event) => setDeleteConfirmation(event.target.value)}
                          autoComplete="off"
                        />
                      </label>
                      {error && <p className="auth-form__error" role="alert">{error}</p>}
                      <div className="admin-vehicle-row__confirm-actions">
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setDeletingId(null)
                            setDeleteConfirmation('')
                            setError('')
                          }}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(vehicle)}
                          disabled={saving || normalizeVehicleName(deleteConfirmation) !== normalizeVehicleName(vehicle.title)}
                        >
                          <Trash2 size={14} /> {saving ? 'Borrando...' : 'Confirmar borrado'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="admin-panel__back" onClick={() => setView('list')}>Volver al inventario</button>
            <form className="admin-form" onSubmit={handleSubmit}>
              {fields.map(([name, label, type = 'text']) => (
                <label className="auth-form__field" key={name}>
                  <span className="label">{label}</span>
                  <input name={name} type={type} value={form[name]} onChange={updateField} required={['make', 'model', 'year', 'price', 'vin'].includes(name)} min={type === 'number' ? 0 : undefined} />
                </label>
              ))}
              {error && <p className="auth-form__error">{error}</p>}
              <button className="btn btn-primary auth-form__submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tarjeta'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
