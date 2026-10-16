import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, GitCompareArrows, Heart, FileDown, ChevronLeft, ChevronRight,
  ShieldCheck, Lock, Car, FileText, FileSignature, ArrowRight, Phone, BadgeCheck,
} from 'lucide-react'
import { useVehicleCatalog } from '../context/VehicleCatalogContext.jsx'
import { formatUSD } from '../services/priceEstimate.js'
import { generateTechnicalSheet, generateLegalInfo, generateSalesAgreement } from '../utils/documentGenerator.js'
import { generateInsight, generateDescription } from '../services/vehicleInsights.js'
import { getVehicleImageGallery } from '../services/imaginStudio.js'
import { getAssignedAgent, getUnitCode } from '../services/conciergeAgents.js'
import RobotIcon from './icons/RobotIcon.jsx'

const SPEC_ROWS = [
  ['Motor', (v) => v.engine],
  ['Potencia', (v) => `${v.horsepower} hp`],
  ['Transmisión', (v) => v.transmission],
  ['Tracción', (v) => v.drivetrain],
  ['Combustible', (v) => v.fuelType],
  ['Rendimiento', (v) => (v.mpg ? `${v.mpg} mpg` : 'N/A')],
  ['Carrocería', (v) => v.bodyType],
  ['Puertas', (v) => v.doors],
  ['Asientos', (v) => v.seats],
  ['Color', (v) => v.color],
  ['Kilometraje', (v) => `${v.mileage.toLocaleString()} km`],
  ['Condición', (v) => v.condition],
]

const GALLERY_TAGS = ['Exterior', 'Perfil', 'Llantas', 'Detalle', 'Estudio']

function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    const scrollY = window.scrollY
    const html = document.documentElement
    const body = document.body
    const originalHtmlOverflow = html.style.overflow
    const originalBodyOverflow = body.style.overflow
    const originalBodyPosition = body.style.position
    const originalBodyTop = body.style.top
    const originalBodyWidth = body.style.width

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      html.style.overflow = originalHtmlOverflow
      body.style.overflow = originalBodyOverflow
      body.style.position = originalBodyPosition
      body.style.top = originalBodyTop
      body.style.width = originalBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}

export default function VehicleDetailPage({ vehicle, onClose, advisorMode, onActivateAdvisor, onOpenChat, onOpenBooking }) {
  const { toggleCompare, compareIds } = useVehicleCatalog()
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const [saved, setSaved] = useState(false)

  useBodyScrollLock(!!vehicle)

  useEffect(() => {
    setActiveIndex(0)
    setImageFailed(false)
  }, [vehicle])

  const gallery = useMemo(
    () => (vehicle ? getVehicleImageGallery(vehicle) : []),
    [vehicle],
  )

  if (!vehicle) return null

  const isComparing = compareIds.includes(vehicle.id)
  const insightTips = generateInsight(vehicle)
  const activeImage = gallery[activeIndex]
  const monthlyEstimate = Math.round(vehicle.price * 0.9 * 0.012)
  const netPrice = Math.round(vehicle.price * 0.87)
  const agent = getAssignedAgent(vehicle)
  const unitCode = getUnitCode(vehicle)
  const description = generateDescription(vehicle)

  function showPrev() {
    setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length)
  }
  function showNext() {
    setActiveIndex((i) => (i + 1) % gallery.length)
  }

  return (
    <div className="vdp">
      <div className="vdp__breadcrumb">
        <div className="container vdp__breadcrumb-inner">
          <button className="vdp__back" onClick={onClose}>
            <ArrowLeft size={14} strokeWidth={1.75} /> Catálogo
          </button>

          <nav className="vdp__crumbs">
            <span>Inicio</span> <span className="vdp__crumb-sep">/</span>
            <span>Vehículos</span> <span className="vdp__crumb-sep">/</span>
            <span>{vehicle.bodyType}</span> <span className="vdp__crumb-sep">/</span>
            <span className="is-current">{vehicle.title}</span>
          </nav>

          <div className="vdp__crumb-actions">
            <button className={`chip ${isComparing ? 'is-active' : ''}`} onClick={() => toggleCompare(vehicle.id)}>
              <GitCompareArrows size={13} strokeWidth={1.75} /> Comparar
            </button>
            <button className={`chip ${saved ? 'is-active' : ''}`} onClick={() => setSaved((s) => !s)}>
              <Heart size={13} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} /> Guardar
            </button>
            <button className="chip" onClick={() => generateTechnicalSheet(vehicle)}>
              <FileDown size={13} strokeWidth={1.75} /> Dossier
            </button>
          </div>
        </div>
      </div>

      <div className="vdp__scroll">
        <div className="container vdp__body">
          <div className="vdp__gallery">
            <div className="vdp__gallery-frame">
              <div className="vdp__gallery-backdrop" />
              {activeImage && !imageFailed ? (
                <img src={activeImage} alt={vehicle.title} onError={() => setImageFailed(true)} />
              ) : (
                <div className="modal__gallery-fallback"><span>{vehicle.make}</span></div>
              )}
              <span className="vdp__watermark">ESCOR</span>
              {gallery.length > 1 && (
                <>
                  <button className="modal__gallery-nav modal__gallery-nav--prev" onClick={showPrev} aria-label="Foto anterior">
                    <ChevronLeft size={20} strokeWidth={1.75} />
                  </button>
                  <button className="modal__gallery-nav modal__gallery-nav--next" onClick={showNext} aria-label="Foto siguiente">
                    <ChevronRight size={20} strokeWidth={1.75} />
                  </button>
                </>
              )}
            </div>

            <div className="vdp__tags">
              {GALLERY_TAGS.map((tag, i) => (
                <span key={tag} className={`vdp__tag ${i === activeIndex ? 'is-active' : ''}`} onClick={() => setActiveIndex(i)}>
                  {tag}
                </span>
              ))}
            </div>

            {gallery.length > 1 && (
              <div className="modal__gallery-thumbs vdp__thumbs">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    className={`modal__gallery-thumb ${i === activeIndex ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                  >
                    <img src={src} alt={`${vehicle.title} foto ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="vdp__info">
            <div className="vdp__badges">
              <span className="vdp__badge vdp__badge--outline">
                <ShieldCheck size={12} strokeWidth={1.75} /> Certificado ESCOR · 150 puntos
              </span>
            </div>
            <span className="vdp__unit-code">UNIDAD #{unitCode}</span>

            <h1 className="vdp__title">{vehicle.title}</h1>
            <p className="vdp__subtitle">{vehicle.bodyType} · {vehicle.transmission} · {vehicle.location}</p>
            <p className="vdp__description">{description}</p>

            <div className="vdp__price-block">
              <div>
                <span className="label">Precio de lista</span>
                <span className="vdp__price">{formatUSD(vehicle.price)}</span>
                <span className="vdp__price-note">Precio neto sin impuestos: {formatUSD(netPrice)}</span>
              </div>
              <div>
                <span className="label">Financiamiento ESCOR</span>
                <span className="vdp__price-secondary">Desde {formatUSD(monthlyEstimate)}/mes</span>
              </div>
            </div>

            <button className="btn btn-primary vdp__cta-primary" onClick={onOpenBooking}>
              <Lock size={16} strokeWidth={1.75} /> Reservar cita privada e inspección
            </button>
            <div className="vdp__cta-row">
              <button className="btn btn-outline" onClick={onOpenChat}>
                <Car size={15} strokeWidth={1.75} /> Prueba de manejo
              </button>
              <button className="btn btn-outline" onClick={() => generateTechnicalSheet(vehicle)}>
                <FileText size={15} strokeWidth={1.75} /> Dossier PDF
              </button>
            </div>

            <div className="vdp__concierge">
              <span className="insight-card__icon-wrap"><BadgeCheck size={16} strokeWidth={1.75} /></span>
              <div className="vdp__concierge-info">
                <span className="label label--gold">Asesor asignado</span>
                <span className="vdp__concierge-name">{agent.name} · Canal directo</span>
              </div>
              <span className="vdp__concierge-phone"><Phone size={13} strokeWidth={1.75} /> {agent.phone}</span>
            </div>
          </div>
        </div>

        <div className="container vdp__details">
          {insightTips.length > 0 && (
            <div className="insight-card hairline-gold">
              <div className="insight-card__header">
                <span className="insight-card__icon-wrap"><RobotIcon size={16} /></span>
                <span className="label label--gold">Dato IA</span>
              </div>
              <ul className="insight-card__list">
                {insightTips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          )}

          <h3 className="modal__section-title">Ficha técnica</h3>
          <div className="spec-matrix">
            {SPEC_ROWS.map(([label, getValue], i) => (
              <div className={`spec-matrix__row ${i % 2 === 1 ? 'is-alt' : ''}`} key={label}>
                <span className="label">{label}</span>
                <span className="spec-matrix__value">{getValue(vehicle)}</span>
              </div>
            ))}
          </div>

          <h3 className="modal__section-title">Información legal (simulada)</h3>
          <div className="spec-matrix">
            <div className="spec-matrix__row">
              <span className="label">VIN</span>
              <span className="spec-matrix__value">{vehicle.vin}</span>
            </div>
            <div className="spec-matrix__row is-alt">
              <span className="label">Estado legal</span>
              <span className="spec-matrix__value">Sin gravámenes registrados</span>
            </div>
          </div>

          <div className="modal__actions">
            <button className="btn btn-outline" onClick={() => generateLegalInfo(vehicle)}>
              <ShieldCheck size={16} strokeWidth={1.75} /> Info legal PDF
            </button>
            <button className="btn btn-outline" onClick={() => generateSalesAgreement(vehicle)}>
              <FileSignature size={16} strokeWidth={1.75} /> Compraventa PDF
            </button>
          </div>
        </div>
      </div>

      {advisorMode === true ? (
        <aside className="advisor-dock advisor-dock--floating glass hairline-gold">
          <div className="advisor-dock__header">
            <span className="insight-card__icon-wrap"><RobotIcon size={16} /></span>
            <span className="label label--gold">Asesor IA</span>
          </div>
          <p className="advisor-dock__vehicle">{vehicle.title}</p>
          <ul className="insight-card__list">
            {insightTips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
          <button className="btn btn-outline advisor-dock__cta" onClick={onOpenChat}>
            Preguntar en el chat <ArrowRight size={14} strokeWidth={1.75} />
          </button>
        </aside>
      ) : (
        <aside className="advisor-dock advisor-dock--floating advisor-dock--collapsed glass hairline">
          <span className="insight-card__icon-wrap"><RobotIcon size={16} /></span>
          <p>¿Activar asesor IA?</p>
          <button className="btn btn-primary" onClick={onActivateAdvisor}>Activar</button>
        </aside>
      )}
    </div>
  )
}
